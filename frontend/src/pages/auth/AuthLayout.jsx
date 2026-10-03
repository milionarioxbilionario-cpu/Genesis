import React from 'react';
import { Link } from 'react-router-dom';

// Ecras de entrada: um cartao, um titulo, uma accao. Sem decoracao.
export default function AuthLayout({ title, description, children, footer, wide = false }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Genesis">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
          <span className="text-md font-semibold tracking-tight text-ink">Genesis</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-16">
        <div className={wide ? 'w-full max-w-xl' : 'w-full max-w-sm'}>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1.5 text-base text-ink-muted">{description}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
      <footer className="px-6 py-5 text-xs text-ink-faint">© {new Date().getFullYear()} Genesis · Gestão comercial para Moçambique</footer>
    </div>
  );
}
