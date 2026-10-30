// Pagina 404 do Genesis: «No principio…» — savana ao amanhecer dos tempos, vulcao,
// dinossauros, a arvore e Adao e Eva. So SVG + CSS (sem bibliotecas, sem pedidos
// externos, funciona sem JS). O endereco pedido NUNCA e mostrado (nada a injectar).
// Loop perfeito: cada movimento e de ida-e-volta suave ou atravessa o ecra de ponta
// a ponta fora de vista; as duracoes sao primas entre si, por isso a cena inteira
// quase nunca se repete igual. Gera public/404.html (no git):
//   node scripts/gerar_404.mjs          (--check: falha se o ficheiro estiver desactualizado)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND_GREEN, BRAND_GOLD, MARK_G_PATH, MARK_SQUARE, MARK_VIEWBOX } from '../src/ui/marca.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', '404.html');

// Aleatorio com semente: o ficheiro gerado e sempre igual (--check funciona).
let seed = 20261027;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const r = (a, b) => a + rnd() * (b - a);
const f = (n) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- pecas da cena
const stars = Array.from({ length: 46 }, () =>
  `<circle class="star" cx="${f(r(0, 1600))}" cy="${f(r(10, 230))}" r="${f(r(0.8, 2))}" style="animation-duration:${f(r(3, 9))}s;animation-delay:-${f(r(0, 9))}s"/>`).join('');

function cloud(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="90" ry="22"/><ellipse cx="-38" cy="-14" rx="42" ry="24"/><ellipse cx="22" cy="-20" rx="50" ry="30"/><ellipse cx="66" cy="-6" rx="34" ry="18"/></g>`;
}
const cloudTile = [cloud(140, 150, 1), cloud(520, 90, 0.7), cloud(860, 190, 1.2), cloud(1250, 120, 0.85), cloud(1480, 210, 0.6)].join('');

function acacia(x, y, s, fill) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}"><path d="M-4 0 C-3 -30 -6 -55 -18 -78 L-12 -80 C-2 -62 2 -50 4 -40 C8 -55 16 -68 30 -80 L34 -76 C20 -62 10 -40 6 0 Z"/><ellipse cx="-14" cy="-86" rx="58" ry="11"/><ellipse cx="30" cy="-84" rx="46" ry="9"/><ellipse cx="6" cy="-94" rx="40" ry="8"/></g>`;
}

const smoke = Array.from({ length: 6 }, (_, i) =>
  `<circle class="puff" cx="${1030 + (i % 2 ? 8 : -6)}" cy="330" r="${26 + i * 3}" style="animation-delay:-${f(i * 2.2)}s"/>`).join('');

// Saurópode (pescoco longo), virado para a esquerda; pernas animadas aos pares.
const leg = (x, cls) => `<g class="leg ${cls}"><path d="M${x - 9} 18 L${x + 9} 18 L${x + 7} 96 L${x - 8} 96 Z"/></g>`;
const brachio = `<g class="bob">
  <path d="M-58 -26 C-92 -86 -118 -156 -136 -212 L-114 -220 C-92 -160 -60 -98 -16 -46 Z"/>
  <ellipse cx="-132" cy="-222" rx="26" ry="12"/>
  <path d="M78 -14 C140 -8 196 18 246 46 C190 34 132 28 74 24 Z"/>
  <ellipse cx="6" cy="-4" rx="96" ry="48"/>
  ${leg(-52, 'a')}${leg(-24, 'b')}${leg(44, 'b')}${leg(72, 'a')}
</g>`;

