// Textos do site publico em portugues (Fase 11.3; reescritos na Fase 14 a pedido
// do fundador: cada problema escrito como SOLUCAO e cada funcionalidade com
// «Ver mais detalhes»). So o que o Genesis faz e
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
    signInLong: 'Entrar no painel', terminalLong: 'Abrir o terminal',
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
    lead: 'Os caixistas vendem no terminal com o PIN deles. O dono vê no telemóvel quanto entrou, o lucro real, o stock, as validades e as chenecas — e ninguém mexe no dinheiro sem ficar registado.',
    already: 'Já tem conta?',
    counter: 'No balcão?',
    primary: 'Experimentar grátis',
    secondary: 'Falar no WhatsApp',
    note: '1.º mês grátis para clientes novos · depois {price}/mês, com tudo incluído',
    trust: ['Vende sem internet', 'Dinheiro, M-Pesa, e-Mola e Cartão', 'Painel com PIN e Face ID', 'Telemóvel, tablet e computador'],
    shotAlt: 'Terminal de vendas do Genesis MZ com o cesto de um cliente e as formas de pagamento Dinheiro, M-Pesa, e-Mola e Cartão',
    phoneAlt: 'Painel do dono do Genesis MZ no telemóvel, com a receita do dia e do mês',
  },

  pains: {
    title: 'O que o Genesis resolve na sua loja',
    lead: 'O que mais custa a uma loja pequena raramente é uma venda. É o dinheiro que falta, o stock que estraga e a cheneca que ninguém cobrou. Para cada um, o Genesis tem uma resposta.',
    problem: 'O problema',
    solution: 'Como o Genesis resolve',
    items: [
      { icon: 'wallet', q: 'Falta dinheiro na caixa', a: 'No fecho do turno o caixista conta o dinheiro sem ver quanto devia haver (fecho às cegas). O Genesis compara com as vendas e mostra ao dono a diferença. Três contagens abaixo bloqueiam o perfil até o dono decidir.' },
      { icon: 'calendar-clock', q: 'Produtos que estragam ou passam da validade', a: 'O Genesis controla as validades: cada compra entra como um lote com a sua data, vende-se sempre primeiro o lote que expira primeiro, o alerta chega antes de expirar e o que passa do prazo fica registado como perda, com o motivo.' },
      { icon: 'hand-coins', q: 'Chenecas esquecidas', a: 'Cada cheneca fica com nome, telefone, valor e data de pagamento. O Genesis avisa das que vencem hoje, amanhã ou já passaram, e regista cada pagamento.' },
      { icon: 'chart-column', q: 'Não saber quanto lucra de verdade', a: 'O relatório do mês desconta ao que entrou os salários, a renda, as despesas e as entregas dos fornecedores. Vê o lucro líquido real, não só o dinheiro da caixa.' },
    ],
  },

  features: {
    title: 'Tudo o que a loja precisa, num só sistema',
    lead: 'Um resumo de cada parte. Toque em «Ver mais detalhes» para saber exactamente o que faz.',
    more: 'Ver mais detalhes',
    items: [
      { icon: 'scan-barcode', t: 'Terminal de vendas rápido', d: 'Pesquisa, leitor de código de barras, câmara do telemóvel e atalhos de teclado. Cada caixista entra com o seu PIN.', more: ['Pesquisa sem acentos: «agua» encontra «Água».', 'Leitor de código de barras USB ou Bluetooth e câmara do telemóvel.', 'Atalhos de teclado para cobrar, desconto, valor recebido, forma de pagamento e categorias.', 'Cada caixista entra no terminal com o seu PIN de 4 dígitos; a conta do dono nunca fica no balcão.', 'No telemóvel os produtos ocupam o ecrã e o total fica numa barra em baixo.'] },
      { icon: 'wifi-off', t: 'Vende sem internet', d: 'As vendas ficam no aparelho e seguem sozinhas quando a rede volta. O terminal abre mesmo sem rede.', more: ['O terminal abre sem internet com os perfis guardados e o caixista entra com o PIN.', 'Cada venda tem o seu número desde o aparelho: quando sincroniza, nunca é contada duas vezes.', 'Quando a venda chega, o servidor volta a confirmar preços e stock.', 'Sem internet, o dono vê no painel os dados que já tinha aberto, só para consulta.'] },
      { icon: 'smartphone', t: 'Dinheiro, M-Pesa, e-Mola e Cartão', d: 'Cada forma de pagamento aparece separada nos relatórios e no fecho do turno.', more: ['O troco é calculado no ecrã.', 'O fecho do turno conta só o dinheiro vivo; M-Pesa, e-Mola e cartão aparecem à parte.', 'Os relatórios mostram quanto entrou por cada forma de pagamento.'] },
      { icon: 'calendar-clock', t: 'Stock por lotes e validades', d: 'Cada compra é um lote com data de validade. O Genesis vende primeiro o que expira primeiro e avisa antes.', more: ['O dono escolhe quantos dias antes da validade quer ser avisado.', 'No dia seguinte à validade, o que não se vendeu é registado como perda automaticamente.', 'Quebras (partido, consumo interno…) ficam registadas com o motivo.', 'Ajustes de stock só pelo dono, sempre registados.'] },
      { icon: 'lock-keyhole', t: 'PIN do dono para o que é sensível', d: 'Cancelar uma venda, dar um desconto acima do limite ou abrir de novo o turno exige o PIN do dono.', more: ['Até ao limite que o dono escolhe, o caixista dá o desconto sozinho; acima, precisa do PIN.', 'Os PINs errados ficam registados; demasiados erros bloqueiam durante 15 minutos.', 'Tudo fica no histórico (auditoria) que o dono consulta.'] },
      { icon: 'fingerprint-pattern', t: 'Painel do dono protegido', d: 'O painel pede o seu PIN (ou Face ID / impressão digital) sempre que abre a app e depois de 5 minutos parado.', more: ['Se alguém pegar no seu telemóvel, não vê os números da loja.', 'Cinco PINs errados terminam a sessão: só se volta a entrar com o email e a senha.', 'Modo privado: um toque no olho esconde do ecrã todos os valores em dinheiro.'] },
      { icon: 'qr-code', t: 'Recibo com QR de verificação', d: 'Recibo em PDF ou impresso. O cliente lê o QR e confirma que o recibo é verdadeiro.', more: ['Impressora térmica de talões (opcional) ou PDF para partilhar.', 'O QR abre uma página do Genesis que confirma a venda.'] },
      { icon: 'shopping-cart', t: 'Lista de compras sugerida', d: 'O Genesis sugere o que comprar a partir das vendas e envia a lista ao fornecedor pelo WhatsApp.', more: ['Conta o que se vendeu, o stock que falta e o que os clientes pediram e não havia.', 'Mostra o investimento ao preço de custo e a entrega do fornecedor.', 'A mensagem segue já escrita para o WhatsApp do fornecedor.'] },
      { icon: 'bell', t: 'Alertas num só sino', d: 'Stock no mínimo, validades, chenecas, diferenças no fecho do turno e meta do mês atingida.', more: ['Os alertas desaparecem sozinhos quando a situação se resolve.', 'Tocar num alerta abre a página certa.'] },
      { icon: 'users', t: 'Equipa, salários e metas', d: 'Caixistas, trabalhadores e salários. Meta de vendas do mês com o progresso dia a dia.', more: ['No Início vê quem está a trabalhar agora, quem já fechou o turno e quem ainda não abriu.', 'A meta mostra quanto falta e em que dia chega lá, ao ritmo actual.'] },
      { icon: 'languages', t: 'Português e inglês', d: 'Cada pessoa escolhe a sua língua: painel, terminal, recibos e PDFs.', more: ['A escolha fica guardada na conta de cada pessoa.'] },
    ],
  },

  reports: {
    title: 'Relatórios que respondem às suas perguntas',
    lead: 'Três relatórios, cada um para uma pergunta. Todos saem também em PDF, para guardar ou partilhar.',
    items: [
      { icon: 'sun', t: 'Diário', q: 'Como correu hoje?', points: ['Quanto entrou e o lucro bruto do dia', 'Vendas por caixista e por forma de pagamento', 'Comparação com o dia anterior', 'Cancelamentos, fechos de turno e quebras', 'Produtos que os clientes pediram e não havia'] },
      { icon: 'calendar-range', t: 'Semanal', q: 'Como foi a semana?', points: ['Melhor e pior dia da semana', 'Mais vendido e mais rentável', 'Comparação com a semana anterior', 'O que comprar para a próxima semana'] },
      { icon: 'calendar-check', t: 'Mensal', q: 'Quanto lucrei de verdade?', points: ['Do que entrou ao lucro líquido: menos salários, renda, despesas e entregas', 'Meta do mês e histórico dos últimos 12 meses', 'Perdas por validade e quebras', 'O que comprar para o próximo mês'] },
    ],
  },

  screens: {
    title: 'Veja como é',
    lead: 'Imagens reais do Genesis MZ, numa loja de demonstração.',
    items: [
      { key: 'inicio', cap: 'Início do dono: hoje, a meta e quem está a trabalhar' },
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
      'O painel do dono pede PIN ou Face ID ao abrir e depois de 5 minutos parado.',
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
      { q: 'Preciso de internet para vender?', a: 'Não. Depois de o caixista entrar uma vez com internet nesse aparelho, o terminal abre e vende sem rede e envia as vendas quando a ligação volta. Sem internet, o painel do dono mostra os dados que já tinha aberto, só para consulta.' },
      { q: 'E se alguém pegar no meu telemóvel?', a: 'O painel do dono pede o seu PIN (ou Face ID / impressão digital) sempre que abre a app e depois de 5 minutos sem mexer. Há também o modo privado, que esconde do ecrã os valores em dinheiro.' },
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
      'Painel do dono com PIN, Face ID e modo privado',
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
