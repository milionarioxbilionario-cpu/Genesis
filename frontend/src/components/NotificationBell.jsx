import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Info, OctagonAlert } from 'lucide-react';
import useApi from '../utils/useApi';
import { notificationDetail, notificationTitle } from '../utils/notificationText';
import { useI18n } from '../i18n/react';
import { cx, Drawer, EmptyState, Skeleton } from './ui';

// Sino do dono (Fase 10.1): o que precisa de atencao agora. Calculado pelo
// servidor na leitura; volta a pedir ao mudar de pagina e de minuto a minuto.
const LEVEL = {
  critical: { icon: OctagonAlert, className: 'bg-danger-soft text-danger' },
  warning: { icon: AlertTriangle, className: 'bg-warning-soft text-warning' },
  info: { icon: Info, className: 'bg-info-soft text-info' },
  success: { icon: CheckCircle2, className: 'bg-positive-soft text-positive' },
};

export default function NotificationBell() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data, loading, error, reload } = useApi('/api/owner/notifications');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; } // o useApi ja carregou
    reload();
  }, [location.pathname, location.search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) reload(); }, 60000);
    return () => clearInterval(id);
  }, [reload]);

  const items = data?.items || [];
  const critical = items.some((n) => n.level === 'critical');
  const label = items.length ? t('Notificações ({n})', { n: items.length }) : t('Notificações');

  function go(n) {
    setOpen(false);
    navigate(n.link);
  }

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => { setOpen(true); reload(); }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded text-ink-2 transition-colors hover:bg-subtle hover:text-ink"
      >
        <Bell size={17} strokeWidth={1.8} aria-hidden="true" />
        {items.length > 0 && (
          <span className={cx('num absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-none text-white', critical ? 'bg-danger' : 'bg-ink-2')}>
            {items.length > 99 ? '99+' : items.length}
          </span>
        )}
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t('Notificações')} description={t('O que precisa da sua atenção agora.')}>
        {!data && loading && <div className="space-y-3"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>}
        {!data && error && <p className="text-sm text-danger">{error}</p>}
        {data && items.length === 0 && <EmptyState icon={CheckCircle2} title={t('Tudo em ordem')} description={t('Sem alertas neste momento.')} />}
        {items.length > 0 && (
          <ul className="-mx-2">
            {items.map((n) => {
              const { icon: Icon, className } = LEVEL[n.level] || LEVEL.info;
              return (
                <li key={n.id}>
                  <button type="button" onClick={() => go(n)} className="flex w-full items-start gap-3 rounded px-2 py-2.5 text-left transition-colors hover:bg-subtle">
                    <span className={cx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', className)}><Icon size={15} aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{notificationTitle(n)}</span>
                      <span className="block text-sm text-ink-muted">{notificationDetail(n)}</span>
                    </span>
                    <ChevronRight size={16} className="mt-1.5 shrink-0 text-ink-faint" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Drawer>
    </>
  );
}
