// Site publico (Fase 11.3): valores que mudam com decisoes do fundador. FONTE
// UNICA — o gerador (scripts/gerar_site.mjs) le daqui e escreve os HTML. Depois
// de mudar alguma coisa: `node scripts/gerar_site.mjs` e publicar.

export const SITE_URL = 'https://genesismz.com';
// Data das paginas (sitemap + JSON-LD). Mudar quando o conteudo mudar.
export const SITE_UPDATED = '2026-10-25';

// Contacto de vendas no WhatsApp (provisorio, numero do fundador, 24/10/2026).
export const WHATSAPP = '258870150055';
export const WHATSAPP_DISPLAY = '+258 87 015 0055';

// Plano unico (decisao de 24/10/2026). Centavos, como no resto do Genesis.
export const PLAN_PRICE_CENTS = 300000;

// Onde pagar (pedido do fundador 25/10/2026). Vazio = a seccao nao aparece e
// a forma de pagamento combina-se pelo WhatsApp. NUNCA inventar numeros:
// so os que o fundador der. Exemplo:
//   mobile: [{ name: 'e-Mola', number: '87 000 0000', holder: 'Nome do titular' }]
//   banks:  [{ name: 'BCI', account: '0000000000', nib: '0008 0000 0000000000000', holder: 'Nome' }]
export const PAYMENT = {
  mobile: [],
  banks: [],
};
