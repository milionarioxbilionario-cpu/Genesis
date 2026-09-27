/* ==========================================================================
   TEMA DO PAINEL DE SUPER ADMIN (frontend do admin-frontend)
   --------------------------------------------------------------------------
   Mesma ideia do produto: o tema vive em `data-theme` no <html>, aqui vive
   em `data-theme` no <html> também (script inline no index.html + este
   módulo). O escuro é o Genesis (vermelho/preto); o claro é a piscina
   (ciano/branco) com a mesma animação de água — os dois frontends têm de
   parecer a mesma casa.
   ========================================================================== */

const THEME_KEY = 'genesis.theme';

export function readStoredTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (err) { /* storage bloqueado */ }
  return 'dark';
}

export function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', next);
  }
  return next;
}

export function storeTheme(theme) {
  try { window.localStorage.setItem(THEME_KEY, theme); } catch (err) { /* ignorar */ }
}
