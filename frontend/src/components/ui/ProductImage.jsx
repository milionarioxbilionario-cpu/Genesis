import React, { useState } from 'react';
import { Beef, Beer, Coffee, Cookie, Croissant, CupSoda, Drumstick, Droplet, Egg, Fish, Flame, Martini, Package, Sandwich, Snowflake, SprayCan, UtensilsCrossed, Wheat, Zap } from 'lucide-react';
import { cx } from './cx';

// Icone por categoria quando o produto nao tem foto (ou a foto falha).
// Ordem importa: a primeira regra que bater ganha.
const RULES = [
  [/cervej|cidra/i, Beer],
  [/destilad|whisky|vinho|gin|vodka/i, Martini],
  [/energ/i, Zap],
  [/água|agua/i, Droplet],
  [/refresc|refrig|sumo|bebida/i, CupSoda],
  [/caf[ée]|quente|cafetaria|chá/i, Coffee],
  [/frango|grelhad/i, Drumstick],
  [/vaca|porco|cabrito|carne|enchid/i, Beef],
  [/peixe/i, Fish],
  [/pão|pao|doce|bolo/i, Croissant],
  [/sandes|salgad|petisc/i, Sandwich],
  [/prato|acompanh/i, UtensilsCrossed],
  [/arroz|farinh|cereal|feijão|massa/i, Wheat],
  [/fresco|ovo/i, Egg],
  [/higiene|limpeza/i, SprayCan],
  [/bolacha|pequeno/i, Cookie],
  [/gelo/i, Snowflake],
  [/carvão|carvao/i, Flame],
];

export function categoryIcon(category = '', name = '') {
  const text = `${category} ${name}`;
  return (RULES.find(([re]) => re.test(category)) || RULES.find(([re]) => re.test(text)) || [null, Package])[1];
}

// Foto do produto (data:image da camara do dono ou https) com recurso ao icone.
export function ProductImage({ product, size = 48, className }) {
  const [failed, setFailed] = useState(false);
  const Icon = categoryIcon(product.category, product.name);
  const showPhoto = product.image_url && !failed;
  return (
    <span className={cx('flex shrink-0 items-center justify-center overflow-hidden rounded bg-subtle', className)} style={{ width: size, height: size }} aria-hidden="true">
      {showPhoto
        ? <img src={product.image_url} alt="" loading="lazy" className="h-full w-full object-contain" onError={() => setFailed(true)} />
        : <Icon size={Math.round(size * 0.46)} strokeWidth={1.6} className="text-ink-muted" />}
    </span>
  );
}
