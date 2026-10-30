// Etapa A9: cartao «Conta criada» em imagem (PNG) para enviar ao dono pelo
// WhatsApp, e a mensagem de boas-vindas. Sempre em portugues (e o texto do
// cliente, nao do painel). O simbolo vem da mesma fonte que o resto da marca.
import { BRAND_GREEN, BRAND_GOLD, MARK_G_PATH, MARK_SQUARE } from '../../frontend/src/ui/marca.js';

const W = 720;
const H = 900;
const SCALE = 2;

// Endereco da app (o admin vive em admin.<dominio>).
export function appUrl() {
  const { protocol, host } = window.location;
  return host.startsWith('admin.') ? `${protocol}//${host.slice(6)}` : 'https://genesismz.com';
}

const fmtDate = (d) => new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

// 84xxxxxxx -> 25884xxxxxxx; ja com indicativo fica igual.
export function whatsappNumber(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return d.length === 9 && d.startsWith('8') ? '258' + d : d;
}

export function welcomeMessage(a) {
  return [
    `Olá${a.owner_name ? ' ' + a.owner_name : ''}! A conta do ${a.name} no Genesis está pronta.`,
    '',
    `Entrar: ${appUrl()}/entrar`,
    `E-mail: ${a.email}`,
    `Senha temporária: ${a.temporaryPassword}`,
    `Teste grátis até: ${fmtDate(a.trial_ends_at)}`,
    '',
    'No primeiro acesso, mude a senha em Perfil.',
  ].join('\n');
}

export function whatsappLink(a) {
  return `https://wa.me/${whatsappNumber(a.phone)}?text=${encodeURIComponent(welcomeMessage(a))}`;
}

function drawMark(ctx, x, y, size) {
  const k = size / 365;
  ctx.save();
  ctx.translate(x - 357.5 * k, y - 357.5 * k);
  ctx.scale(k, k);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill(new Path2D(MARK_G_PATH));
  ctx.fillStyle = BRAND_GOLD;
  ctx.fillRect(MARK_SQUARE.x, MARK_SQUARE.y, MARK_SQUARE.width, MARK_SQUARE.height);
  ctx.restore();
}

function fit(ctx, text, max) {
  let s = String(text);
  while (s.length > 1 && ctx.measureText(s).width > max) s = s.slice(0, -2) + '…';
  return s;
}

export function drawAccountCard(ctx, a) {
  const font = (w, px) => `${w} ${px}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);
  // Faixa verde da marca.
  ctx.fillStyle = BRAND_GREEN;
  ctx.fillRect(0, 0, W, 190);
  drawMark(ctx, 48, 52, 86);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = font(700, 40);
  ctx.fillText('Genesis', 152, 108);
  ctx.font = font(400, 20);
  ctx.fillText('Gestão do seu negócio', 152, 140);

  ctx.fillStyle = '#1C1917';
  ctx.font = font(700, 34);
  ctx.fillText('A sua conta está pronta', 48, 262);
  ctx.fillStyle = '#57534E';
  ctx.font = font(400, 22);
  ctx.fillText(fit(ctx, `${a.owner_name ? a.owner_name + ' · ' : ''}${a.name}`, W - 96), 48, 300);

  const rows = [
    ['Entrar em', `${appUrl().replace(/^https?:\/\//, '')}/entrar`],
    ['E-mail', a.email],
    ['Senha temporária', a.temporaryPassword, true],
    ['Teste grátis até', fmtDate(a.trial_ends_at)],
  ];
  let y = 360;
  for (const [label, value, strong] of rows) {
    ctx.fillStyle = '#F5F5F4';
    ctx.fillRect(48, y, W - 96, 92);
    ctx.fillStyle = '#78716C';
    ctx.font = font(500, 18);
    ctx.fillText(label.toUpperCase(), 72, y + 34);
    ctx.fillStyle = strong ? BRAND_GREEN : '#1C1917';
    ctx.font = strong ? font(700, 30) : font(600, 24);
    ctx.fillText(fit(ctx, value, W - 144), 72, y + 72);
    y += 108;
  }
  ctx.fillStyle = '#57534E';
  ctx.font = font(400, 20);
  ctx.fillText('No primeiro acesso, mude a senha em Perfil.', 48, y + 30);
  ctx.fillText('Guarde esta imagem num lugar seguro.', 48, y + 60);
}

export async function buildAccountCard(a) {
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  drawAccountCard(ctx, a);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// Partilha (telemovel: abre o WhatsApp com a imagem) ou descarrega.
export async function shareOrDownloadCard(a) {
  const blob = await buildAccountCard(a);
  const name = `genesis-conta-${String(a.name || 'estabelecimento').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: welcomeMessage(a) }); return 'shared'; } catch (err) { if (err?.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
