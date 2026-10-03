// Regra unica para a imagem de um produto (catalogo-mestre, import, produtos).
// So https:// (ex.: Open Food Facts) ou a foto do dono ja reduzida no browser
// (data:image png/jpeg/webp em base64, ~256 px). Nada de javascript:, http: ou
// ficheiros enormes dentro da linha do produto.
const { z } = require('zod');

const MAX_IMAGE_CHARS = 60_000;

const imageUrlSchema = z.string()
  .max(MAX_IMAGE_CHARS, 'imagem demasiado grande')
  .regex(/^(https:\/\/|data:image\/(png|jpeg|webp);base64,)/, 'imagem inválida')
  .nullish();

module.exports = { imageUrlSchema, MAX_IMAGE_CHARS };