// Tricerátopo pequeno, virado para a direita.
const sleg = (x, cls) => `<g class="leg ${cls}"><path d="M${x - 6} 10 L${x + 6} 10 L${x + 5} 44 L${x - 5} 44 Z"/></g>`;
const trike = `<g class="bob">
  <path d="M-46 -4 C-70 0 -88 8 -104 18 C-84 16 -64 14 -44 12 Z"/>
  <ellipse cx="0" cy="-2" rx="50" ry="26"/>
  <circle cx="50" cy="-20" r="22"/>
  <path d="M52 -14 L92 -10 L64 4 Z"/><path d="M60 -26 L96 -44 L70 -18 Z"/>
  ${sleg(-30, 'a')}${sleg(-12, 'b')}${sleg(16, 'b')}${sleg(34, 'a')}
</g>`;

// Pterossauro: asas batem, o corpo ondula.
const ptero = `<g class="wave"><g class="flap"><path d="M0 0 L-58 -18 L-92 6 L-44 2 Z"/><path d="M0 0 L58 -18 L92 6 L44 2 Z"/></g><path d="M-10 -2 L24 -6 L36 -14 L30 -2 L12 4 Z"/></g>`;

const grass = Array.from({ length: 150 }, (_, i) => {
  const x = f(i * (1600 / 150) + r(-4, 4)); const h = f(r(18, 46)); const lean = f(r(-6, 6));
  return `<path class="blade" style="animation-duration:${f(r(3.5, 6.5))}s;animation-delay:-${f(r(0, 6))}s" d="M${x - 2.5} 900 Q${x + lean} ${900 - h * 0.6} ${x + lean * 1.6} ${f(900 - h)} Q${x + 1} ${900 - h * 0.5} ${x + 2.5} 900 Z"/>`;
}).join('');

const dust = Array.from({ length: 26 }, () =>
  `<circle class="dust" cx="${f(r(380, 1240))}" cy="${f(r(700, 860))}" r="${f(r(1.2, 2.6))}" style="animation-duration:${f(r(7, 15))}s;animation-delay:-${f(r(0, 15))}s"/>`).join('');

const fruits = [[600, 512], [688, 498], [730, 548], [566, 566], [650, 470]].map(([x, y], i) =>
  `<g class="fruit" style="animation-delay:-${i * 1.3}s"><line x1="${x}" y1="${y - 10}" x2="${x}" y2="${y - 2}" stroke="#08352A" stroke-width="2"/><circle cx="${x}" cy="${y + 4}" r="8" fill="${BRAND_GOLD}"/></g>`).join('');

