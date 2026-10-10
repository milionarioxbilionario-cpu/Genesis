import {
  Apple, Baby, Bath, Battery, Beef, Beer, Candy, Carrot, Cigarette, Citrus, Coffee, Cookie, Croissant, CupSoda,
  Drumstick, Droplet, Egg, Fish, Flame, IceCreamCone, Martini, Milk, Package, Pill, Sandwich, Shirt, Smartphone,
  Snowflake, SprayCan, Wheat, Wine, Zap,
} from 'lucide-react';

// Icones que o dono pode escolher para um produto (Fase 8.2). As chaves sao as
// mesmas do servidor (backend/src/utils/productIcons.js), que as valida.
export const PRODUCT_ICONS = [
  { key: 'package', label: 'Caixa', Icon: Package },
  { key: 'zap', label: 'Energético', Icon: Zap },
  { key: 'droplet', label: 'Água / líquidos', Icon: Droplet },
  { key: 'beer', label: 'Cerveja', Icon: Beer },
  { key: 'wine', label: 'Vinho', Icon: Wine },
  { key: 'martini', label: 'Destilados', Icon: Martini },
  { key: 'cup_soda', label: 'Refresco', Icon: CupSoda },
  { key: 'milk', label: 'Leite', Icon: Milk },
  { key: 'coffee', label: 'Café / chá', Icon: Coffee },
  { key: 'croissant', label: 'Pão / bolos', Icon: Croissant },
  { key: 'wheat', label: 'Arroz / farinha', Icon: Wheat },
  { key: 'egg', label: 'Ovos', Icon: Egg },
  { key: 'beef', label: 'Carne', Icon: Beef },
  { key: 'drumstick', label: 'Frango', Icon: Drumstick },
  { key: 'fish', label: 'Peixe', Icon: Fish },
  { key: 'sandwich', label: 'Sandes', Icon: Sandwich },
  { key: 'cookie', label: 'Bolachas', Icon: Cookie },
  { key: 'candy', label: 'Doces', Icon: Candy },
  { key: 'ice_cream', label: 'Gelados', Icon: IceCreamCone },
  { key: 'apple', label: 'Fruta', Icon: Apple },
  { key: 'citrus', label: 'Citrinos', Icon: Citrus },
  { key: 'carrot', label: 'Legumes', Icon: Carrot },
  { key: 'spray_can', label: 'Limpeza', Icon: SprayCan },
  { key: 'bath', label: 'Higiene', Icon: Bath },
  { key: 'snowflake', label: 'Gelo / congelados', Icon: Snowflake },
  { key: 'flame', label: 'Carvão / gás', Icon: Flame },
  { key: 'cigarette', label: 'Tabaco', Icon: Cigarette },
  { key: 'battery', label: 'Pilhas', Icon: Battery },
  { key: 'smartphone', label: 'Recargas / telemóvel', Icon: Smartphone },
  { key: 'pill', label: 'Farmácia', Icon: Pill },
  { key: 'baby', label: 'Bebé', Icon: Baby },
  { key: 'shirt', label: 'Roupa', Icon: Shirt },
];

const BY_KEY = Object.fromEntries(PRODUCT_ICONS.map((i) => [i.key, i.Icon]));
export const iconByKey = (key) => (key && BY_KEY[key]) || null;
