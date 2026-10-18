import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
// @ts-expect-error -- sade JS sunucu modülü, tip bildirimi yok
import { createAiHandler } from './server/ai.mjs'

// /api/ai uç noktası: Gemini anahtarı yalnızca bu Node sürecinde kalır
function aiApi(env: Record<string, string>): Plugin {
  const handler = createAiHandler(env)
  return {
    name: 'finora-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/ai', handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai', handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' öneki: VITE_ ile başlamayan değişkenler de okunur ama istemci paketine girmez
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), aiApi(env)],
  }
})
