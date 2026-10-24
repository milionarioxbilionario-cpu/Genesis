// Site publico (Fase 11): o unico JavaScript da landing. O conteudo esta todo
// no HTML (os motores de busca e as IAs leem-no sem correr isto).
import './site.css';

const PAGE_LANG = document.documentElement.lang.startsWith('en') ? 'en' : 'pt';
const LANG_KEY = 'genesis.lang'; // a mesma chave de src/i18n/core.js
const params = new URLSearchParams(location.search);

// 1) App instalada no ecra principal (o iPhone guarda o start_url antigo "/"):
//    abre logo a app, sem mostrar o site.
const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// 2) Quem ja tem sessao (dono -> painel, caixista -> terminal) ou um browser
//    emparelhado como terminal segue directo. "?site" mostra sempre o site.
//    O Googlebot nao tem sessao: ve sempre a pagina.
async function forwardIfSignedIn() {
  try {
    const me = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (me.ok) {
      const role = (await me.json())?.user?.role;
      if (role === 'owner') return location.replace('/app');
      if (role === 'cashier') return location.replace('/terminal');
    }
    const term = await fetch('/api/pos/terminal', { credentials: 'same-origin' });
    if (term.ok) location.replace('/terminal');
  } catch { /* sem rede: fica no site */ }
}

if (standalone) location.replace('/inicio');
else if (!params.has('site')) forwardIfSignedIn();

// Ao entrar na app a partir do site, a app abre na lingua da pagina (o ingles
// fica sempre; o portugues so se o aparelho ainda nao tiver escolhido).
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-app]');
  if (!a) return;
  try {
    if (PAGE_LANG === 'en' || !localStorage.getItem(LANG_KEY)) localStorage.setItem(LANG_KEY, PAGE_LANG);
  } catch { /* modo privado */ }
});

// Menu no telemovel.
const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.hasAttribute('hidden');
    if (open) menu.removeAttribute('hidden'); else menu.setAttribute('hidden', '');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) { menu.setAttribute('hidden', ''); toggle.setAttribute('aria-expanded', 'false'); } });
}
