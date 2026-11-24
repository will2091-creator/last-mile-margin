import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleAiApi } from './server/aiApi.js'

const fromRoot = (path) => fileURLToPath(new URL(path, import.meta.url))

// Public free-tool pages at /tools/<slug>. Each is a static, indexable HTML page
// (tools/<slug>/index.html) with a small React island for the calculator (src/tools/).
// Add a slug here when you add a tool, plus a line in public/sitemap.xml.
const TOOL_SLUGS = [
  'route-profit-calculator',
  'contract-rate-checker',
  'chargeback-dispute-letter',
  'driver-pay-calculator',
]

// Inlines shared markup from tools/_partials into the tool pages, so the static
// pages share one header, footer and call-to-action without a framework.
//   <!--@name-->        → tools/_partials/name.html
//   <!--@name:slug-->   → same, with {{from}} set to slug (used for sign-up attribution);
//                         in the "related" partial, the card for that slug is dropped.
function toolPartials() {
  return {
    name: 'lmm-tool-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes('<!--@')) return html
        return html.replace(/<!--@([a-z]+)(?::([a-z0-9-]+))?-->/g, (_, name, from = 'tools') =>
          readFileSync(fromRoot(`./tools/_partials/${name}.html`), 'utf8')
            .replace(new RegExp(`<!--card:${from}-->[\\s\\S]*?<!--/card-->`), '')
            .replaceAll('{{from}}', from),
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [
    {
      name: 'final-mile-ai-api',
      configureServer(server) {
        server.middlewares.use(handleAiApi)
      },
    },
    toolPartials(),
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: fromRoot('./index.html'),
        tools: fromRoot('./tools/index.html'),
        ...Object.fromEntries(TOOL_SLUGS.map((slug) => [`tools-${slug}`, fromRoot(`./tools/${slug}/index.html`)])),
      },
      output: {
        // Split heavy, cache-stable vendor libs out of the app bundle. React gets its own
        // chunk (highest priority) so the light tool pages don't pull in charts/motion,
        // which would otherwise absorb React as one of their dependencies.
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 40 },
            { name: "charts", test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/, priority: 30 },
            { name: "motion", test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
            { name: "supabase", test: /node_modules[\\/]@supabase[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
