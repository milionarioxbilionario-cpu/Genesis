// Lingua das mensagens que o SERVIDOR escreve para fora da app (Fase 9.6):
// WhatsApp ao fornecedor, alertas, relatorios por WhatsApp, codigo de
// recuperacao (email/WhatsApp). Decisao do fundador (12/10): saem na lingua de
// quem as gera. O ecra manda a sua lingua no cabecalho X-Genesis-Lang
// (frontend/src/utils/api.js); o relatorio automatico usa a lingua da conta do
// dono. Como no frontend, a chave e o texto em portugues; sem traducao fica o
// portugues. As mensagens de erro da API continuam em portugues (o ecra
// traduz pelo texto ou pelo `code`).
const LANGS = ['pt', 'en'];
const pickLang = (v) => (LANGS.includes(String(v || '').toLowerCase()) ? String(v).toLowerCase() : 'pt');
const reqLang = (req) => pickLang(req && typeof req.get === 'function' ? req.get('x-genesis-lang') : null);

const EN = {
  // Lista de compras -> fornecedor
  'Olá{name}, daqui fala {store}.': 'Hello{name}, this is {store}.',
  'a loja': 'the store',
  'Gostaria de encomendar:': 'I would like to order:',
  'Pode confirmar o preço e quando entrega? Obrigado.': 'Can you confirm the price and when you deliver? Thank you.',
  // Alertas
  'Stock baixo: {list}': 'Low stock: {list}',
  'Validades: {list}': 'Expiry dates: {list}',
  '{name} — {n} un. {state}': '{name} — {n} units {state}',
  'expiradas': 'expired',
  'expiram hoje': 'expire today',
  'expiram em {n} dia(s)': 'expire in {n} day(s)',
  'gestor': 'manager',
  'Olá {name}, todos os produtos estão dentro do normal.': 'Hello {name}, all products are within normal levels.',
  'Olá {name}, Genesis reportou alertas operacionais: {list}': 'Hello {name}, Genesis reported operational alerts: {list}',
  'Genesis: teste de ligação WhatsApp da loja {name}.': 'Genesis: WhatsApp connection test for the store {name}.',
  // Relatorios por WhatsApp
  'Relatório diário {day}': 'Daily report {day}',
  ' (até agora)': ' (so far)',
  'Relatório semanal {from} a {to}': 'Weekly report {from} to {to}',
  'Relatório mensal {month}': 'Monthly report {month}',
  'Receita: {value} ({n} venda(s))': 'Revenue: {value} ({n} sale(s))',
  'Lucro bruto: {value}': 'Gross profit: {value}',
  'Lucro líquido real: {value}': 'Real net profit: {value}',
  'Perdas: {value}': 'Losses: {value}',
  'Mais vendido: {name} ({n} un.)': 'Best seller: {name} ({n} units)',
  'Vendas perdidas: {n} un. pedidas e sem stock': 'Lost sales: {n} units asked for and out of stock',
  'Ver tudo: {url}': 'See everything: {url}',
  // Recuperacao da senha
  'Genesis: codigo de recuperacao {code}. Valido 15 minutos.': 'Genesis: recovery code {code}. Valid for 15 minutes.',
  '{code} é o seu código de recuperação Genesis': '{code} is your Genesis recovery code',
  'Recebeu este pedido porque solicitou a recuperação da palavra-passe no Genesis.': 'You received this because you asked to recover your Genesis password.',
  'O seu código de recuperação é: {code}': 'Your recovery code is: {code}',
  'Este código é válido por 15 minutos e permite até 5 tentativas.': 'This code is valid for 15 minutes and allows up to 5 attempts.',
  'Se não fez este pedido, ignore este email. A sua palavra-passe mantém-se inalterada.': 'If you did not make this request, ignore this email. Your password stays the same.',
  'Recuperação de Palavra-passe': 'Password recovery',
  'Recebeu este pedido porque solicitou a reposição da sua palavra-passe na plataforma Genesis.': 'You received this because you asked to reset your password on the Genesis platform.',
  'O código é válido por <strong>15 minutos</strong> e permite até 5 tentativas.': 'The code is valid for <strong>15 minutes</strong> and allows up to 5 attempts.',
  'Se não fez este pedido, pode ignorar esta mensagem com total segurança.': 'If you did not make this request, you can safely ignore this message.',
};
const DICTS = { en: EN };

function tr(lang, text, vars) {
  const out = (lang !== 'pt' && DICTS[lang] && Object.prototype.hasOwnProperty.call(DICTS[lang], text)) ? DICTS[lang][text] : text;
  if (!vars) return out;
  return out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined || vars[k] === null ? m : String(vars[k])));
}

// Numeros como no ecra: pt-PT "1 279,50" / en-GB "1,279.50".
const numberLocale = (lang) => (lang === 'en' ? 'en-GB' : 'pt-PT');

module.exports = { LANGS, pickLang, reqLang, tr, numberLocale, EN };
