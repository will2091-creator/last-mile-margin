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
  build: {
    rollupOptions: {
      output: {
        // Split heavy, cache-stable vendor libs out of the app bundle.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("recharts") || id.includes("/d3-") || id.includes("victory-vendor")) return "charts";
          if (id.includes("framer-motion") || id.includes("motion-dom") || id.includes("motion-utils")) return "motion";
          if (id.includes("@supabase")) return "supabase";
          return undefined;
        },
      },
    },
  },
})
