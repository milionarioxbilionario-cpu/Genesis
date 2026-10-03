import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { cx } from './cx';

export function Card({ className, children, padded = true, ...rest }) {
  return <div className={cx('rounded-lg border border-border bg-surface', padded && 'p-5', className)} {...rest}>{children}</div>;
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cx('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-md font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// KPI. `delta` e a variacao face ao periodo anterior (numero, em %).
export function Stat({ label, value, hint, delta, tone }) {
  const toneCls = tone === 'positive' ? 'text-positive' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <Card>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className={cx('mt-1.5 text-xl font-semibold num tracking-tight', toneCls)}>{value}</p>
      {(hint || typeof delta === 'number') && (
        <p className="mt-1 text-xs text-ink-muted">
          {typeof delta === 'number' && (
            <span className={cx('mr-1.5 font-medium num', delta >= 0 ? 'text-positive' : 'text-danger')}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}%
            </span>
          )}
          {hint}
        </p>
      )}
    </Card>
  );
}

const BADGE = {
  neutral: 'bg-subtle text-ink-2 border-border',
  positive: 'bg-positive-soft text-positive border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  info: 'bg-info-soft text-info border-transparent',
};
export function Badge({ tone = 'neutral', children, className }) {
  return <span className={cx('inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap', BADGE[tone], className)}>{children}</span>;
}

// Tabela densa. columns: [{ key, header, align: 'right'|'left', render(row), className }]
export function Table({ columns, rows, rowKey = 'id', empty, onRowClick, loading, footer }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr className="border-b border-border bg-subtle">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx('h-9 px-4 text-xs font-medium uppercase tracking-wide text-ink-muted whitespace-nowrap', c.align === 'right' ? 'text-right' : 'text-left', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((c) => <td key={c.key} className="h-11 px-4"><Skeleton className="h-3.5 w-2/3" /></td>)}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr><td colSpan={columns.length}>{empty || <EmptyState title="Sem registos" />}</td></tr>
          ) : rows.map((row) => (
            <tr
              key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cx('border-b border-border last:border-0', onRowClick && 'cursor-pointer hover:bg-subtle')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('h-11 px-4 text-ink', c.align === 'right' ? 'text-right num' : 'text-left', c.className)}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="border-t border-border bg-subtle">{footer}</tfoot>}
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
      <span className="num">{from}–{to} de {total}</span>
      <div className="flex gap-1">
        <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPage(page - 1)} className="flex h-8 w-8 items-center justify-center rounded border border-border-strong bg-surface hover:bg-subtle disabled:opacity-40"><ChevronLeft size={16} /></button>
        <button type="button" aria-label="Página seguinte" disabled={page >= pages} onClick={() => onPage(page + 1)} className="flex h-8 w-8 items-center justify-center rounded border border-border-strong bg-surface hover:bg-subtle disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-ink-muted"><Icon size={18} /></div>
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-sm bg-muted-bg', className)} />;
}

const ALERT = {
  info: 'bg-info-soft border-border text-ink',
  warning: 'bg-warning-soft border-border text-ink',
  danger: 'bg-danger-soft border-border text-ink',
  positive: 'bg-positive-soft border-border text-ink',
};
export function Alert({ tone = 'info', title, children, action, className }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm', ALERT[tone], className)}>
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cx(title && 'mt-0.5', 'text-ink-2')}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

// Barra de progresso. Cores da meta (especificacao 4.2) dentro da paleta fixa:
// <20% vermelho, 20-80% ambar, 80-100% verde, >100% bonus azul (info).
export function ProgressBar({ value, tone, className }) {
  const v = Math.max(0, Number(value) || 0);
  const auto = v > 100 ? 'bg-info' : v >= 80 ? 'bg-positive' : v >= 20 ? 'bg-warning' : 'bg-danger';
  const color = tone ? { accent: 'bg-accent', positive: 'bg-positive', danger: 'bg-danger', warning: 'bg-warning', info: 'bg-info', neutral: 'bg-ink-muted' }[tone] : auto;
  return (
    <div className={cx('h-2 w-full overflow-hidden rounded-full bg-muted-bg', className)} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cx('h-full rounded-full transition-[width]', color)} style={{ width: Math.min(v, 100) + '%' }} />
    </div>
  );
}

export function Tabs({ items, value, onChange, className }) {
  return (
    <div role="tablist" className={cx('flex gap-6 border-b border-border overflow-x-auto scrollbar-none', className)}>
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          type="button"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx('-mb-px h-10 border-b-2 text-base font-medium whitespace-nowrap transition-colors',
            value === t.value ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink')}
        >
          {t.label}
          {typeof t.count === 'number' && <span className="ml-1.5 text-sm text-ink-muted num">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-base text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Toolbar({ children, className }) {
  return <div className={cx('mb-4 flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

// Linha "rotulo ... valor" (recibos, resumos, cascata do relatorio).
export function KeyValue({ label, value, strong, tone, className }) {
  return (
    <div className={cx('flex items-baseline justify-between gap-4 py-1.5', className)}>
      <span className={cx(strong ? 'font-medium text-ink' : 'text-ink-2')}>{label}</span>
      <span className={cx('num', strong ? 'font-semibold' : '', tone === 'danger' ? 'text-danger' : tone === 'positive' ? 'text-positive' : 'text-ink')}>{value}</span>
    </div>
  );
}