const scene = `<svg class="scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0E2F29"/><stop offset="0.38" stop-color="#5B4A52"/><stop offset="0.62" stop-color="#E5875A"/><stop offset="0.8" stop-color="#F6C46A"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFF4C8"/><stop offset="0.5" stop-color="${BRAND_GOLD}"/><stop offset="1" stop-color="${BRAND_GOLD}" stop-opacity="0"/></radialGradient>
    <radialGradient id="lava" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFE08A"/><stop offset="0.45" stop-color="#FF7A1A"/><stop offset="1" stop-color="#FF4D00" stop-opacity="0"/></radialGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8963F"/><stop offset="1" stop-color="#7C6B2E"/></linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F5240"/><stop offset="1" stop-color="#062A20"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <g fill="#FFF6DD">${stars}</g>
  <g class="sun"><circle cx="820" cy="560" r="230" fill="url(#sun)" opacity="0.55"/><circle cx="820" cy="560" r="96" fill="#FFD25A"/></g>
  <g class="clouds" fill="#FFF1DC" opacity="0.32"><g>${cloudTile}</g><g transform="translate(1600 0)">${cloudTile}</g></g>
  <path fill="#9C5E4D" opacity="0.5" d="M0 560 L120 470 L210 520 L330 440 L470 530 L560 490 L640 560 Z M1240 560 L1340 460 L1420 510 L1510 450 L1600 500 L1600 560 Z"/>
  <g class="smoke" fill="#7A6A66" filter="url(#soft)">${smoke}</g>
  <path fill="#3A2A2B" d="M830 600 L984 352 Q1030 336 1076 352 L1300 600 Z"/>
  <ellipse class="glow" cx="1030" cy="350" rx="70" ry="26" fill="url(#lava)"/>
  <path class="lava" fill="none" stroke="#FF8A1F" stroke-width="5" stroke-linecap="round" d="M1012 356 C1002 400 1010 430 990 470 C980 492 984 520 970 548 M1050 356 C1062 396 1056 432 1078 466 C1090 486 1088 512 1104 540"/>
  <g class="ptero p1" fill="#3B2E33"><g transform="translate(0 230) scale(0.55)">${ptero}</g></g>
  <g class="ptero p2" fill="#3B2E33"><g transform="translate(0 320) scale(0.4)">${ptero}</g></g>
  <path fill="url(#hill)" d="M0 610 C180 578 320 600 480 590 C640 580 760 612 920 600 C1080 588 1240 572 1400 590 C1500 600 1560 596 1600 592 L1600 900 L0 900 Z"/>
  ${acacia(170, 620, 1.1, '#5A4A22')}${acacia(1380, 612, 0.9, '#5A4A22')}${acacia(1520, 640, 1.3, '#4E4120')}${acacia(330, 640, 0.7, '#5A4A22')}
  <g class="walk w-brachio" fill="#2E3F2F"><g transform="translate(0 610) scale(0.78)">${brachio}</g></g>
  <g class="walk w-trike" fill="#1F3A2B"><g transform="translate(0 712) scale(0.62)">${trike}</g><g transform="translate(-150 724) scale(0.48)">${trike.replace('class="bob"', 'class="bob late"')}</g></g>
  <path fill="url(#ground)" d="M0 770 C220 740 420 752 620 760 C820 768 1000 742 1200 748 C1380 754 1500 770 1600 764 L1600 900 L0 900 Z"/>
  <g class="tree"><path fill="#08352A" d="M640 840 C632 760 650 700 628 640 C620 610 600 590 580 580 L592 570 C612 582 630 596 640 616 C648 592 664 574 690 560 L698 572 C676 588 662 610 660 650 C672 720 664 780 676 840 Z"/>
    <path fill="#08352A" d="M716 572 C760 590 792 618 822 652 L816 657 C788 626 756 600 712 582 Z"/>
    <g class="fruit" style="animation-delay:-2.1s"><line x1="820" y1="656" x2="820" y2="666" stroke="#08352A" stroke-width="2"/><circle cx="820" cy="673" r="8" fill="#F2B300"/></g>
    <g class="canopy" fill="#0B4D3B"><circle cx="560" cy="540" r="62"/><circle cx="640" cy="500" r="80"/><circle cx="726" cy="532" r="66"/><circle cx="600" cy="586" r="48"/><circle cx="690" cy="584" r="52"/><circle cx="650" cy="452" r="50"/></g>${fruits}</g>
  <g class="couple" fill="#06241C">
    <g class="adam"><circle cx="738" cy="702" r="15"/><path d="M724 720 C716 760 716 800 722 842 L734 842 L738 790 L742 842 L754 842 C760 800 760 760 752 720 Z"/><path d="M724 726 C712 750 708 772 712 796 L720 796 C720 774 724 756 730 740 Z"/><path d="M752 726 C764 744 772 760 780 774 L774 780 C764 766 756 752 748 740 Z"/></g>
    <g class="eve"><path d="M784 702 C772 704 768 724 774 748 L796 748 C802 724 798 704 784 702 Z"/><circle cx="786" cy="710" r="13"/><path d="M774 728 C766 766 768 804 774 842 L786 842 L788 794 L792 842 L804 842 C808 804 806 766 798 728 Z"/>
      <g class="reach"><path d="M796 732 C803 716 809 702 813 690 L820 693 C815 707 809 722 803 738 Z"/></g></g>
  </g>
  <g fill="#0A4434">${grass}</g>
  <g fill="#FFD25A">${dust}</g>
</svg>`;

