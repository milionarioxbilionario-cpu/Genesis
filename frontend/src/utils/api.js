import axios from 'axios';
import { getLang } from '../i18n/core.js';

// Cliente HTTP unico (Genesis 2.0). Cookies httpOnly — o token nunca passa
// pelo JavaScript.
//
// Ponto (C) — quando a sessao cai:
//  1. 401 numa rota normal -> tenta UMA vez POST /api/refresh e repete o pedido;
//  2. se o refresh falhar, emite o evento `genesis:session-ended` com o motivo
//     (senha mudou, conta desactivada, expirou...). O App mostra a mensagem
//     certa e leva ao ecra de entrada. A fila offline (IndexedDB) NAO e tocada:
//     as vendas pendentes sincronizam quando houver sessao/terminal de novo.
const api = axios.create({ baseURL: '/', withCredentials: true });

// 9.6: a lingua do ecra vai em cada pedido. O servidor usa-a nas mensagens que
// escreve para fora (WhatsApp ao fornecedor, alertas, codigo de recuperacao):
// saem na lingua de quem as gera (backend/src/utils/lang.js).
// Etapa D (31/10): o estabelecimento que ESTA pagina mostra vai em cada pedido.
// O cookie da sessao e o mesmo em todos os separadores: trocar de estabelecimento
// num mudava o outro em silencio e ele passava a gravar no estabelecimento errado.
// Agora o servidor recusa (409 ESTABLISHMENT_CHANGED) e a pagina recarrega.
let shownEstablishment = null;
export function setShownEstablishment(id) { shownEstablishment = id || null; }
const ESTABLISHMENT_CHANNEL = 'genesis-establishment';
// Depois de trocar: os outros separadores recarregam logo, sem esperar pelo proximo pedido.
export function announceEstablishmentChange(id) {
  try { const c = new BroadcastChannel(ESTABLISHMENT_CHANNEL); c.postMessage(id); c.close(); } catch { /* browser antigo: fica o 409 */ }
}
export function onEstablishmentChange(fn) {
  try { const c = new BroadcastChannel(ESTABLISHMENT_CHANNEL); c.onmessage = (e) => fn(e.data); return () => c.close(); } catch { return () => {}; }
}

api.interceptors.request.use((cfg) => {
  cfg.headers = cfg.headers || {};
  cfg.headers['X-Genesis-Lang'] = getLang();
  if (shownEstablishment) cfg.headers['X-Genesis-Establishment'] = shownEstablishment;
  return cfg;
});

export const SESSION_MESSAGES = {
  PASSWORD_CHANGED: 'A senha desta conta foi alterada. Entre de novo.',
  ACCOUNT_INACTIVE: 'Esta conta foi desactivada. Fale com o dono da loja.',
  SESSION_EXPIRED: 'A sessão expirou. Entre de novo.',
  NO_SESSION: 'Entre para continuar.',
  TENANT_BLOCKED: 'A conta da loja está suspensa. Contacte o suporte Genesis.',
  SESSION_INVALID: 'A sessão deixou de ser válida. Entre de novo.',
  LOCK_TOO_MANY: 'Demasiados PINs errados. Entre de novo com o email e a senha.',
};

const NO_REFRESH = ['/api/auth/login', '/api/auth/google', '/api/refresh', '/api/auth/support', '/api/pos/login', '/api/pos/pair'];

let refreshing = null;
function refreshOnce() {
  if (!refreshing) {
    refreshing = axios.post('/api/refresh', null, { withCredentials: true })
      .then(() => true)
      .catch((err) => err?.response?.data?.code || 'SESSION_EXPIRED')
      .finally(() => { setTimeout(() => { refreshing = null; }, 0); });
  }
  return refreshing;
}

// Fase 16: a senha mudada NESTE aparelho invalida os pedidos que ja iam a caminho
// com a sessao antiga (ex.: o sino). Esses esperam pelos cookies novos e repetem-se,
// em vez de fecharem a sessao (em producao, com a rede mais lenta, acontecia).
let ownChange = null;
let ownChangeAt = 0;
export function trackOwnCredentialChange(promise) {
  ownChange = Promise.resolve(promise).catch(() => {});
  ownChangeAt = Date.now();
  return promise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const cfg = error.config || {};
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const url = cfg.url || '';

    if (status === 401 && code === 'PASSWORD_CHANGED' && ownChange && !cfg.__ownRetry && Date.now() - ownChangeAt < 30000) {
      cfg.__ownRetry = true;
      await ownChange;
      return api(cfg);
    }
    if (status === 401 && !cfg.__retried && !NO_REFRESH.some((p) => url.startsWith(p))) {
      cfg.__retried = true;
      // Conta desactivada / senha mudada: o refresh tambem falharia.
      if (code !== 'ACCOUNT_INACTIVE' && code !== 'PASSWORD_CHANGED') {
        const result = await refreshOnce();
        if (result === true) return api(cfg);
      }
      if (!cfg.silent) window.dispatchEvent(new CustomEvent('genesis:session-ended', { detail: { code: code || 'SESSION_EXPIRED' } }));
    } else if (status === 423 && code === 'PANEL_LOCKED') {
      // 12.4: painel do dono bloqueado (5 min sem mexer). O ecra do PIN aparece.
      window.dispatchEvent(new CustomEvent('genesis:panel-locked'));
    } else if (status === 403 && code === 'TENANT_BLOCKED' && !cfg.silent) {
      window.dispatchEvent(new CustomEvent('genesis:session-ended', { detail: { code } }));
    } else if (status === 409 && code === 'ESTABLISHMENT_CHANGED') {
      window.location.reload();
    } else if (status === 403 && code === 'ESTABLISHMENT_FORBIDDEN' && !cfg.__home) {
      // Etapa D: o acesso a este estabelecimento foi retirado. Volta ao de casa
      // (uma vez) em vez de mostrar erros em todas as paginas.
      cfg.__home = true;
      try { await api.post('/api/establishments/home', null, { silent: true, __home: true }); window.location.assign('/app'); } catch { /* fica o erro */ }
    }
    return Promise.reject(error);
  },
);

export default api;

// Guarda a lingua escolhida na conta de quem esta a usar (Fase 9.3). Sem rede
// fica so no ecra (e no aparelho); a proxima escolha volta a tentar.
export function saveLanguage(language) {
  return api.put('/api/auth/language', { language }, { silent: true }).catch(() => {});
}
