import { useState } from 'react'
import { requestAi, type AiKind, type AiResult } from '../lib/ai'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; model: string; result: AiResult }

export function AiCommentary({ kind, payload, cta }: { kind: AiKind; payload: unknown; cta: string }) {
  const [state, setState] = useState<State>({ status: 'idle' })

  const run = async () => {
    setState({ status: 'loading' })
    try {
      const { model, result } = await requestAi(kind, payload)
      setState({ status: 'done', model, result })
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message })
    }
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return (
      <button
        type="button"
        onClick={run}
        disabled={state.status === 'loading'}
        className="rounded-lg border border-[var(--brand)] px-4 py-2 text-sm font-medium text-[var(--brand)] enabled:hover:bg-[var(--brand)]/5 disabled:opacity-60"
      >
        {state.status === 'loading' ? 'Yapay zekâ yorumu hazırlanıyor…' : cta}
      </button>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-2">
        <p className="rounded-lg bg-[var(--status-critical)]/10 p-3 text-sm text-[var(--status-critical)]">{state.message}</p>
        <button type="button" onClick={run} className="text-sm text-[var(--brand)] hover:underline">
          Tekrar dene
        </button>
      </div>
    )
  }

  const { result } = state
  return (
    <div className="space-y-4 text-sm">
      <p className="leading-relaxed">{result.summary}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-1 font-medium text-[var(--status-good)]">Güçlü yönler</h4>
          <ul className="list-disc space-y-1 pl-5">
            {result.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-1 font-medium text-[var(--status-critical)]">Risk noktaları</h4>
          <ul className="list-disc space-y-1 pl-5">
            {result.risks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      <div>
        <h4 className="mb-1 font-medium">Potansiyel</h4>
        <p className="leading-relaxed">{result.outlook}</p>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        {state.model} tarafından yalnızca Finora verileriyle üretildi; hata içerebilir ve yatırım tavsiyesi değildir.
      </p>
    </div>
  )
}
