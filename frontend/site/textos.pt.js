// Textos do site publico em portugues (Fase 11.3; reescritos na Fase 14 e outra vez
// a 27/10 a pedido do fundador: escritos para o CLIENTE, nao para quem fez o
// sistema — nada de «base de dados», «servidor», «lotes», «auditoria», «sessoes»
// ou «sincronizar»; frases curtas, simples e profissionais). Regra de sempre: so
// o que o Genesis faz e esta verificado (Mapa Mental): nada de relatorios
// automaticos por WhatsApp (desligados), testemunhos, numeros de clientes nem
// "ilimitado".
// {price} = preco do plano formatado; {g} = saudacao (bom dia/boa tarde/boa noite).

export default {
  lang: 'pt',
  htmlLang: 'pt-MZ',
  ogLocale: 'pt_MZ',
  paths: { home: '/', pricing: '/planos' },
  other: { lang: 'en', home: '/en/', pricing: '/en/pricing', label: 'English', short: 'EN' },
  og: '/site/og-pt.png',
  price: (n) => `${n.toLocaleString('pt-PT', { useGrouping: 'always' }).replace(/\s/g, ' ')} MT`,
  perMonth: '/mês',

  meta: {
    home: {
      title: 'Genesis MZ — Sistema de vendas, stock e caixa para negócios em Moçambique',
      description: 'Sistema de vendas e gestão para bottle stores, mercearias, pastelarias, talhos, restaurantes, supermercados e outros negócios em Moçambique. Vende sem internet, controla o stock, as validades, a caixa e o lucro real. 1.º mês grátis.',
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
    eyebrow: 'Feito para os negócios de Moçambique',
    title: 'Vendas, stock e caixa do seu negócio — mesmo sem internet',
    lead: 'Saiba a qualquer hora, no seu telemóvel, quanto vendeu, quanto lucrou e o que está a acabar. Os seus caixistas vendem cada um com o seu PIN, e cada metical fica registado.',
    already: 'Já tem conta?',
    counter: 'No balcão?',
    primary: 'Experimentar grátis',
    secondary: 'Falar no WhatsApp',
    note: '1.º mês grátis para clientes novos · depois {price}/mês, com tudo incluído',
    trust: ['Vende mesmo sem internet', 'Dinheiro, M-Pesa, e-Mola e Cartão', 'Painel protegido com PIN e Face ID', 'No telemóvel, tablet ou computador'],
    shotAlt: 'Terminal de vendas do Genesis MZ com o cesto de um cliente e as formas de pagamento Dinheiro, M-Pesa, e-Mola e Cartão',
    phoneAlt: 'Painel do dono do Genesis MZ no telemóvel, com a receita do dia e do mês',
  },

  pains: {
    title: 'Os problemas de todos os dias, resolvidos',
    lead: 'Num negócio, o prejuízo raramente vem de uma venda. Vem do dinheiro que falta na caixa, do produto que estraga na prateleira e da txeneka que ninguém cobrou.',
    problem: 'O problema',
    solution: 'Com o Genesis',
    items: [
      { icon: 'wallet', q: 'Falta dinheiro na caixa', a: 'No fim do turno, o caixista conta o dinheiro sem saber quanto devia lá estar. O Genesis faz as contas e mostra-lhe logo se falta alguma coisa e em que turno. Se faltar três vezes, o caixista fica parado até o dono decidir.' },
      { icon: 'calendar-clock', q: 'Produtos que passam da validade', a: 'O Genesis avisa antes de o produto vencer e põe à venda primeiro o que vence primeiro. O que estragar fica anotado como perda: sabe quanto perdeu e porquê.' },
      { icon: 'hand-coins', q: 'Txenekas esquecidas', a: 'Cada txeneka fica com o nome, o contacto, o valor e o dia combinado. O Genesis avisa no próprio dia e quando o prazo passa, e cada pagamento fica anotado.' },
      { icon: 'chart-column', q: 'Não saber quanto lucra de verdade', a: 'No fim do mês, o Genesis tira ao que entrou os salários, a renda, as despesas e o que pagou aos fornecedores. Fica a saber quanto sobrou mesmo para si.' },
    ],
  },

  features: {
    title: 'Tudo o que o seu negócio precisa, num só lugar',
    lead: 'Toque em «Ver mais detalhes» para ver tudo o que cada parte faz.',
    more: 'Ver mais detalhes',
    items: [
      { icon: 'scan-barcode', t: 'Vender é rápido', d: 'Procure pelo nome, passe o código de barras ou use a câmara do telemóvel. O troco aparece no ecrã.', more: ['Encontra o produto mesmo escrito sem acentos: «agua» encontra «Água».', 'Funciona com leitor de código de barras, com fio ou sem fio, ou com a câmara do telemóvel.', 'Teclas de atalho para cobrar, dar desconto e escolher a forma de pagamento sem largar o teclado.', 'Cada caixista entra com o seu PIN e nunca usa a conta do dono.', 'No telemóvel, os produtos ocupam o ecrã e o total fica sempre à vista em baixo.'] },
      { icon: 'wifi-off', t: 'A internet caiu? Continue a vender', d: 'O balcão não pára. As vendas ficam guardadas no aparelho e seguem sozinhas quando a rede volta.', more: ['O terminal abre e vende mesmo que a internet já esteja em baixo quando liga o aparelho.', 'Quando a rede volta, cada venda é enviada uma só vez: nada se perde e nada se repete.', 'Sem internet, o seu painel continua a mostrar o que já tinha visto.'] },
      { icon: 'smartphone', t: 'Dinheiro, M-Pesa, e-Mola e Cartão', d: 'Saiba todos os dias quanto entrou por cada forma de pagamento.', more: ['No fecho do turno conta-se só o dinheiro vivo; o M-Pesa, o e-Mola e o cartão aparecem à parte.', 'Os relatórios mostram cada forma de pagamento separada.'] },
      { icon: 'calendar-clock', t: 'Validades sob controlo', d: 'Cada vez que recebe mercadoria, anote a validade. O Genesis vende primeiro o que vence primeiro e avisa a tempo.', more: ['Escolha com quantos dias de antecedência quer ser avisado.', 'O que passar do prazo fica anotado sozinho como perda, no dia seguinte.', 'Garrafas partidas e consumo da casa também ficam anotados, com o motivo.', 'Só o dono corrige o stock, e cada correcção fica registada.'] },
      { icon: 'lock-keyhole', t: 'Nada se faz sem a sua autorização', d: 'Cancelar uma venda, dar um desconto grande ou reabrir o turno só com o seu PIN.', more: ['O dono decide até quanto de desconto o caixista pode dar sozinho.', 'Depois de vários PINs errados, o terminal bloqueia durante 15 minutos.', 'Cada cancelamento, desconto e correcção fica registado com a hora e o nome de quem fez.'] },
      { icon: 'fingerprint-pattern', t: 'Os seus números, só para os seus olhos', d: 'O painel pede o seu PIN, Face ID ou impressão digital sempre que o abre e quando fica 5 minutos parado.', more: ['Se alguém pegar no seu telemóvel, não vê os números do negócio.', 'Depois de 5 PINs errados, só se volta a entrar com o email e a senha.', 'Com gente à volta? Um toque no olho esconde do ecrã todos os valores.'] },
      { icon: 'qr-code', t: 'Recibos que provam que são verdadeiros', d: 'Recibo impresso ou em PDF, com um código QR. O cliente lê o QR e confirma que a compra é verdadeira.', more: ['Com impressora de talões ou em PDF, para enviar ao cliente.', 'Ao ler o QR, o cliente vê a compra confirmada pelo Genesis.'] },
      { icon: 'shopping-cart', t: 'Saiba o que comprar', d: 'O Genesis prepara a lista de compras a partir do que vendeu e envia-a ao fornecedor pelo WhatsApp.', more: ['Junta o que se vendeu, o que está a acabar e o que os clientes pediram e não havia.', 'Mostra quanto vai gastar antes de encomendar.', 'A mensagem para o fornecedor já vai escrita.'] },
      { icon: 'bell', t: 'Avisos que chegam a tempo', d: 'Stock a acabar, produtos a vencer, txenekas por cobrar, dinheiro em falta na caixa e meta do mês atingida.', more: ['Todos os avisos num só lugar.', 'Um toque no aviso leva directamente ao assunto.', 'Quando o problema se resolve, o aviso sai sozinho.'] },
      { icon: 'users', t: 'Equipa, salários e metas', d: 'Os seus caixistas e trabalhadores, os salários e a meta de vendas do mês, dia a dia.', more: ['Veja quem está a trabalhar agora, quem já fechou o turno e quem ainda não começou.', 'A meta mostra quanto falta e em que dia lá chega, ao ritmo de hoje.'] },
      { icon: 'languages', t: 'Português e inglês', d: 'Cada pessoa usa o Genesis na sua língua: painel, terminal e recibos.', more: ['A escolha fica guardada para a próxima vez.'] },
    ],
  },

  reports: {
    title: 'Relatórios que respondem às suas perguntas',
    lead: 'Três relatórios, três perguntas. Todos saem em PDF, para guardar ou enviar.',
    items: [
      { icon: 'sun', t: 'Diário', q: 'Como correu hoje?', points: ['Quanto entrou e quanto ganhou', 'Vendas de cada caixista e de cada forma de pagamento', 'Comparação com ontem', 'Vendas canceladas, fechos de caixa e produtos estragados', 'O que os clientes pediram e não havia'] },
      { icon: 'calendar-range', t: 'Semanal', q: 'Como foi a semana?', points: ['O melhor e o pior dia', 'O que mais vendeu e o que mais lhe deu lucro', 'Comparação com a semana anterior', 'O que comprar para a próxima semana'] },
      { icon: 'calendar-check', t: 'Mensal', q: 'Quanto lucrei de verdade?', points: ['O que sobra depois dos salários, da renda, das despesas e dos fornecedores', 'A meta do mês e a comparação com os últimos 12 meses', 'Quanto perdeu em produtos vencidos ou estragados', 'O que comprar para o próximo mês'] },
    ],
  },

  screens: {
    title: 'Veja como é',
    lead: 'Imagens reais do Genesis MZ, num negócio de demonstração.',
    items: [
      { key: 'inicio', cap: 'O seu dia num relance: o que entrou, a meta e quem está a trabalhar' },
      { key: 'mensal', cap: 'Relatório do mês: do que entrou ao que sobrou' },
      { key: 'alertas', cap: 'Avisos: stock, validades e txenekas' },
    ],
  },

  who: {
    title: 'Para quem empreende em Moçambique',
    lead: 'Escolha o tipo de negócio e o Genesis já traz os produtos mais comuns, com preços sugeridos que pode mudar. Tudo em meticais, com M-Pesa e e-Mola.',
    items: [
      { icon: 'beer', t: 'Bottle store' }, { icon: 'shopping-basket', t: 'Mercearia' }, { icon: 'croissant', t: 'Pastelaria' },
      { icon: 'beef', t: 'Talho' }, { icon: 'utensils', t: 'Restaurante' }, { icon: 'store', t: 'Supermercado' },
    ],
    other: 'O seu negócio não está na lista? Fale connosco.',
  },

  how: {
    title: 'Como começar',
    items: [
      { t: 'Peça a conta', d: 'Um formulário curto: o nome do negócio, o tipo e o seu email.' },
      { t: 'Receba o acesso', d: 'Aprovamos o pedido e enviamos-lhe os dados para entrar. O mês grátis começa aqui.' },
      { t: 'Prepare o negócio', d: 'Cinco passos guiados: produtos e preços, custos, equipa, fornecedores e horário.' },
      { t: 'Ligue o balcão', d: 'No computador ou tablet do balcão, escreva o código que aparece no seu painel e comece a vender.' },
    ],
  },

  security: {
    title: 'O seu negócio, protegido',
    items: [
      'Os números do negócio são só seus: mais ninguém tem acesso a eles.',
      'O painel pede o seu PIN ou Face ID, mesmo que alguém pegue no seu telemóvel.',
      'Os caixistas vendem, mas não veem custos, lucros, relatórios nem as vendas dos colegas.',
      'Cancelamentos, descontos e correcções de stock ficam registados com o nome de quem fez.',
      'Se mudar a senha, quem tinha a antiga perde o acesso na hora.',
    ],
  },

  priceBlock: {
    title: 'Um só plano, com tudo incluído',
    lead: 'Tudo o que viu nesta página, para o seu negócio.',
    free: 'Clientes novos: o 1.º mês é grátis.',
    cta: 'Ver o plano',
  },

  faq: {
    title: 'Perguntas frequentes',
    items: [
      { q: 'Preciso de internet para vender?', a: 'Não. Basta o caixista entrar uma vez com internet nesse aparelho. Depois, vende mesmo sem rede, e as vendas seguem sozinhas quando a internet volta.' },
      { q: 'E se alguém pegar no meu telemóvel?', a: 'O painel pede o seu PIN (ou Face ID / impressão digital) sempre que o abre e depois de 5 minutos parado. E um toque no olho esconde do ecrã todos os valores.' },
      { q: 'Que equipamento preciso?', a: 'Um computador, tablet ou telemóvel com Chrome, Edge ou Safari. O leitor de código de barras e a impressora de talões são opcionais: sem impressora, o recibo sai em PDF.' },
      { q: 'Funciona no telemóvel?', a: 'Sim. O painel e o terminal funcionam no telemóvel e podem ficar no ecrã principal, como uma app.' },
      { q: 'Os caixistas veem o lucro do negócio?', a: 'Não. O caixista só vende, imprime o recibo e anota o que estragou ou o que os clientes pediram. Custos, lucros e relatórios são só do dono.' },
      { q: 'Quanto custa?', a: '{price} por mês, com tudo incluído. Clientes novos não pagam o 1.º mês.' },
      { q: 'Como pago e como cancelo?', a: 'Por agora, combinamos o pagamento e o cancelamento consigo pelo WhatsApp.' },
      { q: 'Posso usar o Genesis em inglês?', a: 'Sim. Cada pessoa escolhe português ou inglês, e a escolha fica guardada.' },
    ],
  },

  final: {
    title: 'Comece hoje, sem pagar o 1.º mês',
    lead: 'Pedir a conta leva um minuto. Se tiver dúvidas, fale connosco no WhatsApp.',
  },

  footer: {
    tagline: 'Vendas, stock e caixa para negócios em Moçambique.',
    product: 'Produto', access: 'Acesso', contact: 'Contacto', request: 'Pedir conta',
    whatsapp: 'WhatsApp',
    rights: '© 2026 Genesis MZ',
  },

  pricing: {
    eyebrow: 'Planos',
    title: 'Um preço simples para o seu negócio',
    lead: 'Um só plano, com tudo incluído. Sem surpresas.',
    planName: 'Genesis MZ',
    planDesc: 'Para um negócio, com o dono, os caixistas e o balcão.',
    free: 'Clientes novos: o 1.º mês é grátis — só começa a pagar no 2.º mês.',
    join: 'Aderir ao plano',
    start: 'Começar o mês grátis',
    included: 'Incluído no plano',
    includedItems: [
      'Terminal de vendas com PIN para cada caixista',
      'Vende sem internet; as vendas seguem quando a rede volta',
      'Dinheiro, M-Pesa, e-Mola e Cartão separados',
      'Stock, validades e avisos a tempo',
      'Fecho de caixa sem o caixista saber quanto devia ter',
      'Painel protegido com PIN e Face ID, e valores escondidos com um toque',
      'Txenekas, fornecedores e lista de compras',
      'Relatórios do dia, da semana e do mês, com o lucro real',
      'Recibos impressos ou em PDF, com QR',
      'Equipa, salários e metas',
      'Português e inglês',
    ],
    annualTitle: 'Prefere pagar o ano inteiro?',
    annualText: 'Fale connosco sobre o plano anual.',
    annualCta: 'Perguntar pelo plano anual',
    payTitle: 'Como aderir e pagar',
    paySteps: [
      { t: 'Toque em «Aderir ao plano»', d: 'Abre uma conversa connosco no WhatsApp, já com a mensagem escrita.' },
      { t: 'Combinamos o pagamento', d: 'Dizemos-lhe como pagar e o valor certo.' },
      { t: 'Envie o comprovativo', d: 'Depois de pagar, envie-nos o comprovativo e o email da sua conta.' },
    ],
    paidCta: 'Já paguei — enviar comprovativo',
    mobileTitle: 'Carteira móvel',
    bankTitle: 'Depósito ou transferência bancária',
    account: 'Conta', nib: 'NIB', holder: 'Titular',
    faqTitle: 'Perguntas sobre o plano',
    faq: [
      { q: 'Quando começo a pagar?', a: 'O mês grátis começa quando a sua conta é aprovada. Só paga a partir do 2.º mês.' },
      { q: 'O que acontece se o mês grátis acabar sem pagamento?', a: 'Não perde nada. Continua a ver o histórico e os relatórios, mas não regista vendas novas até a subscrição ser paga.' },
      { q: 'O mês grátis é para todos?', a: 'É só para clientes novos.' },
      { q: 'Como pago e como cancelo?', a: 'Por agora, combinamos tudo pelo WhatsApp: a forma de pagamento, o comprovativo e o cancelamento.' },
    ],
  },
};
