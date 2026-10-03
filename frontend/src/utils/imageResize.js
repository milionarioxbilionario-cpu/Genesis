// Foto do produto tirada/escolhida pelo dono -> data URL pequena (cabe na linha
// do produto e no catalogo offline do terminal). Limite igual ao do servidor
// (backend/src/utils/productImage.js: 60 000 caracteres).
export const MAX_IMAGE_CHARS = 60_000;

export async function photoToDataUrl(file, maxSide = 256) {
  if (!file || !/^image\//.test(file.type)) throw new Error('Escolha uma imagem (fotografia).');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  // Fundo branco: fotos com transparencia ficam limpas em JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    let url = canvas.toDataURL('image/webp', quality);
    if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality); // browsers sem WebP
    if (url.length <= MAX_IMAGE_CHARS) return url;
  }
  throw new Error('A imagem continua demasiado grande. Tente outra fotografia.');
}
