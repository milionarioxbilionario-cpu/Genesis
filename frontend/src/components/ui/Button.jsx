import React from 'react';
import { cx } from './cx';

// primary: UMA por ecra (a accao principal). secondary: accoes normais.
// ghost: accoes de baixa importancia/ferramentas. danger: so destrutivas.
const VARIANT = {
  primary: 'bg-accent text-white hover:bg-accent-hover border border-accent hover:border-accent-hover',
  secondary: 'bg-surface text-ink border border-border-strong hover:bg-subtle',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-subtle hover:text-ink',
  danger: 'bg-danger text-white border border-danger hover:bg-danger-hover hover:border-danger-hover',
  'danger-ghost': 'bg-transparent text-danger border border-transparent hover:bg-danger-soft',
};
const SIZE = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-3.5 text-base gap-2',
  lg: 'h-11 px-5 text-md gap-2',
  xl: 'h-14 px-6 text-md gap-2',
};

export function Button({ variant = 'secondary', size = 'md', icon: Icon, loading = false, block = false, className, children, disabled, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center rounded font-medium whitespace-nowrap transition-colors select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT[variant], SIZE[size], block && 'w-full', className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ label, icon: Icon, size = 'md', variant = 'ghost', className, ...rest }) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx('inline-flex items-center justify-center rounded transition-colors disabled:opacity-50', VARIANT[variant], box, className)}
      {...rest}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

export function Spinner({ className }) {
  return (
    <svg className={cx('h-4 w-4 animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
