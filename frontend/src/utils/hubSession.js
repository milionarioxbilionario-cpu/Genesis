// Sessão do Hub de Caixistas (modo quiosque do balcão).
// O PC do balcão fica logado como owner; o vendedor activo (caixista
// cujo perfil + senha foram usados para entrar) vive em sessionStorage
// para não sobreviver ao fechar o browser.
const HUB_SELLER_KEY = 'genesis_hub_seller';

export function getHubSeller() {
  try {
    const raw = sessionStorage.getItem(HUB_SELLER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setHubSeller(cashier) {
  sessionStorage.setItem(HUB_SELLER_KEY, JSON.stringify(cashier));
}

export function clearHubSeller() {
  try { sessionStorage.removeItem(HUB_SELLER_KEY); } catch { /* noop */ }
}
