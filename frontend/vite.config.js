import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

// Fase 11: o site publico (index.html = landing PT, planos.html, en/) e a app
// (app.html = SPA React: entrar, painel do dono, terminal) saem do mesmo build.
// Em producao o nginx decide qual servir (deploy/nginx.conf); aqui o plugin
// faz o mesmo no `vite` e no `vite preview` (testes e2e).
const SITE_PAGES = { '/': '/index.html', '/planos': '/planos.html', '/en': '/en/index.html', '/en/': '/en/index.html', '/en/pricing': '/en/pricing.html' };
// Rotas da SPA: tudo o que nao e pagina do site, ficheiro, API ou interno do Vite.
const isSpaRoute = (p) => !(p in SITE_PAGES) && !/\.[a-z0-9]+$/i.test(p) && !/^\/(api|@|src\/|node_modules\/)/.test(p);

function siteRoutes() {
  const rewrite = (req, _res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      const [p, q] = req.url.split('?');
      if (p in SITE_PAGES) req.url = SITE_PAGES[p] + (q ? '?' + q : '');
      else if (isSpaRoute(p)) req.url = '/app.html' + (q ? '?' + q : '');
    }
    next();
  };
  return {
    name: 'genesis-site-routes',
    configureServer(server) { server.middlewares.use(rewrite); },
    configurePreviewServer(server) { server.middlewares.use(rewrite); },
  };
}

export default defineConfig({
  plugins: [
    siteRoutes(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'favicon-48.png', 'apple-touch-icon.png'],
      // O jsPDF traz partes opcionais (html2canvas, DOMPurify, canvg) que o
      // Genesis nao usa: so carregam com doc.html()/SVG. Nao vao para a cache
      // offline (~380 KB a menos na instalacao).
      workbox: {
        globIgnores: ['**/html2canvas*', '**/purify*', '**/index.es-*', '**/site/shots/**'],
        // Offline, qualquer rota da app abre a app (terminal incluido). As
        // paginas do site estao pre-guardadas e respondem por si.
        navigateFallback: 'app.html',
        navigateFallbackDenylist: [/^\/$/, /^\/planos\/?$/, /^\/en(\/|$)/, /^\/api\//, /\.[a-z0-9]+$/i],
      },
      manifest: {
        // id fixo = o calculado antes (start_url '/'): a app ja instalada
        // continua a ser a mesma depois da mudanca do start_url.
        id: '/',
        name: 'Genesis POS',
        short_name: 'Genesis',
        lang: 'pt',
        description: 'Gestão comercial e ponto de venda para lojas em Moçambique.',
        theme_color: '#FAFAF9',
        background_color: '#FAFAF9',
        display: 'standalone',
        // A raiz e a landing; /inicio leva o dono ao painel e o caixista ao terminal.
        start_url: '/inicio',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app.html', import.meta.url)),
      }
    }
  },
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
