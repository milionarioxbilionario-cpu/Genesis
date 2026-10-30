import React from 'react';

// Endereco que nao existe na app (tambem tentativas com codigo no endereco): mostra a
// pagina 404 animada (public/404.html, gerada por scripts/gerar_404.mjs) sem mudar o
// endereco e sem nunca o escrever no ecra. Os botoes la dentro abrem na janela toda.
export default function NotFound() {
  return <iframe title="Página não encontrada" src="/404.html" className="fixed inset-0 h-full w-full border-0" />;
}
