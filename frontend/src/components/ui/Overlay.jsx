import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cx } from './cx';
import { Button, IconButton } from './Button';

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
}

// Dialogo centrado. footer: botoes (a accao principal a direita).
export function Dialog({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEscape(open, onClose);
  if (!open) return null;
  const width = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(28,25,23,0.40)] p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cx('flex max-h-[92vh] w-full flex-col rounded-t-lg sm:rounded-lg bg-surface shadow-pop', width)}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-md font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          {onClose && <IconButton label="Fechar" icon={X} size="sm" onClick={onClose} />}
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// Painel lateral para criar/editar sem sair da lista.
export function Drawer({ open, onClose, title, description, children, footer }) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(28,25,23,0.30)]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <aside role="dialog" aria-modal="true" aria-label={title} className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-pop">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-md font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <IconButton label="Fechar" icon={X} size="sm" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- Confirmacao
const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);
  const confirm = useCallback((opts) => new Promise((resolve) => {
    resolver.current = resolve;
    setState({ title: 'Confirmar', confirmLabel: 'Confirmar', ...opts });
  }), []);
  const close = (v) => { resolver.current?.(v); setState(null); };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Dialog
        open={Boolean(state)}
        onClose={() => close(false)}
        title={state?.title}
        size="sm"
        footer={(
          <>
            <Button onClick={() => close(false)}>Cancelar</Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{state?.confirmLabel}</Button>
          </>
        )}
      >
        <p className="text-base text-ink-2">{state?.message}</p>
      </Dialog>
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);

// ---------------------------------------------------------------- Toast
const ToastCtx = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'positive') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), tone === 'danger' ? 6000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 text-base text-ink shadow-pop">
              {t.tone === 'danger'
                ? <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
                : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-positive" />}
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
