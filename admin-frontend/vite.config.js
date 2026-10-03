import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// O painel admin e uma build SEPARADA (o codigo do dono nunca entra aqui), mas
// partilha o design system do frontend: `@ui` aponta para os componentes e os
// tokens. `dedupe` garante uma unica copia do React.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, '../frontend/src/components/ui'),
      '@tokens': path.resolve(__dirname, '../frontend/src/ui/tokens.css'),
    },
    dedupe: ['react', 'react-dom', 'lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    fs: { allow: ['..'] },
    // Mesma origem para os cookies de sessao do painel (como no frontend).
    proxy: { '/api': { target: process.env.GENESIS_API_URL || 'http://127.0.0.1:4000', changeOrigin: true } },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
