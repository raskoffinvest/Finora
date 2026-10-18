// Gemini ile şirket ve portföy yorumu üreten küçük sunucu katmanı.
// API anahtarı yalnızca sunucuda okunur (GEMINI_API_KEY); tarayıcıya hiçbir zaman gönderilmez.
// Vite geliştirme/önizleme sunucusuna eklenti olarak bağlanır (vite.config.ts).

import { createHash } from 'node:crypto'

const DEFAULT_MODEL = 'gemini-flash-latest'
const MAX_BODY_BYTES = 64 * 1024
const cache = new Map() // aynı veriyle tekrar istenen yorumlar için bellek içi önbellek

const SYSTEM = `Sen Borsa İstanbul şirketlerini temel analizle değerlendiren deneyimli bir analistsin.
Kurallar:
- Yalnızca sana verilen verilere dayan; veride olmayan bilgi, haber veya tahmin uydurma.
- Türkçe, sade ve somut yaz; her tespiti ilgili rakamla destekle.
- "Al", "sat", "tut" gibi yatırım tavsiyesi verme; hedef fiyat söyleme.
- Eksik veri varsa bunu açıkça belirt.
- Türkiye'de yüksek enflasyon ve TMS 29 enflasyon muhasebesi nedeniyle nominal büyüme oranlarının yanıltıcı olabileceğini gerektiğinde hatırlat.`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING', description: '2-3 cümlelik genel değerlendirme' },
    strengths: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Güçlü yönler, 2-4 madde' },
    risks: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Risk noktaları, 2-4 madde' },
    outlook: { type: 'STRING', description: 'Verilere göre büyüme/gelişim potansiyeli, 2-3 cümle' },
  },
  required: ['summary', 'strengths', 'risks', 'outlook'],
}

function buildPrompt(kind, payload) {
  if (kind === 'stock') {
    return `Aşağıdaki şirketi değerlendir. Güçlü yönlerini, risk noktalarını ve büyüme potansiyelini çıkar.

Skor açıklamaları: Piotroski F-Score 0-9 (7+ güçlü); Altman Z-Score (>2,99 güvenli, <1,81 sıkıntı);
Beneish M-Score (>-1,78 yüksek manipülasyon riski); Değerleme Skoru 0-100 (yüksek = sektörüne göre ucuz);
Finora Skoru 0-10 (kârlılık, büyüme, sağlık, borçluluk ve değerlemenin bileşimi).

Şirket verisi (JSON):
${JSON.stringify(payload)}`
  }
  return `Aşağıdaki hisse portföyünü değerlendir: çeşitlendirme, sektör yoğunlaşması, risk/getiri dengesi,
skor kalitesi ve temettü profili. Güçlü yönleri, risk noktalarını ve iyileştirme alanlarını (genel ilke
olarak, belirli hisse önermeden) çıkar.

Portföy verisi (JSON):
${JSON.stringify(payload)}`
}

async function callGemini({ apiKey, model, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = body?.error?.message ?? `HTTP ${res.status}`
    throw Object.assign(new Error(`Gemini: ${message}`), { status: res.status === 429 ? 429 : 502 })
  }
  const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
  try {
    return JSON.parse(text)
  } catch {
    throw Object.assign(new Error('Gemini beklenen biçimde yanıt vermedi'), { status: 502 })
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('İstek çok büyük'), { status: 413 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function send(res, status, data) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

export function createAiHandler(env) {
  return async function aiHandler(req, res) {
    if (req.method !== 'POST') return send(res, 405, { error: 'Yalnızca POST' })
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey) {
      return send(res, 503, {
        error: 'GEMINI_API_KEY tanımlı değil. Proje kökünde .env.local dosyasına ekleyip sunucuyu yeniden başlatın.',
      })
    }
    try {
      const { kind, payload } = JSON.parse(await readBody(req))
      if (kind !== 'stock' && kind !== 'portfolio') return send(res, 400, { error: 'Geçersiz istek türü' })
      const model = env.GEMINI_MODEL || DEFAULT_MODEL
      const prompt = buildPrompt(kind, payload)
      const key = createHash('sha256').update(model + prompt).digest('hex')
      if (!cache.has(key)) cache.set(key, await callGemini({ apiKey, model, prompt }))
      return send(res, 200, { model, result: cache.get(key) })
    } catch (err) {
      return send(res, err.status ?? 500, { error: err.message ?? 'Bilinmeyen hata' })
    }
  }
}