const mark = `<svg viewBox="${MARK_VIEWBOX}" width="30" height="30" aria-hidden="true"><path fill="#FFFFFF" d="${MARK_G_PATH}"/><rect x="${MARK_SQUARE.x}" y="${MARK_SQUARE.y}" width="${MARK_SQUARE.width}" height="${MARK_SQUARE.height}" fill="${BRAND_GOLD}"/></svg>`;

const html = `<!doctype html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="${BRAND_GREEN}">
<title>Página não encontrada · Genesis</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<!-- Gerado por scripts/gerar_404.mjs — nao editar a mao. -->
<style>
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:#0E2F29;color:#fff;overflow:hidden}
.scene{position:fixed;inset:0;width:100%;height:100%}
.top{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;padding:max(16px,env(safe-area-inset-top)) 20px 16px;z-index:2}
.brand{display:inline-flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-weight:600;font-size:18px;padding:6px 12px 6px 8px;border-radius:12px;background:rgba(6,36,28,.55)}
.brand span{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9px;background:${BRAND_GREEN}}
main{position:relative;z-index:1;min-height:100%;display:flex;flex-direction:column;align-items:center;padding:clamp(84px,14vh,140px) 20px 0;text-align:center}
.code{font-size:clamp(96px,24vw,230px);line-height:.9;font-weight:800;letter-spacing:-.04em;background:linear-gradient(180deg,#FFF6D6 0%,#FFD25A 55%,#F2B300 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 18px rgba(6,36,28,.45));animation:float 6.5s ease-in-out infinite alternate}
h1{margin-top:12px;font-size:clamp(22px,4.2vw,34px);font-weight:700;text-shadow:0 2px 12px rgba(6,36,28,.6)}
p.lead{margin-top:10px;max-width:34rem;font-size:clamp(15px,2.4vw,18px);line-height:1.5;color:#FFF3E2;text-shadow:0 1px 8px rgba(6,36,28,.7)}
.actions{margin-top:22px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 20px;border-radius:12px;font-weight:600;font-size:16px;text-decoration:none}
.btn-primary{background:#fff;color:${BRAND_GREEN};box-shadow:0 8px 24px rgba(6,36,28,.35)}
.btn-secondary{background:rgba(6,36,28,.6);color:#fff;border:1px solid rgba(255,255,255,.35)}
.btn:focus-visible{outline:3px solid ${BRAND_GOLD};outline-offset:3px}
@media (max-height:560px) and (orientation:landscape){main{padding-top:64px}.code{font-size:min(20vw,120px)}}

@keyframes float{from{transform:translateY(0)}to{transform:translateY(-10px)}}
@keyframes twinkle{from{opacity:.15}to{opacity:.9}}
@keyframes sun{from{transform:scale(1)}to{transform:scale(1.04)}}
@keyframes drift{from{transform:translateX(0)}to{transform:translateX(-1600px)}}
@keyframes puff{0%{transform:translate(0,0) scale(.35);opacity:0}15%{opacity:.42}100%{transform:translate(-60px,-300px) scale(2.4);opacity:0}}
@keyframes glow{from{opacity:.65}to{opacity:1}}
@keyframes walkLeft{from{transform:translateX(1900px)}to{transform:translateX(-420px)}}
@keyframes walkRight{from{transform:translateX(-260px)}to{transform:translateX(1860px)}}
@keyframes step{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-3px)}}
@keyframes fly{from{transform:translateX(-200px)}to{transform:translateX(1800px)}}
@keyframes wave{from{transform:translateY(-14px)}to{transform:translateY(14px)}}
@keyframes flap{from{transform:scaleY(1)}to{transform:scaleY(-.35)}}
@keyframes sway{from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}}
@keyframes swing{from{transform:rotate(-6deg)}to{transform:rotate(6deg)}}
@keyframes breathe{from{transform:scaleY(1)}to{transform:scaleY(1.012)}}
@keyframes reach{from{transform:rotate(-5deg)}to{transform:rotate(7deg)}}
@keyframes blade{from{transform:skewX(-7deg)}to{transform:skewX(7deg)}}
@keyframes rise{0%{transform:translateY(0);opacity:0}20%{opacity:.9}100%{transform:translateY(-140px);opacity:0}}

.scene *{transform-box:fill-box}
.star{animation:twinkle 5s ease-in-out infinite alternate}
.sun{transform-origin:center;animation:sun 11s ease-in-out infinite alternate}
.clouds{animation:drift 149s linear infinite}
.puff{transform-origin:center;animation:puff 13.2s ease-out infinite}
.glow{animation:glow 2.9s ease-in-out infinite alternate}
.lava{stroke-dasharray:6 10;animation:glow 1.7s ease-in-out infinite alternate}
.w-brachio{animation:walkLeft 83s linear infinite;animation-delay:-29s}
.w-trike{animation:walkRight 59s linear infinite;animation-delay:-41s}
.leg{transform-origin:50% 0;animation:step 1.3s ease-in-out infinite alternate}
.leg.b{animation-delay:-1.3s}
.bob{animation:bob .65s ease-in-out infinite alternate}
.bob.late{animation-delay:-.3s}
.p1{animation:fly 37s linear infinite;animation-delay:-8s}
.p2{animation:fly 53s linear infinite;animation-delay:-31s}
.wave{animation:wave 3.1s ease-in-out infinite alternate}
.flap{transform-origin:50% 50%;animation:flap .42s ease-in-out infinite alternate}
.p2 .flap{animation-duration:.53s}
.canopy{transform-origin:50% 100%;animation:sway 7s ease-in-out infinite alternate}
.fruit{transform-origin:50% 0;animation:swing 4.3s ease-in-out infinite alternate}
.adam,.eve{transform-origin:50% 100%;animation:breathe 4.7s ease-in-out infinite alternate}
.eve{animation-duration:5.3s}
.reach{transform-origin:0 100%;animation:reach 6.1s ease-in-out infinite alternate}
.blade{transform-origin:50% 100%;animation:blade 5s ease-in-out infinite alternate}
.dust{animation:rise 11s ease-out infinite}

@media (prefers-reduced-motion:reduce){
  .scene *,.code{animation:none!important}
  .w-brachio{transform:translateX(1180px)}
  .w-trike{transform:translateX(330px)}
  .p1{transform:translateX(420px)}
  .p2{display:none}
  .puff,.dust{display:none}
}
</style>
</head>
<body>
${scene}
<header class="top"><a class="brand" href="/"><span>${mark}</span>Genesis</a></header>
<main>
  <div class="code" aria-hidden="true">404</div>
  <h1 data-en="In the beginning, this page did not exist.">No princípio, esta página não existia.</h1>
  <p class="lead" data-en="The address you tried is not part of Genesis. Go back to the start and carry on with your story.">O endereço que procurou não faz parte do Genesis. Volte ao início e continue a sua história.</p>
  <div class="actions">
    <a class="btn btn-primary" href="/" target="_top" data-en="Back to the start">Voltar ao início</a>
    <a class="btn btn-secondary" href="/inicio" target="_top" data-en="Sign in">Entrar</a>
  </div>
</main>
<script>
// Ingles para quem tem o aparelho em ingles (sem JS fica em portugues).
try {
  var l = (localStorage.getItem('genesis.lang') || navigator.language || 'pt').slice(0, 2);
  if (l === 'en') {
    document.documentElement.lang = 'en';
    document.title = 'Page not found · Genesis';
    document.querySelectorAll('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-en'); });
  }
} catch (e) {}
</script>
</body>
</html>
`;

if (process.argv.includes('--check')) {
  const now = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (now !== html) { console.error('public/404.html desactualizado: correr node scripts/gerar_404.mjs'); process.exit(1); }
  console.log('404.html em dia');
} else {
  fs.writeFileSync(OUT, html);
  console.log('escrito ' + path.relative(ROOT, OUT) + ' (' + Math.round(html.length / 1024) + ' KB)');
}
