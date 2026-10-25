// Textos do site publico em portugues (Fase 11.3). So o que o Genesis faz e
// esta verificado (Mapa Mental): nada de relatorios automaticos por WhatsApp
// (desligados), testemunhos, numeros de clientes nem "ilimitado".
// {price} = preco do plano formatado; {g} = saudacao (bom dia/boa tarde/boa noite).

export default {
  lang: 'pt',
  htmlLang: 'pt-MZ',
  ogLocale: 'pt_MZ',
  paths: { home: '/', pricing: '/planos' },
  other: { lang: 'en', home: '/en/', pricing: '/en/pricing', label: 'English', short: 'EN' },
  og: '/site/og-pt.png',
  price: (n) => `${n.toLocaleString('pt-PT', { useGrouping: 'always' }).replace(/\s/g, ' ')} MT`,
  perMonth: '/mês',

  meta: {
    home: {
      title: 'Genesis MZ — Sistema de vendas, stock e caixa para lojas em Moçambique',
      description: 'Ponto de venda para bottle stores, mercearias, padarias, talhos, restaurantes e supermercados em Moçambique. Vende sem internet, controla stock e validades, fecho de caixa e lucro real. 1.º mês grátis.',
    },
    pricing: {
      title: 'Planos e preço — Genesis MZ',
      description: 'Genesis MZ custa {price} por mês, com tudo incluído. Clientes novos não pagam o 1.º mês. Adira pelo WhatsApp.',
    },
  },

  nav: {
    features: 'Funcionalidades', who: 'Para quem', how: 'Como começar', pricing: 'Planos', faq: 'Perguntas',
    signIn: 'Entrar', terminal: 'Terminal', start: 'Experimentar grátis', menu: 'Abrir o menu', home: 'Início',
  },

  wa: {
    greet: ['Bom dia', 'Boa tarde', 'Boa noite'],
    fallback: 'Olá',
    contact: '{g}! Quero saber mais sobre o Genesis MZ.',
    join: '{g}! Quero aderir ao plano Genesis MZ de {price}/mês.',
    annual: '{g}! Tenho interesse no plano anual do Genesis MZ. Podem dar-me mais informações?',
    paid: '{g}! Já paguei a subscrição do Genesis MZ e vou enviar o comprovativo. O email da minha conta é: ',
  },

  hero: {
    eyebrow: 'Ponto de venda para lojas em Moçambique',
    title: 'Vendas, stock e caixa da sua loja — mesmo sem internet',
    lead: 'Com o Genesis MZ, os caixistas vendem no terminal e o dono acompanha o lucro real, o stock e as chenecas, no computador ou no telemóvel.',
    primary: 'Experimentar grátis',
    secondary: 'Falar no WhatsApp',
    note: '1.º mês grátis para clientes novos · depois {price}/mês',
    shotAlt: 'Terminal de vendas do Genesis MZ com o cesto de um cliente e as formas de pagamento Dinheiro, M-Pesa, e-Mola e Cartão',
    phoneAlt: 'Painel do dono do Genesis MZ no telemóvel, com a receita do dia e do mês',
  },

  pains: {
    title: 'Os problemas de todos os dias, resolvidos',
    lead: 'O que mais custa a uma loja pequena raramente é uma venda. É o dinheiro que falta, o stock que estraga e a cheneca que ninguém cobrou.',
    items: [
      { icon: 'wallet', q: 'Falta dinheiro na caixa', a: 'No fecho do turno o caixista conta o dinheiro sem ver quanto devia haver. O Genesis compara e o dono vê a diferença. Três contagens abaixo bloqueiam o perfil até o dono decidir.' },
      { icon: 'calendar-clock', q: 'O stock desaparece ou estraga', a: 'Stock por lotes, com validade. Sai sempre primeiro o que expira primeiro, o alerta chega antes de expirar e as perdas ficam registadas com o motivo.' },
      { icon: 'hand-coins', q: 'As chenecas ficam esquecidas', a: 'Cada cheneca com nome, telefone, valor e data de pagamento. O alerta mostra as que vencem hoje, amanhã ou já passaram.' },
      { icon: 'chart-column', q: 'Não sabe quanto lucra de verdade', a: 'O relatório do mês desconta salários, renda, despesas e entregas dos fornecedores. Vê o lucro líquido, não só o que entrou na caixa.' },
    ],
  },

  features: {
    title: 'Tudo o que a loja precisa, num só sistema',
    items: [
      { icon: 'scan-barcode', t: 'Terminal de vendas rápido', d: 'Pesquisa sem acentos, leitor de código de barras, câmara do telemóvel e atalhos de teclado. Cada caixista entra com o seu PIN de 4 dígitos.' },
      { icon: 'wifi-off', t: 'Vende sem internet', d: 'As vendas ficam guardadas no aparelho e seguem sozinhas quando a rede volta. Cada venda tem o seu número: nunca é contada duas vezes.' },
      { icon: 'smartphone', t: 'Dinheiro, M-Pesa, e-Mola e Cartão', d: 'Cada forma de pagamento aparece separada nos relatórios e no fecho do turno.' },
      { icon: 'lock-keyhole', t: 'PIN do dono para o que é sensível', d: 'Cancelar uma venda, dar um desconto acima do limite ou abrir de novo o turno exige o PIN do dono. As tentativas erradas ficam registadas.' },
      { icon: 'qr-code', t: 'Recibo com QR de verificação', d: 'Recibo em PDF ou impresso. O cliente lê o QR e confirma que o recibo é verdadeiro.' },
      { icon: 'file-chart-column', t: 'Relatórios diário, semanal e mensal', d: 'Mais vendido e mais rentável, comparação com o período anterior, vendas perdidas por falta de produto e PDF para partilhar.' },
      { icon: 'shopping-cart', t: 'Lista de compras sugerida', d: 'O Genesis sugere o que comprar a partir das vendas. A lista segue para o fornecedor pelo WhatsApp num toque.' },
      { icon: 'bell', t: 'Alertas num só sino', d: 'Stock no mínimo, validades, chenecas, diferenças no fecho do turno e meta do mês atingida.' },
      { icon: 'users', t: 'Equipa e metas', d: 'Caixistas, trabalhadores e salários. Meta de vendas do mês com o progresso dia a dia.' },
      { icon: 'languages', t: 'Português e inglês', d: 'Cada pessoa escolhe a sua língua: painel, terminal, recibos e PDFs.' },
    ],
  },

  screens: {
    title: 'Veja como é',
    lead: 'Imagens reais do Genesis MZ, numa loja de demonstração.',
    items: [
      { key: 'inicio', cap: 'Painel do dono: o dia, o mês e a meta' },
      { key: 'mensal', cap: 'Relatório mensal: do que entrou ao lucro líquido' },
      { key: 'alertas', cap: 'Alertas: stock, validades e chenecas' },
    ],
  },

  who: {
    title: 'Feito para o comércio moçambicano',
    lead: 'Ao configurar a loja escolhe o tipo de negócio e recebe um catálogo pronto com os produtos mais comuns (mais de 200 no total), com preços sugeridos que pode ajustar. Em meticais, com M-Pesa e e-Mola.',
    items: [
      { icon: 'beer', t: 'Bottle store' }, { icon: 'shopping-basket', t: 'Mercearia' }, { icon: 'croissant', t: 'Padaria' },
      { icon: 'beef', t: 'Talho' }, { icon: 'utensils', t: 'Restaurante' }, { icon: 'store', t: 'Supermercado' },
    ],
    other: 'O seu negócio não está na lista? Fale connosco.',
  },

  how: {
    title: 'Como começar',
    items: [
      { t: 'Peça a conta', d: 'Preencha o pedido com o nome da loja, o tipo de negócio e o seu email.' },
      { t: 'Receba o acesso', d: 'Aprovamos o pedido e enviamos-lhe os dados para entrar. O mês grátis começa aqui.' },
      { t: 'Configure em 5 passos', d: 'Tipo de negócio, catálogo com preços, custos, equipa e fornecedores, e horário — com explicação em cada passo.' },
      { t: 'Ligue o balcão', d: 'Emparelhe o computador ou tablet do balcão com um código de 6 dígitos e comece a vender.' },
    ],
  },

  security: {
    title: 'Os dados da sua loja são só seus',
    items: [
      'Cada loja está separada das outras em duas camadas independentes: no programa e na própria base de dados.',
      'Os caixistas não veem custos, margens, relatórios nem as vendas dos colegas.',
      'Cancelamentos, descontos e ajustes de stock ficam no histórico que o dono consulta.',
      'Mudar a senha ou o PIN termina logo as sessões antigas.',
    ],
  },

  priceBlock: {
    title: 'Um só plano, com tudo incluído',
    lead: 'Todas as funcionalidades desta página, para a sua loja.',
    free: 'Clientes novos: o 1.º mês é grátis.',
    cta: 'Ver o plano',
  },

  faq: {
    title: 'Perguntas frequentes',
    items: [
      { q: 'Preciso de internet para vender?', a: 'Não. Depois de o terminal abrir uma vez com rede, continua a vender sem internet e envia as vendas quando a ligação volta. Para ver os relatórios no painel do dono precisa de internet.' },
      { q: 'Que equipamento preciso?', a: 'Um computador, tablet ou telemóvel com um browser actual (Chrome, Edge ou Safari). O leitor de código de barras e a impressora de talões são opcionais: sem impressora, o recibo sai em PDF.' },
      { q: 'Funciona no telemóvel?', a: 'Sim. O painel do dono e o terminal funcionam no telemóvel e podem ser instalados no ecrã principal, como uma app.' },
      { q: 'Os caixistas veem o lucro da loja?', a: 'Não. O caixista só vê o terminal: vende, imprime o recibo e regista quebras e pedidos de clientes. Custos, margens e relatórios são só do dono.' },
      { q: 'Quanto custa?', a: '{price} por mês, com tudo incluído. Clientes novos não pagam o 1.º mês.' },
      { q: 'Como pago e como cancelo?', a: 'Por agora, a forma de pagamento e o cancelamento combinam-se connosco pelo WhatsApp.' },
      { q: 'Posso usar o Genesis em inglês?', a: 'Sim. Cada pessoa escolhe português ou inglês, e a escolha fica guardada na conta.' },
    ],
  },

  final: {
    title: 'Comece hoje, sem pagar o 1.º mês',
    lead: 'O pedido de conta é um formulário curto. Se tiver dúvidas, fale connosco no WhatsApp.',
  },

  footer: {
    tagline: 'Vendas, stock e caixa para lojas em Moçambique.',
    product: 'Produto', access: 'Acesso', contact: 'Contacto', request: 'Pedir conta',
    whatsapp: 'WhatsApp',
    rights: '© 2026 Genesis MZ',
  },

  pricing: {
    eyebrow: 'Planos',
    title: 'Um preço simples para a sua loja',
    lead: 'Um só plano, com todas as funcionalidades. Sem surpresas.',
    planName: 'Genesis MZ',
    planDesc: 'Para uma loja, com o dono, os caixistas e o balcão.',
    free: 'Clientes novos: o 1.º mês é grátis — só começa a pagar no 2.º mês.',
    join: 'Aderir ao plano',
    start: 'Começar o mês grátis',
    included: 'Incluído no plano',
    includedItems: [
      'Terminal de vendas com PIN para cada caixista',
      'Vendas sem internet, enviadas quando a rede volta',
      'Dinheiro, M-Pesa, e-Mola e Cartão separados',
      'Stock por lotes, validades e alertas',
      'Fecho de turno às cegas',
      'Chenecas, fornecedores e lista de compras',
      'Relatórios diário, semanal e mensal com lucro líquido',
      'Recibos em PDF ou impressos, com QR',
      'Equipa, salários e metas',
      'Português e inglês',
    ],
    annualTitle: 'Prefere pagar o ano inteiro?',
    annualText: 'Fale connosco sobre o plano anual.',
    annualCta: 'Perguntar pelo plano anual',
    payTitle: 'Como aderir e pagar',
    paySteps: [
      { t: 'Toque em «Aderir ao plano»', d: 'Abre uma conversa connosco no WhatsApp, já com a mensagem escrita.' },
      { t: 'Combinamos o pagamento', d: 'Indicamos-lhe como pagar e o valor certo.' },
      { t: 'Envie o comprovativo', d: 'Depois de pagar, envie-nos o comprovativo e o email da sua conta.' },
    ],
    paidCta: 'Já paguei — enviar comprovativo',
    mobileTitle: 'Carteira móvel',
    bankTitle: 'Depósito ou transferência bancária',
    account: 'Conta', nib: 'NIB', holder: 'Titular',
    faqTitle: 'Perguntas sobre o plano',
    faq: [
      { q: 'Quando começo a pagar?', a: 'O mês grátis começa quando a sua conta é aprovada. Só paga a partir do 2.º mês.' },
      { q: 'O que acontece se o mês grátis acabar sem pagamento?', a: 'Não perde nada. O painel continua a abrir só para consulta: vê o histórico e os relatórios, mas não regista vendas novas até a subscrição ser paga.' },
      { q: 'O mês grátis é para todos?', a: 'É só para clientes novos.' },
      { q: 'Como pago e como cancelo?', a: 'Por agora, combinamos tudo pelo WhatsApp: a forma de pagamento, o comprovativo e o cancelamento.' },
    ],
  },
};
