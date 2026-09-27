import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PoolWater from './PoolWater';

/* ==========================================================================
   TEMA DO GENESIS (escuro "sangue" <-> claro "azul-piscina")
   --------------------------------------------------------------------------
   - O tema vive num atributo `data-theme` no <html>. Todos os tokens de
     tokens.css sao reescritos pelo bloco [data-theme="light"] de
     ui/theme-light.css, logo a app inteira muda de uma vez.
   - Grava-se em localStorage (chave `genesis.theme`) para sobreviver a
     recargas. O index.html tem um script inline que aplica o tema ANTES do
     primeiro pixel, para nao haver flash branco ao abrir no modo escuro.
   - Em modo claro monta-se o <PoolWater/>: azulejos, ondas e causticas.
   ========================================================================== */

export const THEME_KEY = 'genesis.theme';

const ThemeContext = createContext({
  theme: 'dark',
  isLight: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (err) { /* modo privado / storage bloqueado */ }
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch (err) { /* ignorar */ }
  }
  return 'dark';
}

// Aplica o tema ao documento (e a meta theme-color, para a barra do browser).
export function applyTheme(next) {
  const theme = next === 'light' ? 'light' : 'dark';
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#eaf7ff' : '#08090c');
  }
  return theme;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    try { window.localStorage.setItem(THEME_KEY, theme); } catch (err) { /* ignorar */ }
  }, [theme]);

  const setTheme = useCallback((next) => setThemeState(next === 'light' ? 'light' : 'dark'), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light')),
    [],
  );

  const value = useMemo(
    () => ({ theme, isLight: theme === 'light', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {theme === 'light' && <PoolWater />}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;
