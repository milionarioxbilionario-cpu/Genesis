import { useEffect, useState, useRef } from 'react';
import db from '../db/localDb';

export default function useOfflineSync({ intervalMs = 30000 } = {}) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    }
    updateOnlineStatus();

    async function doSync() {
      try {
        const pendingSales = await db.sales.where('sync').equals(false).sortBy('created_at');
        const pendingDemand = db.demand_captures ? await db.demand_captures.where('sync').equals(false).sortBy('requested_at') : [];
        const pendingShrinkage = db.shrinkage_records ? await db.shrinkage_records.where('sync').equals(false).sortBy('recorded_at') : [];
        const count = pendingSales.length + pendingDemand.length + pendingShrinkage.length;
        setPendingCount(count);

        if (!navigator.onLine || count === 0) return;

        let deviceKeyRow = null;
        try {
          deviceKeyRow = await db.device_keys.orderBy('created_at').last();
        } catch (e) {
          deviceKeyRow = null;
        }

        let token = typeof window !== 'undefined' ? (localStorage.getItem('token') || null) : null;

        const buildHeaders = () => {
          const headers = { 'Content-Type': 'application/json' };
          if (deviceKeyRow && deviceKeyRow.secret) {
            headers.Authorization = 'Device ' + deviceKeyRow.secret;
          } else if (token) {
            headers.Authorization = 'Bearer ' + token;
          }
          return headers;
        };

        const syncSale = async (sale) => {
          let triedRefresh = false;

          const attempt = async () => {
            const payload = sale.payload || sale;
            const headers = buildHeaders();

            const response = await fetch('/api/sales', {
              method: 'POST',
              headers,
              body: JSON.stringify(payload)
            });

            if (response.status === 401 && deviceKeyRow && deviceKeyRow.id) {
              try {
                await db.device_keys.delete(deviceKeyRow.id);
                console.warn('Device key removed locally after 401 from server');
              } catch (e) {
                console.warn('Failed to remove device key locally', e);
              }
            }

            if (response.ok) {
              await db.sales.update(sale.id, { sync: true, synced_at: new Date().toISOString() });
              return true;
            }

            if (response.status === 401 && !triedRefresh && token) {
              triedRefresh = true;
              try {
                const r = await fetch('/api/refresh', { method: 'POST', credentials: 'same-origin' });
                if (r.ok) {
                  const body = await r.json();
                  token = body.token || localStorage.getItem('token');
                  if (token) localStorage.setItem('token', token);
                  return attempt();
                }
              } catch (e) {
                console.warn('refresh failed', e);
              }
            }

            return false;
          };

          try {
            await attempt();
          } catch (err) {
            console.error('Failed to sync sale', sale.id, err);
          }
        };

        for (const sale of pendingSales) {
          await syncSale(sale);
        }

        if (db.demand_captures) {
          for (const entry of pendingDemand) {
            try {
              const response = await fetch('/api/demand_captures', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(entry)
              });
              if (response.ok) {
                await db.demand_captures.update(entry.id, { sync: true, synced_at: new Date().toISOString() });
              }
            } catch (err) {
              console.error('Failed to sync demand capture', entry.id, err);
            }
          }
        }

        if (db.shrinkage_records) {
          for (const rec of pendingShrinkage) {
            try {
              const response = await fetch('/api/shrinkage_records', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(rec)
              });
              if (response.ok) {
                await db.shrinkage_records.update(rec.id, { sync: true, synced_at: new Date().toISOString() });
              }
            } catch (err) {
              console.error('Failed to sync shrinkage record', rec.id, err);
            }
          }
        }

        const remaining = await db.sales.where('sync').equals(false).count();
        const remainingDemand = db.demand_captures ? await db.demand_captures.where('sync').equals(false).count() : 0;
        const remainingShrink = db.shrinkage_records ? await db.shrinkage_records.where('sync').equals(false).count() : 0;
        setPendingCount(remaining + remainingDemand + remainingShrink);
      } catch (err) {
        console.error('useOfflineSync error', err);
      }
    }

    doSync();
    timerRef.current = setInterval(doSync, intervalMs);

    return () => {
      clearInterval(timerRef.current);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      }
    };
  }, [intervalMs]);

  return { isOnline, pendingCount };
}
