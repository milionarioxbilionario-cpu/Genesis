import React from 'react';
import { LanguageSwitch } from '../../components/ui';
import { useI18n } from '../../i18n/react';
import '../../i18n/en/auth';

// Ecras de entrada: um cartao, um titulo, uma accao. Sem decoracao.
// Antes de entrar a lingua fica no aparelho; depois do login manda a da conta.
export default function AuthLayout({ title, description, children, footer, wide = false }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-16 items-center justify-between gap-3 px-6">
        {/* Link normal (nao do router): a raiz e o site publico, fora da SPA. */}
        <a href="/" className="flex items-center gap-2.5" aria-label="Genesis">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
          <span className="text-md font-semibold tracking-tight text-ink">Genesis</span>
        </a>
        <LanguageSwitch />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:pt-16">
        <div className={wide ? 'w-full max-w-xl' : 'w-full max-w-sm'}>
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {description && <p className="mt-1.5 text-base text-ink-muted">{description}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
      <footer className="px-6 py-5 text-xs text-ink-faint">© {new Date().getFullYear()} Genesis · {t('Gestão comercial para Moçambique')}</footer>
    </div>
  );
}
