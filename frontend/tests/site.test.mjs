// Fase 11.3: site publico gerado (site/build.js). Corre sem browser:
//   node --test tests/site.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildSite, SITE_ROOT } from '../site/build.js';
import { WHATSAPP, PAYMENT } from '../site/config.js';
import pt from '../site/textos.pt.js';
import en from '../site/textos.en.js';

const pages = buildSite();
const PAGES = {
  'index.html': { path: '/', lang: 'pt-MZ', faq: pt.faq.items.length },
  'planos.html': { path: '/planos', lang: 'pt-MZ', faq: pt.pricing.faq.length },
  'en/index.html': { path: '/en/', lang: 'en', faq: en.faq.items.length },
  'en/pricing.html': { path: '/en/pricing', lang: 'en', faq: en.pricing.faq.length },
};
const jsonLd = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('os ficheiros gravados sao exactamente a saida do gerador', () => {
  for (const [rel, html] of Object.entries(pages)) {
    const file = path.join(SITE_ROOT, rel);
    assert.ok(fs.existsSync(file), 'falta ' + rel + ' (node scripts/gerar_site.mjs)');
    assert.equal(fs.readFileSync(file, 'utf8'), html, rel + ' desactualizado: correr node scripts/gerar_site.mjs');
  }
});

test('cada pagina: lingua, um h1, titulo com Genesis MZ, canonical e hreflang', () => {
  for (const [rel, p] of Object.entries(PAGES)) {
    const html = pages[rel];
    assert.match(html, new RegExp(`<html lang="${p.lang}"`), rel);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, rel + ': um h1');
    assert.match(html.match(/<title>(.*?)<\/title>/)[1], /Genesis MZ/, rel);
    assert.ok(html.includes(`<link rel="canonical" href="https://genesismz.com${p.path}" />`), rel + ': canonical');
    for (const h of ['pt-MZ', 'en', 'x-default']) assert.ok(html.includes(`hreflang="${h}"`), rel + ': hreflang ' + h);
    const desc = html.match(/<meta name="description" content="(.*?)"/)[1];
    assert.ok(desc.length >= 80 && desc.length <= 300, rel + ': description com ' + desc.length);
    assert.ok(!/\{price\}|\{g\}|undefined|\[object/.test(html.replace(/data-wa="[^"]*"/g, '')), rel + ': sem marcadores por preencher');
  }
});

test('JSON-LD: organizacao, aplicacao com o preco em MZN e perguntas', () => {
  for (const [rel, p] of Object.entries(PAGES)) {
    const graph = jsonLd(pages[rel])['@graph'];
    const org = graph.find((g) => g['@type'] === 'Organization');
    assert.equal(org.name, 'Genesis MZ');
    assert.equal(org.contactPoint.telephone, '+' + WHATSAPP);
    const app = graph.find((g) => g['@type'] === 'SoftwareApplication');
    assert.equal(app.offers.price, '3000');
    assert.equal(app.offers.priceCurrency, 'MZN');
    const faq = graph.find((g) => g['@type'] === 'FAQPage');
    assert.equal(faq.mainEntity.length, p.faq, rel + ': perguntas');
    assert.ok(faq.mainEntity.every((q) => q.name && q.acceptedAnswer.text && !q.acceptedAnswer.text.includes('{price}')));
  }
});

test('WhatsApp: sempre o numero da configuracao, mensagem escrita e saudacao por trocar', () => {
  for (const [rel, html] of Object.entries(PAGES).map(([r]) => [r, pages[r]])) {
    const links = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)" data-wa="([^"]+)"/g)];
    assert.ok(links.length >= 2, rel + ': links de WhatsApp');
    for (const [, href, tpl] of links) {
      assert.ok(href.startsWith(`https://wa.me/${WHATSAPP}?text=`), href);
      assert.ok(tpl.startsWith('{g}!'), rel + ': mensagem comeca pela saudacao');
      const text = decodeURIComponent(href.split('?text=')[1]);
      assert.match(text, /^(Olá|Hello)!/, rel + ': sem JS sai com Ola/Hello');
    }
  }
  // O numero so existe em config.js (trocar num sitio).
  for (const f of ['site/textos.pt.js', 'site/textos.en.js', 'site/template.js', 'site/site.js']) {
    assert.ok(!fs.readFileSync(path.join(SITE_ROOT, f), 'utf8').includes('870150055'), f + ' nao tem o numero escrito');
  }
  assert.ok(pages['planos.html'].includes(encodeURIComponent('Quero aderir ao plano Genesis MZ de 3')), 'Aderir leva o plano na mensagem');
  assert.ok(pages['planos.html'].includes('plano anual'), 'plano anual pelo WhatsApp');
  assert.ok(pages['planos.html'].includes(encodeURIComponent('Já paguei')), 'Já paguei pelo WhatsApp');
});

test('acesso a app: Entrar, Terminal e Pedir conta levam data-app', () => {
  for (const rel of Object.keys(PAGES)) {
    for (const href of ['/inicio', '/terminal', '/pedir-conta']) {
      assert.ok(pages[rel].includes(`data-app href="${href}"`) || pages[rel].includes(`href="${href}" class="footer-link" data-app`), rel + ' ' + href);
    }
  }
});

test('so o que esta decidido e verificado', () => {
  const all = Object.keys(PAGES).map((r) => pages[r]).join('\n').toLowerCase();
  for (const bad of ['ilimitad', 'unlimited', 'testemunh', 'testimonial', 'lucrocerto', 'gestão inteligente', 'relatórios automáticos', 'automatic reports', '8.000', '8 000', 'premium']) {
    assert.ok(!all.includes(bad), 'nao pode dizer: ' + bad);
  }
  // Sem contas de pagamento na configuracao, a seccao nao aparece (nada inventado).
  if (!PAYMENT.mobile.length) assert.ok(!pages['planos.html'].includes(pt.pricing.mobileTitle));
  if (!PAYMENT.banks.length) assert.ok(!pages['planos.html'].includes(pt.pricing.bankTitle));
});

test('PT e EN com a mesma estrutura', () => {
  const shape = (t) => [t.pains.items.length, t.features.items.length, t.screens.items.length, t.who.items.length, t.how.items.length,
    t.security.items.length, t.faq.items.length, t.pricing.includedItems.length, t.pricing.paySteps.length, t.pricing.faq.length].join(',');
  assert.equal(shape(pt), shape(en));
  assert.deepEqual(Object.keys(pt.wa), Object.keys(en.wa));
  assert.equal(pt.wa.greet.length, 3);
});

test('imagens: todas existem com as dimensoes do manifesto', () => {
  const html = Object.keys(PAGES).map((r) => pages[r]).join('\n');
  const imgs = [...html.matchAll(/<img src="\/site\/shots\/([^"]+)" width="(\d+)" height="(\d+)" alt="([^"]+)"/g)];
  assert.ok(imgs.length >= 5 * 4 / 2, 'imagens nas paginas');
  for (const [, file, , , alt] of imgs) {
    assert.ok(fs.existsSync(path.join(SITE_ROOT, 'public', 'site', 'shots', file)), file);
    assert.ok(alt.length > 10, file + ': alt');
  }
});

test('sitemap: 4 paginas com alternativas', () => {
  const xml = pages['public/sitemap.xml'];
  assert.equal((xml.match(/<loc>/g) || []).length, 4);
  assert.equal((xml.match(/hreflang=/g) || []).length, 12);
});

// 27/10 (pedido do fundador): os textos sao para o cliente, nao para quem fez o
// sistema. Palavras tecnicas ou de bastidores nao aparecem no site.
test('textos para o cliente: sem palavras tecnicas', () => {
  const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').toLowerCase();
  const banned = {
    pt: ['base de dados', 'servidor', 'auditoria', 'sincroniz', 'lote', 'sessão', 'sessões', 'camadas', 'browser', 'emparelh', 'às cegas'],
    en: ['database', 'server', 'audit', 'sync', 'batch', 'session', 'layers', 'browser', 'pair the', 'blind'],
  };
  for (const [rel, lang] of [['index.html', 'pt'], ['planos.html', 'pt'], ['en/index.html', 'en'], ['en/pricing.html', 'en']]) {
    const t = text(pages[rel]);
    for (const w of banned[lang]) assert.ok(!t.includes(w), rel + ' diz «' + w + '»');
  }
});
