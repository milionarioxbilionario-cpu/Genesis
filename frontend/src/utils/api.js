import axios from 'axios';

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

export const SESSION_MESSAGES = {
  PASSWORD_CHANGED: 'A senha desta conta foi alterada. Entre de novo.',
  ACCOUNT_INACTIVE: 'Esta conta foi desactivada. Fale com o dono da loja.',
  SESSION_EXPIRED: 'A sessão expirou. Entre de novo.',
  NO_SESSION: 'Entre para continuar.',
  TENANT_BLOCKED: 'A conta da loja está suspensa. Contacte o suporte Genesis.',
  SESSION_INVALID: 'A sessão deixou de ser válida. Entre de novo.',
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

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const cfg = error.config || {};
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const url = cfg.url || '';

    if (status === 401 && !cfg.__retried && !NO_REFRESH.some((p) => url.startsWith(p))) {
      cfg.__retried = true;
      // Conta desactivada / senha mudada: o refresh tambem falharia.
      if (code !== 'ACCOUNT_INACTIVE' && code !== 'PASSWORD_CHANGED') {
        const result = await refreshOnce();
        if (result === true) return api(cfg);
      }
      if (!cfg.silent) window.dispatchEvent(new CustomEvent('genesis:session-ended', { detail: { code: code || 'SESSION_EXPIRED' } }));
    } else if (status === 403 && code === 'TENANT_BLOCKED' && !cfg.silent) {
      window.dispatchEvent(new CustomEvent('genesis:session-ended', { detail: { code } }));
    }
    return Promise.reject(error);
  },
);

export default api;
