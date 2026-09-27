import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

/* ==========================================================================
   BOTAO DE TEMA: lua = esta no escuro (clica para claro) / sol = esta no claro.
   Presente no login, no shell do dono, no POS, no Hub e no painel de super
   admin - pedido explicito do fundador: tem de dar para trocar em TODAS as
   telas, comecando pela de login.
   ========================================================================== */

export default function ThemeToggle({
  className = '',
  showLabel = false,
  compact = false,
  size = 16,
  float = false,
}) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const title = isLight
    ? 'Mudar para modo escuro (vermelho e preto)'
    : 'Mudar para modo claro (azul-piscina)';

  const cls = [
    'theme-toggle',
    compact ? 'theme-toggle-compact' : '',
    float ? 'theme-toggle-float' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cls}
      title={title}
      aria-label={title}
      aria-pressed={isLight}
      data-theme-state={theme}
    >
      <span className="theme-toggle-icon">
        {isLight
          ? <Sun size={size} strokeWidth={2.3} aria-hidden="true" />
          : <Moon size={size} strokeWidth={2.3} aria-hidden="true" />}
      </span>
      {showLabel && (
        <span className="theme-toggle-label">{isLight ? 'Modo claro' : 'Modo escuro'}</span>
      )}
    </button>
  );
}
