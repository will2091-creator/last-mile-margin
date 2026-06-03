import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleAiApi } from './server/aiApi.js'

export default defineConfig({
  plugins: [
    {
      name: 'final-mile-ai-api',
      configureServer(server) {
        server.middlewares.use(handleAiApi)
      },
    },
    react(),
    tailwindcss(),
  ],
})
