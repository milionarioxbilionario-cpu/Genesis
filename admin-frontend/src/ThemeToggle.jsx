import React, { useEffect, useState } from 'react';
import { applyTheme, readStoredTheme, storeTheme } from './theme';

/* ==========================================================================
   BOTÃO DE TEMA DO PAINEL DE SUPER ADMIN
   Lua = está no escuro (clica → claro). Sol = está no claro (clica → escuro).
   Mesma chave de localStorage do produto (`genesis.theme`): se o dono escolheu
   o modo claro, o painel da plataforma abre em modo claro também.
   Ícones em SVG inline: o admin-frontend não tem lucide-react e a regra é
   zero dependências novas para um ícone.
   ========================================================================== */

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export default function ThemeToggle({ compact = false, onLogin = false }) {
  const [theme, setTheme] = useState(() => readStoredTheme());

  useEffect(() => { applyTheme(theme); storeTheme(theme); }, [theme]);

  const isLight = theme === 'light';
  const title = isLight ? 'Mudar para modo escuro (vermelho e preto)' : 'Mudar para modo claro (azul-piscina)';

  return (
    <button
      type="button"
      className={'admin-theme-toggle' + (compact ? ' is-compact' : '') + (onLogin ? ' is-login' : '')}
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      title={title}
      aria-label={title}
      aria-pressed={isLight}
    >
      <span className="admin-theme-toggle__icon">{isLight ? <SunIcon /> : <MoonIcon />}</span>
      <span className="admin-theme-toggle__label">{isLight ? 'Modo claro' : 'Modo escuro'}</span>
    </button>
  );
}
