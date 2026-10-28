import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { createApiMiddleware } from './src/api/serverMiddleware.js'

function mednavbatApiPlugin() {
  return {
    name: 'mednavbat-api-plugin',
    configureServer(server) {
      server.middlewares.use(createApiMiddleware());
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  // '/' — Vercel va Netlify uchun root domendan servis qilinganda to'g'ri ishlaydi
  base: '/',
  plugins: [react(), tailwindcss(), mednavbatApiPlugin()],
  build: {
    // Chunk size ogohlantirish chegarasini oshirish
    chunkSizeWarningLimit: 700,
  },
})

