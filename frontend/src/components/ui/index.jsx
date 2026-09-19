import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/* ==========================================================================
   GENESIS — PRIMITIVAS DE UI (React)
   Compor SEMPRE com estas pecas. Nunca escrever hex a mao nem usar bg-white.
   ========================================================================== */

/* ------------------------------- Card ----------------------------------- */
export function Card({ children, tight = false, hover = false, className = '', style, ...rest }) {
  const cls = ['g-card', tight && 'g-card-tight', hover && 'g-card-hover', className].filter(Boolean).join(' ');
  return <div className={cls} style={style} {...rest}>{children}</div>;
}

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

/* ------------------------------ StatCard -------------------------------- */
const TONE_COLOR = {
  default: 'var(--text)',
  ok: 'var(--ok)',
  warn: 'var(--warn)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  goal: 'var(--goal)',
};

export function StatCard({ label, value, hint, icon, tone = 'default', onClick }) {
  return (
    <Card hover={Boolean(onClick)} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div className="g-stat">
          <span className="g-stat-label">{label}</span>
          <span className="g-stat-value" style={{ color: TONE_COLOR[tone] || TONE_COLOR.default }}>{value}</span>
          {hint && <span className="g-stat-hint">{hint}</span>}
        </div>
        {icon && <div className="g-stat-icon">{icon}</div>}
      </div>
    </Card>
  );
}

/* ------------------------------- Button --------------------------------- */
export function Button({ variant = 'ghost', small = false, icon, children, className = '', ...rest }) {
  const cls = ['g-btn', 'g-btn-' + variant, small && 'g-btn-sm', className].filter(Boolean).join(' ');
  return <button type="button" className={cls} {...rest}>{icon}{children}</button>;
}

/* ------------------------------- Badge ---------------------------------- */
export function Badge({ tone = 'neutral', children }) {
  return <span className={'g-badge g-badge-' + tone}>{children}</span>;
}

/* ---------------------------- Input / Field ----------------------------- */
export function Input({ label, hint, className = '', ...rest }) {
  return (
    <label>
      {label && <span className="g-label">{label}</span>}
      <input className={'g-input ' + className} {...rest} />
      {hint && <span className="g-stat-hint" style={{ display: 'block', marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

/* ------------------------------- Modal ---------------------------------- */
export function Modal({ open, title, hint, children, footer, onClose, width }) {
  if (!open) return null;
  return (
    <div className="g-backdrop" onClick={onClose}>
      <div className="g-modal" style={width ? { width: 'min(100%, ' + width + 'px)' } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="g-modal-head">
          <div>
            <h3 className="g-modal-title">{title}</h3>
            {hint && <div className="g-stat-hint" style={{ marginTop: 4 }}>{hint}</div>}
          </div>
          <button type="button" onClick={onClose} className="g-btn g-btn-ghost g-btn-icon" aria-label="Fechar">✕</button>
        </div>
        <div className="g-modal-body">{children}</div>
        {footer && <div className="g-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ------------------------------- Toast ---------------------------------- */
const ToastCtx = createContext({ push: () => {} });

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);
  const value = useMemo(() => ({ push }), [push]);
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="g-toast-wrap">
        {items.map((t) => (
          <div key={t.id} className={'g-toast g-toast-' + (t.tone === 'err' || t.tone === 'error' ? 'err' : t.tone === 'warn' ? 'warn' : 'ok')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() { return useContext(ToastCtx); }

/* ------------------------------- Table ---------------------------------- */
export function Table({ columns = [], rows = [], rowKey, empty }) {
  if (!rows.length) return empty || <EmptyState title="Sem registos" />;
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
export function EmptyState({ icon = '📭', title, hint, action }) {
  return (
    <div className="g-empty">
      <div className="g-empty-icon">{icon}</div>
      <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{title}</div>
      {hint && <div style={{ marginTop: 6, fontSize: '0.82rem' }}>{hint}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
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
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

/* ------------------------------- Alert ---------------------------------- */
export function Alert({ tone = 'info', icon, children }) {
  return <div className={'g-alert g-alert-' + tone}>{icon && <span>{icon}</span>}<div>{children}</div></div>;
}

/* ------------------------------ GoalBar --------------------------------- */
// Cores progressivas: <20 vermelho · 20-50 laranja · 50-80 amarelo
// 80-100 verde · >100 ativa barra de BONUS azul (excedente).
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
        <div className="g-goal-fill" style={{ width: capped + '%', background: color }} />
      </div>
      {p > 100 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span className="g-stat-label" style={{ color: 'var(--goal-bonus)' }}>Bonus (excedente)</span>
            <span className="g-num" style={{ color: 'var(--goal-bonus)' }}>+{(p - 100).toFixed(0)}%</span>
          </div>
          <div className="g-goal-bonus"><div className="g-goal-bonus-fill" style={{ width: Math.min(100, p - 100) + '%' }} /></div>
        </div>
      )}
      {caption && <div className="g-stat-hint" style={{ marginTop: 10 }}>{caption}</div>}
    </div>
  );
}
