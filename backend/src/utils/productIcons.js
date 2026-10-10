// Icones que o dono pode escolher para um produto (Fase 8.2). A mesma lista
// existe no frontend (src/utils/productIcons.js) com o desenho de cada um;
// aqui so se valida a chave. null = icone automatico pela categoria.
const { z } = require('zod');

const PRODUCT_ICONS = [
  'package', 'zap', 'droplet', 'beer', 'wine', 'martini', 'cup_soda', 'milk', 'coffee',
  'croissant', 'wheat', 'egg', 'beef', 'drumstick', 'fish', 'sandwich', 'cookie', 'candy',
  'ice_cream', 'apple', 'citrus', 'carrot', 'spray_can', 'bath', 'snowflake', 'flame',
  'cigarette', 'battery', 'smartphone', 'pill', 'baby', 'shirt',
];

const iconSchema = z.enum(PRODUCT_ICONS, { errorMap: () => ({ message: 'ícone inválido' }) }).nullish();

module.exports = { PRODUCT_ICONS, iconSchema };
