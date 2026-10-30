// Paginas legais do site (pedido do fundador 30/10/2026): Politica de
// privacidade e Termos e condicoes, PT e EN. So factos verdadeiros sobre o que
// o Genesis faz hoje (onde ficam os dados, que cookies, quem ve o que).
// {wa} = numero do WhatsApp (config.js). Mudar LEGAL_UPDATED quando o texto mudar
// (e TERMS_VERSION em backend/src/routes/auth.js, que guarda a versao aceite).
export const LEGAL_UPDATED = '2026-10-30';

export const LEGAL = {
  pt: {
    privacy: {
      path: '/privacidade',
      title: 'Política de privacidade',
      metaTitle: 'Política de privacidade | Genesis MZ',
      description: 'Que dados o Genesis MZ guarda, para quê, onde ficam e como os pode ver, corrigir ou apagar.',
      updated: 'Actualizada a 30 de Outubro de 2026.',
      sections: [
        { h: 'Quem somos', p: ['O Genesis MZ é um sistema de vendas, stock e caixa para negócios em Moçambique. Para qualquer assunto sobre os seus dados, fale connosco pelo WhatsApp {wa}.'] },
        { h: 'Que dados guardamos', list: [
          'Do dono da conta: nome, email, telefone (WhatsApp), nome, tipo e localização do negócio e, se os indicar, o NUIT, o número do BI ou passaporte, a data de nascimento e o logotipo.',
          'Da equipa, criada pelo dono: o nome de cada caixista e trabalhador, o salário quando o dono o regista, e o PIN, que guardamos cifrado e nunca em texto.',
          'Do negócio: produtos, preços, stock, vendas, recibos, fornecedores, despesas e txenekas (o nome e o telefone de quem deve, quando o dono os escreve).',
          'Registo de segurança: quem fez cada acção importante, a hora e o endereço IP (por exemplo, uma venda cancelada ou um PIN errado).',
          'Lista «Avise-me»: o nome, o telefone e o email de quem pede para ser avisado.',
        ] },
        { h: 'Para que usamos os dados', list: [
          'Para o Genesis funcionar: vender, guardar o stock, fechar o turno e mostrar os relatórios ao dono.',
          'Para proteger o negócio: detectar PINs errados, recibos reimpressos e acessos estranhos.',
          'Para enviar ao dono o que ele pedir: relatórios e avisos por WhatsApp ou email.',
          'Para tratar da subscrição e responder a pedidos de ajuda.',
        ], after: ['Não vendemos dados a ninguém e não os usamos para publicidade.'] },
        { h: 'Quem vê os dados', p: [
          'Cada negócio só vê os seus próprios dados. Esta separação é feita duas vezes, de forma independente, para que um erro numa não chegue para mostrar dados de outro negócio.',
          'Os caixistas só vêem o que precisam para vender: não vêem lucros, custos nem as vendas dos colegas.',
          'A equipa Genesis só entra num negócio quando o dono pede ajuda, em modo de só leitura, e essa entrada fica registada e visível para o dono.',
        ] },
        { h: 'Onde ficam os dados', p: [
          'Os dados ficam em servidores na União Europeia (Frankfurt, Alemanha), dos fornecedores Supabase e DigitalOcean. Tudo o que viaja entre o seu aparelho e o Genesis vai cifrado (HTTPS).',
          'Usamos outros serviços só para o que cada um faz: a Google, se escolher entrar com a conta Google; o WhatsApp (através da Twilio), quando os relatórios por WhatsApp estiverem ligados; e um serviço de email para os códigos de recuperação.',
        ] },
        { h: 'No seu aparelho', p: [
          'Para vender sem internet, o terminal guarda no próprio aparelho o catálogo, as vendas ainda por enviar e uma verificação dos PINs (nunca o PIN). Usamos apenas os cookies necessários para manter a sessão aberta e reconhecer o terminal. Não usamos cookies de publicidade nem de estatísticas de visitas.',
        ] },
        { h: 'Quanto tempo guardamos', p: [
          'Enquanto a conta existir. O registo de actividade guarda-se pelo tempo que o dono escolher nas Definições (no mínimo 2 meses). Se fechar a conta, pode pedir que apaguemos os dados; apagamos tudo o que a lei não nos obrigue a guardar.',
        ] },
        { h: 'Os seus direitos', p: [
          'Pode pedir para ver, corrigir, levar consigo ou apagar os seus dados. Muitos pode corrigir sozinho no Perfil e nas Definições; para o resto, fale connosco pelo WhatsApp {wa}.',
        ] },
        { h: 'Menores de idade', p: [
          'O Genesis é para maiores de 18 anos. Quem pede uma conta confirma que tem 18 anos ou mais. Se soubermos que uma conta foi criada por um menor, encerramo-la.',
        ] },
        { h: 'Lei aplicável', p: [
          'Tratamos os dados de acordo com a Constituição da República de Moçambique, que protege os dados pessoais, e com a Lei n.º 3/2017, de 9 de Janeiro (Lei de Transacções Electrónicas).',
        ] },
        { h: 'Alterações', p: ['Se esta política mudar, actualizamos a data no topo e avisamos os donos das contas activas.'] },
      ],
    },
    terms: {
      path: '/termos',
      title: 'Termos e condições',
      metaTitle: 'Termos e condições | Genesis MZ',
      description: 'As regras de utilização do Genesis MZ: quem pode usar, subscrição, responsabilidades e lei aplicável.',
      updated: 'Actualizados a 30 de Outubro de 2026.',
      sections: [
        { h: 'Aceitação', p: ['Ao pedir uma conta ou usar o Genesis MZ, aceita estes termos e a Política de privacidade. Se não concordar, não use o Genesis.'] },
        { h: 'Quem pode usar', p: [
          'O dono da conta tem de ter 18 anos ou mais e capacidade para contratar, em nome próprio ou em nome do negócio que representa. As pessoas da equipa (caixistas e outros) usam o Genesis sob a responsabilidade do dono.',
        ] },
        { h: 'O serviço', p: [
          'O Genesis permite vender, controlar o stock e a caixa, e ver relatórios do negócio, no computador, tablet ou telemóvel.',
          'Sem internet, o terminal continua a vender e guarda as vendas no próprio aparelho até haver ligação. Se o aparelho se perder, avariar ou for limpo antes de a ligação voltar, essas vendas podem perder-se. Recomendamos ligar o terminal à internet sempre que possível.',
        ] },
        { h: 'Conta e segurança', p: [
          'O dono é responsável pela sua senha, pelo PIN de autorização e pelos PINs que cria para a equipa. Não os partilhe. Se suspeitar de um acesso indevido, mude a senha e fale connosco.',
        ] },
        { h: 'Teste grátis e subscrição', p: [
          'Os clientes novos têm o primeiro mês grátis. Depois, a subscrição paga-se por mês (ou por ano, se for combinado), pelo preço indicado na página de Planos no momento da adesão.',
          'Se a subscrição não for paga, a conta passa a só leitura: continua a ver o histórico e os relatórios, mas não regista vendas novas até ao pagamento.',
          'Se o preço de uma conta activa mudar, avisamos antes.',
        ] },
        { h: 'Os seus dados', p: [
          'Os dados do negócio são do dono. Usamo-los apenas para prestar o serviço, como explicado na Política de privacidade.',
        ] },
        { h: 'Utilização proibida', list: [
          'Usar o Genesis para actividades ilegais.',
          'Tentar ver dados de outros negócios ou contornar a segurança do sistema.',
          'Revender ou alugar o acesso ao Genesis sem acordo escrito connosco.',
        ] },
        { h: 'Impostos e documentos', p: [
          'O Genesis ajuda a calcular valores como o IVA e o ISPC, mas o dono continua responsável pelas suas obrigações fiscais e pelas declarações que entrega.',
        ] },
        { h: 'Disponibilidade e responsabilidade', p: [
          'Fazemos o possível para que o Genesis esteja sempre disponível, mas pode haver paragens para manutenção ou por falhas de terceiros (internet, energia, fornecedores). Na medida em que a lei o permite, não respondemos por perdas indirectas, como lucros que se deixaram de ganhar.',
        ] },
        { h: 'Fim da conta', p: [
          'Pode deixar de usar o Genesis quando quiser. Podemos suspender uma conta por falta de pagamento ou por utilização proibida, avisando o dono sempre que possível.',
        ] },
        { h: 'Lei aplicável', p: ['Estes termos regem-se pela lei da República de Moçambique.'] },
        { h: 'Contacto', p: ['WhatsApp {wa}.'] },
      ],
    },
  },
  en: {
    privacy: {
      path: '/en/privacy',
      title: 'Privacy policy',
      metaTitle: 'Privacy policy | Genesis MZ',
      description: 'What data Genesis MZ keeps, what for, where it is stored and how you can see, correct or delete it.',
      updated: 'Updated on 30 October 2026.',
      sections: [
        { h: 'Who we are', p: ['Genesis MZ is a sales, stock and cash system for businesses in Mozambique. For anything about your data, contact us on WhatsApp {wa}.'] },
        { h: 'What data we keep', list: [
          'About the account owner: name, email, phone (WhatsApp), the business name, type and location and, if provided, the NUIT, ID or passport number, date of birth and logo.',
          'About the team, created by the owner: the name of each cashier and worker, the salary when the owner records it, and the PIN, which we store encrypted and never as text.',
          'About the business: products, prices, stock, sales, receipts, suppliers, expenses and debts (the name and phone of who owes, when the owner writes them).',
          'Security log: who did each important action, when, and the IP address (for example, a cancelled sale or a wrong PIN).',
          '«Notify me» list: the name, phone and email of whoever asks to be notified.',
        ] },
        { h: 'What we use the data for', list: [
          'To run Genesis: selling, keeping stock, closing shifts and showing the owner the reports.',
          'To protect the business: detecting wrong PINs, reprinted receipts and unusual access.',
          'To send the owner what they ask for: reports and alerts by WhatsApp or email.',
          'To handle the subscription and answer requests for help.',
        ], after: ['We do not sell data to anyone and we do not use it for advertising.'] },
        { h: 'Who sees the data', p: [
          'Each business only sees its own data. This separation is done twice, independently, so that a mistake in one is not enough to show another business’s data.',
          'Cashiers only see what they need to sell: no profits, no costs and no colleagues’ sales.',
          'The Genesis team only enters a business when the owner asks for help, read-only, and that access is logged and visible to the owner.',
        ] },
        { h: 'Where the data is stored', p: [
          'The data is stored on servers in the European Union (Frankfurt, Germany), from the providers Supabase and DigitalOcean. Everything that travels between your device and Genesis is encrypted (HTTPS).',
          'We use other services only for what each one does: Google, if you choose to sign in with Google; WhatsApp (through Twilio), when WhatsApp reports are switched on; and an email service for recovery codes.',
        ] },
        { h: 'On your device', p: [
          'To sell without internet, the terminal keeps on the device itself the catalogue, the sales not sent yet and a check of the PINs (never the PIN). We only use the cookies needed to keep you signed in and recognise the terminal. We do not use advertising or visitor statistics cookies.',
        ] },
        { h: 'How long we keep it', p: [
          'For as long as the account exists. The activity log is kept for the time the owner chooses in Settings (at least 2 months). If you close the account, you can ask us to delete the data; we delete everything the law does not require us to keep.',
        ] },
        { h: 'Your rights', p: [
          'You can ask to see, correct, take away or delete your data. You can correct much of it yourself in Profile and Settings; for the rest, contact us on WhatsApp {wa}.',
        ] },
        { h: 'Minors', p: [
          'Genesis is for people aged 18 or older. Whoever requests an account confirms they are 18 or older. If we learn that an account was created by a minor, we close it.',
        ] },
        { h: 'Applicable law', p: [
          'We handle data in line with the Constitution of the Republic of Mozambique, which protects personal data, and Law no. 3/2017 of 9 January (Electronic Transactions Law).',
        ] },
        { h: 'Changes', p: ['If this policy changes, we update the date at the top and tell the owners of active accounts.'] },
      ],
    },
    terms: {
      path: '/en/terms',
      title: 'Terms and conditions',
      metaTitle: 'Terms and conditions | Genesis MZ',
      description: 'The rules for using Genesis MZ: who can use it, subscription, responsibilities and applicable law.',
      updated: 'Updated on 30 October 2026.',
      sections: [
        { h: 'Acceptance', p: ['By requesting an account or using Genesis MZ, you accept these terms and the Privacy policy. If you do not agree, do not use Genesis.'] },
        { h: 'Who can use it', p: [
          'The account owner must be 18 or older and able to enter into contracts, in their own name or on behalf of the business they represent. Team members (cashiers and others) use Genesis under the owner’s responsibility.',
        ] },
        { h: 'The service', p: [
          'Genesis lets you sell, control stock and cash, and see business reports, on a computer, tablet or phone.',
          'Without internet, the terminal keeps selling and stores the sales on the device until there is a connection. If the device is lost, breaks or is wiped before the connection returns, those sales may be lost. We recommend connecting the terminal to the internet whenever possible.',
        ] },
        { h: 'Account and security', p: [
          'The owner is responsible for their password, the authorisation PIN and the PINs they create for the team. Do not share them. If you suspect improper access, change your password and contact us.',
        ] },
        { h: 'Free trial and subscription', p: [
          'New customers get the first month free. After that, the subscription is paid monthly (or yearly, if agreed), at the price shown on the Pricing page when you join.',
          'If the subscription is not paid, the account becomes read-only: you still see the history and reports, but you cannot record new sales until payment.',
          'If the price of an active account changes, we tell you beforehand.',
        ] },
        { h: 'Your data', p: [
          'The business data belongs to the owner. We only use it to provide the service, as explained in the Privacy policy.',
        ] },
        { h: 'Prohibited use', list: [
          'Using Genesis for illegal activities.',
          'Trying to see other businesses’ data or getting around the system’s security.',
          'Reselling or renting access to Genesis without a written agreement with us.',
        ] },
        { h: 'Taxes and documents', p: [
          'Genesis helps calculate amounts such as VAT and ISPC, but the owner remains responsible for their tax obligations and the returns they file.',
        ] },
        { h: 'Availability and liability', p: [
          'We do our best to keep Genesis always available, but there may be stops for maintenance or because of third-party failures (internet, power, providers). As far as the law allows, we are not liable for indirect losses, such as lost profits.',
        ] },
        { h: 'Ending the account', p: [
          'You can stop using Genesis whenever you want. We may suspend an account for non-payment or prohibited use, telling the owner whenever possible.',
        ] },
        { h: 'Applicable law', p: ['These terms are governed by the law of the Republic of Mozambique.'] },
        { h: 'Contact', p: ['WhatsApp {wa}.'] },
      ],
    },
  },
};
