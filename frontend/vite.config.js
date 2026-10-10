import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // O jsPDF traz partes opcionais (html2canvas, DOMPurify, canvg) que o
      // Genesis nao usa: so carregam com doc.html()/SVG. Nao vao para a cache
      // offline (~380 KB a menos na instalacao).
      workbox: { globIgnores: ['**/html2canvas*', '**/purify*', '**/index.es-*'] },
      manifest: {
        name: 'Genesis POS',
        short_name: 'Genesis',
        description: 'Gestão comercial e ponto de venda para lojas em Moçambique.',
        theme_color: '#FAFAF9',
        background_color: '#FAFAF9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.GENESIS_API_URL || 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
});
