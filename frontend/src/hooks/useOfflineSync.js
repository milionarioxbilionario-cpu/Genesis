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
        const count = pendingSales.length + pendingDemand.length;
        setPendingCount(count);

        if (!navigator.onLine || count === 0) return;

        for (const sale of pendingSales) {
          try {
            const payload = sale.payload || sale;
            const response = await fetch('/api/sales', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              await db.sales.update(sale.id, { sync: true, synced_at: new Date().toISOString() });
            }
          } catch (err) {
            console.error('Failed to sync sale', sale.id, err);
          }
        }

        if (db.demand_captures) {
          for (const entry of pendingDemand) {
            try {
              const response = await fetch('/api/demand_captures', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

        const remaining = await db.sales.where('sync').equals(false).count();
        const remainingDemand = db.demand_captures ? await db.demand_captures.where('sync').equals(false).count() : 0;
        setPendingCount(remaining + remainingDemand);
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
