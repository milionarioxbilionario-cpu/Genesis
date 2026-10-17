// Lingua da interface (Fase 9.3). O portugues e a lingua de origem: a CHAVE e
// o proprio texto em portugues (t('Entrar')). O ingles vive em dicionarios por
// area (i18n/en/*.js), carregados junto com o codigo dessa area: o terminal nao
// descarrega as traducoes do painel. Sem traducao -> fica o portugues (nunca
// uma chave crua no ecra). Partilhado com o admin-frontend (alias @i18n); cada
// build so leva os dicionarios que importa.
export const LANGUAGES = ['pt', 'en'];
const STORAGE_KEY = 'genesis.lang';

const dicts = { en: {} };
const listeners = new Set();

export function storedLang() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(v) ? v : null;
  } catch { return null; }
}

let current = (typeof window !== 'undefined' && storedLang()) || 'pt';

export function addTranslations(lang, entries) {
  dicts[lang] = Object.assign(dicts[lang] || {}, entries);
}

export const getLang = () => current;

// Numeros e datas na lingua escolhida (en-GB: dia antes do mes, como em MZ).
export const locale = () => (current === 'en' ? 'en-GB' : 'pt-PT');

// remember=false: muda so o ecra (ex.: lingua do caixista no terminal, sem
// mexer na lingua guardada do aparelho).
export function setLang(lang, { remember = true } = {}) {
  if (!LANGUAGES.includes(lang)) return;
  if (remember) {
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch { /* modo privado */ }
  }
  if (lang === current) return;
  current = lang;
  if (typeof document !== 'undefined') document.documentElement.lang = lang === 'en' ? 'en' : 'pt';
  listeners.forEach((fn) => fn(lang));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// t('Restam {n} tentativa(s).', { n: 2 })
export function t(text, vars) {
  const src = String(text ?? '');
  const out = current === 'pt' ? src : (dicts[current]?.[src] ?? src);
  if (!vars) return out;
  return out.replace(/\{(\w+)\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m));
}

// Ha traducao desta chave na lingua actual? (portugues = sempre a origem.)
export const hasTranslation = (key) => current !== 'pt' && Object.prototype.hasOwnProperty.call(dicts[current] || {}, key);

// So para os testes: as chaves conhecidas de uma lingua.
export const knownKeys = (lang) => Object.keys(dicts[lang] || {});
