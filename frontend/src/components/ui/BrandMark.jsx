import React from 'react';
import { BRAND_GREEN, BRAND_GOLD, MARK_VIEWBOX, MARK_G_PATH, MARK_SQUARE } from '../../ui/marca';

// Simbolo da marca (o «G» do logotipo) num quadrado verde, no lugar do antigo
// «G» de texto. Decorativo: quem o usa poe o nome ao lado ou um aria-label.
export function BrandMark({ size = 28, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={'inline-flex shrink-0 items-center justify-center ' + className}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.22), background: BRAND_GREEN }}
    >
      <svg viewBox={MARK_VIEWBOX} width={Math.round(size * 0.64)} height={Math.round(size * 0.64)} focusable="false">
        <path fill="#FFFFFF" d={MARK_G_PATH} />
        <rect {...MARK_SQUARE} fill={BRAND_GOLD} />
      </svg>
    </span>
  );
}
