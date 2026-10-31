import api, { announceEstablishmentChange } from './api';
import { forgetOwnerData } from './session';

// Etapa D / E2: o dono passa a trabalhar noutro estabelecimento. A sessao nova
// leva o estabelecimento (servidor); os outros separadores sao avisados e tudo o
// que estava guardado no aparelho do anterior e apagado. `to` = onde abrir.
export async function enterEstablishment(id, to = '/app') {
  await api.post('/api/establishments/switch', { tenant_id: id });
  announceEstablishmentChange(id);
  await forgetOwnerData();
  window.location.assign(to);
}

// O hub lembra-se da ultima escolha (neste aparelho), mas mostra-se sempre ao entrar.
const lastKey = (userId) => 'genesis.hub.last.' + (userId || '');
export function lastChoice(userId) { try { return localStorage.getItem(lastKey(userId)); } catch { return null; } }
export function rememberChoice(userId, value) { try { localStorage.setItem(lastKey(userId), value); } catch { /* sem armazenamento */ } }

// Onde abre o dono depois de entrar: o hub quando tem 2 ou mais estabelecimentos.
export async function ownerLanding() {
  try {
    const { data } = await api.get('/api/establishments', { silent: true });
    return Array.isArray(data) && data.length > 1 ? '/escolher' : '/app';
  } catch { return '/app'; }
}
