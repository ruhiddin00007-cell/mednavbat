/**
 * vite.config.example.js
 * ──────────────────────────────────────────────────────────────────────────
 * Ushbu faylni vite.config.js ga ko'chirib, server { proxy } qismini qo'shing.
 *
 * Bu konfiguratsiya:
 *  - /api/* so'rovlarini http://localhost:3001 ga proksilaydi
 *  - Backend server alohida terminalda ishlab turishi kerak (cd server && npm run dev)
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { createApiMiddleware } from './src/api/serverMiddleware.js';

function mednavbatApiPlugin() {
  return {
    name: 'mednavbat-api-plugin',
    configureServer(server) {
      server.middlewares.use(createApiMiddleware());
    }
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), mednavbatApiPlugin()],
  build: {
    chunkSizeWarningLimit: 700,
  },

  // ── Backend proxy (SMS + QR Ticket uchun) ──────────────────────────────────
  // DIQQAT: Faqat /api/auth/* va /api/tickets/* so'rovlari tashqi backendga boради.
  // Boshqa /api/* endpointlari mednavbatApiPlugin() orqali local ishlayди.
  server: {
    proxy: {
      '/api/auth': {
        target:      'http://localhost:3001',
        changeOrigin: true,
        secure:       false,
      },
      '/api/tickets': {
        target:      'http://localhost:3001',
        changeOrigin: true,
        secure:       false,
      }
    }
  }
});
