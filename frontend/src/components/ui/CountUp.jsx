import React, { useEffect, useRef, useState } from 'react';
import { money, isMoneyHidden, int } from '../../utils/format';

// Numeros que sobem ate ao valor quando aparecem (Fase 13). So para revelar
// um numero, nunca decoracao: ~700 ms, a abrandar no fim, e nada com
// prefers-reduced-motion. Trabalha em centavos inteiros (nunca float a mostrar).
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(() => (reduced() ? target : 0));
  const from = useRef(0);
  useEffect(() => {
    if (reduced() || !Number.isFinite(target)) { setValue(target); return undefined; }
    const start = performance.now();
    const base = from.current;
    let raf;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - k) ** 3;
      const v = Math.round(base + (target - base) * eased);
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// Dinheiro animado. No modo privado mostra "•••• MT" sem animar.
export function CountUpMoney({ cents, className }) {
  const v = useCountUp(Number(cents || 0));
  return <span className={'num ' + (className || '')} data-value={cents}>{isMoneyHidden() ? money(cents) : money(v)}</span>;
}

export function CountUpInt({ value, className }) {
  const v = useCountUp(Number(value || 0));
  return <span className={'num ' + (className || '')}>{int(v)}</span>;
}
