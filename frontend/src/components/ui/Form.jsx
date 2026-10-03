import React, { useEffect, useId, useState } from 'react';
import { ChevronDown, Delete } from 'lucide-react';
import { cx } from './cx';
import { centsToMznInput, mznToCents } from '../../utils/money';

// Sem largura fixa aqui: quem usa decide (w-full por omissao, ver widthOf).
const control = 'h-9 rounded border border-border-strong bg-surface px-3 text-base text-ink transition-colors '
  + 'hover:border-ink-faint focus:border-accent focus:shadow-focus focus:outline-none '
  + 'disabled:bg-subtle disabled:text-ink-muted aria-[invalid=true]:border-danger';

// Largura: w-full, excepto se o className ja trouxer uma largura (w-40, ...).
const widthOf = (className) => (/(^|s)(sm:|md:|lg:)?w-/.test(className || '') ? '' : 'w-full');

export function Field({ label, hint, error, children, htmlFor, className }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && <label htmlFor={htmlFor} className="text-sm font-medium text-ink-2">{label}</label>}
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

// forwardRef: quem precisa de mover o foco (ex.: leitor de codigo de barras no
// onboarding salta para a linha seguinte) recebe o <input> real.
export const Input = React.forwardRef(function Input({ label, hint, error, className, inputClassName, id, ...rest }, ref) {
  const auto = useId();
  const fid = id || auto;
  if (!label && !hint && !error) {
    return <input ref={ref} id={fid} aria-invalid={Boolean(error)} className={cx(control, widthOf(className), inputClassName, className)} {...rest} />;
  }
  const input = <input ref={ref} id={fid} aria-invalid={Boolean(error)} className={cx(control, 'w-full', inputClassName)} {...rest} />;
  return <Field label={label} hint={hint} error={error} htmlFor={fid} className={className}>{input}</Field>;
});

// Seta desenhada com um icone (a classe com SVG em URL nao era gerada).
export function Select({ label, hint, error, className, selectClassName, id, children, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  const bare = !label && !hint && !error;
  const multi = Number(rest.size) > 1 || rest.multiple;
  const field = (
    <div className={cx('relative', bare ? cx(widthOf(className), className) : 'w-full')}>
      <select id={fid} aria-invalid={Boolean(error)} className={cx(control, 'w-full', !multi && 'appearance-none pr-8', selectClassName)} {...rest}>
        {children}
      </select>
      {!multi && <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />}
    </div>
  );
  if (bare) return field;
  return <Field label={label} hint={hint} error={error} htmlFor={fid} className={className}>{field}</Field>;
}

export function Textarea({ label, hint, error, className, id, rows = 3, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={className}>
      <textarea id={fid} rows={rows} className={cx(control, 'w-full h-auto py-2')} {...rest} />
    </Field>
  );
}

// O utilizador escreve em Meticais (o que e natural); o valor devolvido em
// onChange e SEMPRE centavos inteiros (regra 6 do CLAUDE.md).
export function MoneyInput({ label, hint, error, valueCents, onChangeCents, className, id, ...rest }) {
  const auto = useId();
  const fid = id || auto;
  const [text, setText] = useState(valueCents ? String(centsToMznInput(valueCents)).replace('.', ',') : '');
  useEffect(() => {
    if (mznToCents(text.replace(',', '.')) !== (valueCents || 0)) setText(valueCents ? String(centsToMznInput(valueCents)).replace('.', ',') : '');
  }, [valueCents]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Field label={label} hint={hint} error={error} htmlFor={fid} className={className}>
      <div className="relative">
        <input
          id={fid}
          inputMode="decimal"
          autoComplete="off"
          className={cx(control, 'w-full num pr-10 text-right')}
          value={text}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d.,]/g, '');
            setText(v);
            onChangeCents?.(mznToCents(v.replace(',', '.')));
          }}
          {...rest}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">MT</span>
      </div>
    </Field>
  );
}

// Teclado de PIN do terminal (alvos de 64 px: uso com o dedo no balcao).
export function PinPad({ length = 4, value, onChange, onComplete, disabled }) {
  const press = (d) => {
    if (disabled || value.length >= 6) return;
    const next = value + d;
    onChange(next);
    if (next.length >= length) onComplete?.(next);
  };
  useEffect(() => {
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') onChange(value.slice(0, -1));
      else if (e.key === 'Enter' && value.length >= 4) onComplete?.(value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const key = 'h-16 rounded-lg border border-border bg-surface text-xl font-medium text-ink num hover:bg-subtle active:bg-muted-bg transition-colors disabled:opacity-50';
  return (
    <div className="w-full max-w-[280px]">
      <div className="mb-5 flex justify-center gap-3" aria-label={`${value.length} de ${length} dígitos`}>
        {Array.from({ length: Math.max(length, value.length) }).map((_, i) => (
          <span key={i} className={cx('h-3 w-3 rounded-full border', i < value.length ? 'bg-ink border-ink' : 'border-border-strong')} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className={key} disabled={disabled} onClick={() => press(d)}>{d}</button>
        ))}
        <span />
        <button type="button" className={key} disabled={disabled} onClick={() => press('0')}>0</button>
        <button type="button" aria-label="Apagar" className={cx(key, 'flex items-center justify-center text-ink-muted')} disabled={disabled} onClick={() => onChange(value.slice(0, -1))}>
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}

// Controlo segmentado (ex.: metodo de pagamento, separadores pequenos).
export function Segmented({ options, value, onChange, size = 'md', className }) {
  return (
    <div role="radiogroup" className={cx('inline-flex rounded border border-border-strong bg-subtle p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-sm px-3 font-medium transition-colors whitespace-nowrap',
            size === 'lg' ? 'h-10 text-base' : 'h-8 text-sm',
            value === o.value ? 'bg-surface text-ink border border-border-strong' : 'text-ink-muted hover:text-ink border border-transparent',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
