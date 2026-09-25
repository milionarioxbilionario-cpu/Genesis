import React, { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Inbox, Info, Loader2, X, XCircle } from 'lucide-react';

/* ==========================================================================
   GENESIS - PRIMITIVAS DE UI (React)
   Compor SEMPRE com estas pecas. Nunca escrever hex a mao.
   API mantida 1:1 com a versao anterior (as paginas nao mudam de contrato);
   o que muda: icones lucide em vez de emoji, estados de foco/hover animados,
   toasts com animacao de saida, modal com Escape + scroll lock, e novas pecas
   (Spinner, IconButton, Reveal, CountUp, Progress, Tabs, Field, Sparkline).
   ========================================================================== */

/* ------------------------------- Card ----------------------------------- */
export const Card = forwardRef(function Card({ children, tight = false, hover = false, className = '', style, ...rest }, ref) {
  const cls = ['g-card', tight && 'g-card-tight', hover && 'g-card-hover', className].filter(Boolean).join(' ');
  return <div ref={ref} className={cls} style={style} {...rest}>{children}</div>;
});

export function CardHead({ title, hint, action }) {
  return (
    <div className="g-card-head">
      <div>
        <h3 className="g-card-title">{title}</h3>
        {hint && <div className="g-stat-hint" style={{ marginTop: 4 }}>{hint}</div>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Sparkline -------------------------------- */
export function Sparkline({ data = [], width = 96, height = 28, tone = 'var(--brand)' }) {
  const nums = data.filter((n) => Number.isFinite(n));
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const pts = nums.map((n, i) => {
    const x = (i / (nums.length - 1)) * width;
    const y = height - ((n - min) / span) * height;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} className="g-spark" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={tone} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------ StatCard -------------------------------- */
const TONE_COLOR = {
  default: 'var(--text)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  goal: 'var(--goal)',
  money: 'var(--ok)',
};

export function StatCard({ label, value, hint, icon, tone = 'default', onClick, delta, spark }) {
  const toneColor = TONE_COLOR[tone] || TONE_COLOR.default;
  const glowRef = usePointerGlow();
  return (
    <Card
      ref={glowRef}
      hover={Boolean(onClick)}
      className="g-stat-kpi g-track g-track-soft"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', '--kpi-tone': toneColor }}
    >
      <span className="g-track-glow" aria-hidden="true" />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div className="g-stat">
          <span className="g-stat-label">{label}</span>
          <span className="g-stat-value" style={{ color: toneColor }}>{value}</span>
          {Number.isFinite(delta) && (
            <span className="g-stat-hint" style={{ color: delta >= 0 ? 'var(--ok)' : 'var(--danger-text)' }}>
              {delta >= 0 ? '+' : ''}{Number(delta).toFixed(1)}% vs periodo anterior
            </span>
          )}
          {hint && <span className="g-stat-hint">{hint}</span>}
        </div>
        {icon && <div className="g-stat-icon">{icon}</div>}
      </div>
      {spark && spark.length > 1 && (
        <div style={{ marginTop: 12, opacity: 0.9 }}><Sparkline data={spark} tone={toneColor} /></div>
      )}
    </Card>
  );
}

/* ------------------------------- Button --------------------------------- */
export function Button({ variant = 'ghost', small = false, icon, loading = false, block = false, children, className = '', disabled, ...rest }) {
  const cls = ['g-btn', 'g-btn-' + variant, small && 'g-btn-sm', block && 'g-btn-block', loading && 'g-btn-loading', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = '', ...rest }) {
  return (
    <button type="button" className={'g-btn g-btn-ghost g-btn-icon press ' + className} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------- Spinner -------------------------------- */
export function Spinner({ large = false, label = 'A carregar' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', fontWeight: 600 }}>
      <span className={'g-spinner' + (large ? ' g-spinner-lg' : '')} role="status" aria-label={label} />
      {large && <span>{label}...</span>}
    </span>
  );
}

/* ------------------------------- Badge ---------------------------------- */
export function Badge({ tone = 'neutral', children }) {
  return <span className={'g-badge g-badge-' + tone}>{children}</span>;
}

/* ---------------------------- Input / Field ----------------------------- */
export function Input({ label, hint, className = '', ...rest }) {
  return (
    <label className="g-field">
      {label && <span className="g-label">{label}</span>}
      <input className={'g-input ' + className} {...rest} />
      {hint && <span className="g-help">{hint}</span>}
    </label>
  );
}

export function Select({ label, hint, children, className = '', ...rest }) {
  return (
    <label className="g-field">
      {label && <span className="g-label">{label}</span>}
      <select className={'g-select ' + className} {...rest}>{children}</select>
      {hint && <span className="g-help">{hint}</span>}
    </label>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="g-field">
      {label && <span className="g-label">{label}</span>}
      {children}
      {hint && <span className="g-help">{hint}</span>}
    </label>
  );
}
/* ------------------------------- Modal ---------------------------------- */
export function Modal({ open, title, hint, children, footer, onClose, width }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="g-backdrop" onClick={onClose} role="presentation">
      <div
        className="g-modal"
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        style={width ? { width: 'min(100%, ' + width + 'px)' } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="g-modal-head">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3 className="g-modal-title">{title}</h3>
              {hint && <div className="g-stat-hint" style={{ marginTop: 4 }}>{hint}</div>}
            </div>
            <button type="button" onClick={onClose} className="g-btn g-btn-ghost g-btn-icon press" aria-label="Fechar" title="Fechar (Esc)">
              <X aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="g-modal-body">{children}</div>
        {footer && <div className="g-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}
/* ------------------------------- Toast ---------------------------------- */
const ToastCtx = createContext({ push: () => {} });
const TOAST_ICON = { ok: CheckCircle2, err: XCircle, warn: AlertTriangle };

function normalizeTone(tone) {
  if (tone === 'err' || tone === 'error' || tone === 'danger') return 'err';
  if (tone === 'warn' || tone === 'warning') return 'warn';
  return 'ok';
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const dismiss = useCallback((id) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 260);
  }, []);

  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, tone: normalizeTone(tone) }]);
    setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="g-toast-wrap" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = TOAST_ICON[t.tone] || CheckCircle2;
          return (
            <div
              key={t.id}
              className={'g-toast g-toast-' + t.tone + (t.leaving ? ' g-toast-out' : '')}
              onClick={() => dismiss(t.id)}
              title="Clique para fechar"
            >
              <Icon aria-hidden="true" />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { return useContext(ToastCtx); }

/* ------------------------------- Table ---------------------------------- */
export function Table({ columns = [], rows = [], rowKey, empty }) {
  if (!rows.length) return empty || <EmptyState title="Sem registos" hint="Ainda nao existem dados para mostrar." />;
  return (
    <div className="g-table-wrap">
      <table className="g-table">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={c.align ? { textAlign: c.align } : undefined}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey ? rowKey(row) : i}>
              {columns.map((c) => (
                <td key={c.key} style={c.align ? { textAlign: c.align } : undefined} className={c.numeric ? 'g-num' : undefined}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- EmptyState ------------------------------- */
export function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="g-empty">
      <div className="g-empty-icon">{icon || <Inbox aria-hidden="true" />}</div>
      <div className="g-empty-title">{title}</div>
      {hint && <div style={{ marginTop: 6, fontSize: 'var(--fs-base)' }}>{hint}</div>}
      {action && <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>{action}</div>}
    </div>
  );
}

/* ------------------------------ Skeleton -------------------------------- */
export function Skeleton({ height = 16, width = '100%', radius }) {
  return <div className="g-skel" style={{ height, width, borderRadius: radius }} />;
}

/* ------------------------------ PageHead -------------------------------- */
export function PageHead({ title, sub, actions }) {
  return (
    <div className="g-page-head">
      <div>
        <h1 className="g-page-title">{title}</h1>
        {sub && <p className="g-page-sub">{sub}</p>}
      </div>
      {actions && <div className="g-toolbar-end">{actions}</div>}
    </div>
  );
}
/* ------------------------------- Alert ---------------------------------- */
const ALERT_ICON = { info: Info, warn: AlertTriangle, danger: XCircle, ok: CheckCircle2 };

export function Alert({ tone = 'info', icon, children }) {
  const Icon = ALERT_ICON[tone] || Info;
  return (
    <div className={'g-alert g-alert-' + tone}>
      {icon || <Icon aria-hidden="true" />}
      <div>{children}</div>
    </div>
  );
}

/* ------------------------------ GoalBar --------------------------------- */
export function GoalBar({ pct = 0, label, caption }) {
  const p = Number(pct) || 0;
  const capped = Math.min(100, Math.max(0, p));
  const color = p < 20 ? 'var(--danger)' : p < 50 ? '#f97316' : p < 80 ? 'var(--warn)' : 'var(--ok)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="g-stat-label">{label}</span>
        <span className="g-num" style={{ color: 'var(--text)' }}>{p.toFixed(0)}%</span>
      </div>
      <div className="g-goal-track">
        <div className="g-goal-fill g-bar-anim" style={{ width: capped + '%', background: color }} />
      </div>
      {p > 100 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="g-stat-label" style={{ color: 'var(--goal-bonus)' }}>Bonus (excedente)</span>
            <span className="g-num" style={{ color: 'var(--goal-bonus)' }}>+{(p - 100).toFixed(0)}%</span>
          </div>
          <div className="g-goal-bonus"><div className="g-goal-bonus-fill g-bar-anim" style={{ width: Math.min(100, p - 100) + '%' }} /></div>
        </div>
      )}
      {caption && <div className="g-stat-hint" style={{ marginTop: 10 }}>{caption}</div>}
    </div>
  );
}

/* ------------------------------- Progress ------------------------------- */
export function Progress({ value = 0, tone }) {
  const p = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="g-progress">
      <div className="g-progress-fill g-bar-anim" style={{ width: p + '%', background: tone }} />
    </div>
  );
}

/* -------------------------------- Tabs ---------------------------------- */
export function Tabs({ items = [], value, onChange }) {
  return (
    <div className="g-tabs" role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          role="tab"
          aria-selected={it.value === value}
          className={'g-tab' + (it.value === value ? ' is-active' : '')}
          onClick={() => onChange && onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------- Reveal -------------------------------- */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { reduce = false; }
    if (reduce || typeof IntersectionObserver === 'undefined') { setVisible(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={'g-reveal' + (visible ? ' is-visible' : '') + (className ? ' ' + className : '')}
      style={delay ? { transitionDelay: delay + 'ms' } : undefined}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------- CountUp -------------------------------- */
export function CountUp({ value = 0, duration = 900, decimals = 0, prefix = '', suffix = '', locale = 'pt-PT' }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    let reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { reduce = false; }
    const from = fromRef.current;
    if (reduce || from === target || typeof requestAnimationFrame === 'undefined') {
      setShown(target);
      fromRef.current = target;
      return undefined;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  const text = shown.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span className="g-num">{prefix}{text}{suffix}</span>;
}

/* ==========================================================================
   EFEITOS DE ASSINATURA (motor)
   Estas pecas alimentam as classes da secção 7 de ui/animations.css.
   Regra: nada aqui altera logica de negocio - so apresentacao.
   ========================================================================== */

/* Segue o rato e escreve --mx/--my no elemento (consumido por .g-track::before).
   Fica desligado em prefers-reduced-motion e em dispositivos sem hover fino. */
export function usePointerGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let disabled = false;
    try {
      disabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        || !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    } catch { disabled = true; }
    if (disabled) return undefined;
    const onMove = (event) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      el.style.setProperty('--mx', (event.clientX - rect.left).toFixed(1) + 'px');
      el.style.setProperty('--my', (event.clientY - rect.top).toFixed(1) + 'px');
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, []);
  return ref;
}

/* Card com realce que segue o rato. Envelope: <GlowCard tone="soft">...</GlowCard> */
export function GlowCard({ tone = 'soft', as: Tag = 'div', className = '', children, ...rest }) {
  const ref = usePointerGlow();
  const cls = ['g-card', 'g-track', tone === 'brand' ? 'g-track-brand' : 'g-track-soft', className]
    .filter(Boolean).join(' ');
  return (
    <Tag ref={ref} className={cls} {...rest}>
      <span className="g-track-glow" aria-hidden="true" />
      {children}
    </Tag>
  );
}

/* Camada de fundo viva: auroras lentas + grelha. Puramente decorativa. */
export function AmbientLayer({ grid = true }) {
  return (
    <div className="g-ambient-layer" aria-hidden="true">
      <div className="g-ambient g-ambient-brand g-ambient-a" />
      <div className="g-ambient g-ambient-info g-ambient-b" />
      {grid && <div className="g-grid-bg g-ambient-grid" />}
    </div>
  );
}

/* Recibo que sai da impressora em 3D. children = conteudo do ticket. */
export function Receipt3D({ slot = true, settle = true, children, className = '' }) {
  return (
    <div className={'g-receipt-3d-stage ' + className}>
      {slot && <div className="g-receipt-slot" />}
      <div className={settle ? 'g-receipt-3d g-receipt-3d-settle' : 'g-receipt-3d'}>
        {children}
      </div>
    </div>
  );
}

/* Barra que preenche com a marca (usada em cabecalhos de KPI e no topo do login). */
export function SheenBar({ tone = 'brand', className = '' }) {
  return <div className={'g-sheen g-sheen-' + tone + ' ' + className} aria-hidden="true" />;
}