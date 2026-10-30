import { useCallback, useEffect, useRef, useState } from 'react';
import db from '../db/localDb';
import { runSync, countQueue } from '../utils/offlineQueue.js';

// Sincronizador da fila offline do POS (2026-10-03).
//
// Antes: este hook existia mas NAO era usado por nenhum ecra, e a query que
// usava (`where('sync').equals(false)`) lancava DataError — a fila nunca
// sincronizou nada. Agora o CashierDashboard monta-o; a logica vive em
// utils/offlineQueue.js (testada em Node).

// Autenticacao so por cookies httpOnly: a sessao do caixista ou, se expirou,
// o cookie do TERMINAL emparelhado (o servidor aceita-o para as escritas da
// fila desde que a venda traga o seller_user_id — ver posWriteAuth.js).
async function post(path, body) {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await response.json(); } catch { data = null; }
    return { status: response.status, data };
  } catch {
    return { status: 0, data: null }; // sem rede
  }
}

export default function useOfflineSync({ intervalMs = 30000 } = {}) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const running = useRef(false);

  const refreshCounts = useCallback(async () => {
    try {
      const { pending, rejected } = await countQueue(db);
      setPendingCount(pending);
      setRejectedCount(rejected);
    } catch (err) {
      console.error('useOfflineSync: contagem falhou', err);
    }
  }, []);

  const syncNow = useCallback(async () => {
    // Uma venda pode demorar varios segundos a gravar; sem esta guarda, o
    // intervalo seguinte arrancava outra passagem por cima da primeira.
    if (running.current) return;
    running.current = true;
    try {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const { pending } = await countQueue(db);
        if (pending > 0) setSyncing(true);
        let result = await runSync(db, post);
        if (result.authFailed) {
          const r = await fetch('/api/refresh', { method: 'POST', credentials: 'same-origin' }).catch(() => null);
          if (r && r.ok) result = await runSync(db, post);
        }
        // 30/10/2026: o ecra tem de saber que a fila chegou ao servidor (stock,
        // turno e aviso «N enviadas»); antes so mudava ao trocar de pagina.
        if (result.synced > 0 || result.rejected > 0) {
          window.dispatchEvent(new CustomEvent('genesis:queue-synced', { detail: { synced: result.synced, rejected: result.rejected } }));
        }
      }
    } catch (err) {
      console.error('useOfflineSync: passagem falhou', err);
    } finally {
      running.current = false;
      setSyncing(false);
      await refreshCounts();
    }
  }, [refreshCounts]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsOnline(online);
      if (online) syncNow();
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    syncNow();
    const timer = setInterval(syncNow, intervalMs);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [intervalMs, syncNow]);

  return { isOnline, pendingCount, rejectedCount, syncing, syncNow, refreshCounts };
}
