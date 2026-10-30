// Public site texts in English (Fase 11.3; rewritten on 27/10 at the founder's
// request, like textos.pt.js: written for the CUSTOMER — no "database", "server",
// "batches", "audit log", "sessions" or "sync"; short, plain, professional).
// Same rule: only what Genesis does and has been verified.

export default {
  lang: 'en',
  htmlLang: 'en',
  ogLocale: 'en_US',
  paths: { home: '/en/', pricing: '/en/pricing' },
  other: { lang: 'pt', home: '/', pricing: '/planos', label: 'Português', short: 'PT' },
  og: '/site/og-en.png',
  price: (n) => `${n.toLocaleString('en-US')} MT`,
  perMonth: '/month',

  meta: {
    home: {
      title: 'Genesis MZ | Point of sale, stock and cash control for businesses in Mozambique',
      description: 'Sales and management system for bottle stores, grocery shops, pastry shops, butcheries, restaurants, supermarkets and other businesses in Mozambique. Sells without internet, keeps track of stock, expiry dates, the till and real profit. First month free.',
    },
    pricing: {
      title: 'Pricing | Genesis MZ',
      description: 'Genesis MZ costs {price} per month, everything included. New customers do not pay the first month. Join on WhatsApp.',
    },
  },

  nav: {
    features: 'Features', who: 'Who it is for', how: 'Getting started', pricing: 'Pricing', faq: 'FAQ',
    signIn: 'Sign in', terminal: 'Terminal', start: 'Try it free', menu: 'Open the menu', home: 'Home',
    signInLong: 'Sign in to the panel', terminalLong: 'Open the terminal',
  },

  wa: {
    greet: ['Good morning', 'Good afternoon', 'Good evening'],
    fallback: 'Hello',
    contact: '{g}! I would like to know more about Genesis MZ.',
    join: '{g}! I would like to join the Genesis MZ plan ({price}/month).',
    annual: '{g}! I am interested in the Genesis MZ annual plan. Could you tell me more?',
    premium: '{g}! I would like to know more about the Genesis MZ Premium plan.',
    paid: '{g}! I have paid the Genesis MZ subscription and will send the receipt. My account email is: ',
  },

  hero: {
    eyebrow: 'Made for businesses in Mozambique',
    title: 'Sales, stock and cash for your business,|even without internet',
    lead: 'Know at any time, on your phone, how much you sold, how much you made and what is running out. Your cashiers sell with their own PIN, and every metical is recorded.',
    already: 'Already have an account?',
    counter: 'At the counter?',
    primary: 'Try it free',
    secondary: 'Chat on WhatsApp',
    note: 'First month free for new customers · then {price}/month, everything included',
    trust: ['Sells even without internet', 'Cash, M-Pesa, e-Mola and Card', 'Panel protected with PIN and Face ID', 'On a phone, tablet or computer'],
    shotAlt: 'Genesis MZ sales terminal with a customer basket and the Cash, M-Pesa, e-Mola and Card payment options',
    phoneAlt: 'Genesis MZ owner panel on a phone, with today\'s and this month\'s revenue',
  },

  pains: {
    title: 'Everyday problems, solved',
    lead: 'In a business, losses rarely come from a sale. They come from cash missing from the till, products spoiling on the shelf and the credit nobody collected.',
    problem: 'The problem',
    solution: 'With Genesis',
    items: [
      { icon: 'wallet', q: 'Cash goes missing from the till', a: 'To close the shift, the cashier has to count the cash in the drawer and type how much they counted, without knowing how much Genesis expects. If they type less than they sold in cash, Genesis refuses it; on the third time, their profile is locked until the owner unlocks it.',
        more: [
          'Only cash counts (notes and coins). What was paid by M-Pesa, e-Mola or card is not part of the count: Genesis already knows those amounts.',
          'Example: today the cashier sold 17,000 MT in cash. Genesis knows it, because every sale was recorded. When closing the shift, they must type 17,000 MT or more (there may be tips).',
          'If they type 16,000 MT, Genesis refuses and tells them they have 2 attempts left, without saying how much it should be. If they type less again (16,900 MT, for example), 1 is left. On the third, their profile is locked and only the owner can unlock it.',
          'Each wrong attempt is recorded with the amount they typed and what Genesis expected, and the owner sees it as soon as they open Genesis.',
          'If they closed the shift saying they counted 17,000 MT and at the end of the day hand you 16,000 MT, the conversation is simple: “You closed the shift saying you counted 17,000 MT. Where is the rest?”',
        ] },
      { icon: 'calendar-clock', q: 'Products that go past their expiry date', a: 'Genesis warns you before a product expires and puts on sale first what expires first. Whatever spoils is noted as a loss: you know how much you lost and why.' },
      { icon: 'hand-coins', q: 'Forgotten customer credit', a: 'Every credit ("txeneka") keeps the name, contact, amount and agreed day. Genesis reminds you on the day and when it is overdue, and every payment is noted.' },
      { icon: 'chart-column', q: 'Not knowing your real profit', a: 'At the end of the month, Genesis takes salaries, rent, expenses and what you paid suppliers away from what came in. You know how much is really left for you.' },
    ],
  },

  features: {
    title: 'Everything your business needs, in one place',
    lead: 'Tap «See more details» to see everything each part does.',
    more: 'See more details',
    items: [
      { icon: 'scan-barcode', t: 'Selling is fast', d: 'Search by name, scan the barcode or use the phone camera. The change shows on screen.', more: ['Finds the product even when typed without accents.', 'Works with a barcode scanner, wired or wireless, or with the phone camera.', 'Keyboard shortcuts to charge, give a discount and pick the payment method without leaving the keyboard.', 'Each cashier signs in with their own PIN and never uses the owner\'s account.', 'On a phone, the products fill the screen and the total is always visible at the bottom.'] },
      { icon: 'wifi-off', t: 'Internet down? Keep selling', d: 'The counter never stops. Sales are kept on the device and go through on their own when the network is back.', more: ['The terminal opens and sells even if the internet is already down when you switch the device on.', 'When the network is back, each sale is sent once: nothing is lost and nothing is repeated.', 'Without internet, your panel still shows what you had already seen.'] },
      { icon: 'smartphone', t: 'Cash, M-Pesa, e-Mola and Card', d: 'Know every day how much came in through each payment method.', more: ['At the shift close only cash is counted; M-Pesa, e-Mola and card are shown apart.', 'The reports show each payment method separately.'] },
      { icon: 'calendar-clock', t: 'Expiry dates under control', d: 'Each time goods come in, note the expiry date. Genesis sells first what expires first and warns you in time.', more: ['Choose how many days in advance you want to be warned.', 'Whatever passes its date is noted as a loss on its own, the next day.', 'Broken bottles and in-house use are noted too, with the reason.', 'Only the owner corrects the stock, and every correction is recorded.'] },
      { icon: 'lock-keyhole', t: 'Nothing happens without your approval', d: 'Cancelling a sale, giving a big discount or reopening the shift only with your PIN.', more: ['The owner decides how much discount the cashier can give alone.', 'After several wrong PINs, the terminal locks for 15 minutes.', 'Every cancellation, discount and correction is recorded with the time and the name of who did it.'] },
      { icon: 'fingerprint-pattern', t: 'Your figures, for your eyes only', d: 'The panel asks for your PIN, Face ID or fingerprint every time you open it and after 5 minutes idle.', more: ['If someone picks up your phone, they do not see the business figures.', 'After 5 wrong PINs, you can only get back in with your email and password.', 'People around? One tap on the eye hides every amount from the screen.'] },
      { icon: 'qr-code', t: 'Receipts that prove they are genuine', d: 'Printed or PDF receipts, with a QR code. The customer scans it and confirms the purchase is genuine.', more: ['With a receipt printer or as a PDF, to send to the customer.', 'When scanning the QR, the customer sees the purchase confirmed by Genesis.', 'Guard at the exit: scans the receipt on a phone or tablet and marks it «checked». If someone shows the same receipt again, the screen turns red and says when and by whom it was already checked.', 'Every reprinted receipt is marked «copy» and recorded for the owner.'] },
      { icon: 'shopping-cart', t: 'Know what to buy', d: 'Genesis prepares the shopping list from what you sold and sends it to the supplier on WhatsApp.', more: ['It puts together what was sold, what is running out and what customers asked for and was not there.', 'It shows how much you will spend before you order.', 'The message to the supplier is already written.'] },
      { icon: 'bell', t: 'Warnings that arrive in time', d: 'Stock running out, products about to expire, credit to collect, cash missing from the till and the monthly goal reached.', more: ['All warnings in one place.', 'One tap on a warning takes you straight to it.', 'When the problem is solved, the warning goes away on its own.'] },
      { icon: 'users', t: 'Team, salaries and goals', d: 'Your cashiers and workers, the salaries and the monthly sales goal, day by day.', more: ['See who is working now, who has closed the shift and who has not started yet.', 'The goal shows how much is left and on which day you get there at today\'s pace.'] },
      { icon: 'languages', t: 'Portuguese and English', d: 'Each person uses Genesis in their own language: panel, terminal and receipts.', more: ['The choice is kept for next time.'] },
    ],
  },

  reports: {
    title: 'Reports that answer your questions',
    lead: 'Three reports, three questions. All of them come as a PDF, to keep or send.',
    items: [
      { icon: 'sun', t: 'Daily', q: 'How did today go?', points: ['How much came in and how much you made', 'Sales by cashier and by payment method', 'Comparison with yesterday', 'Cancelled sales, till closes and spoiled products', 'What customers asked for that you did not have'] },
      { icon: 'calendar-range', t: 'Weekly', q: 'How was the week?', points: ['The best and the worst day', 'What sold the most and what made you the most profit', 'Comparison with the previous week', 'What to buy for next week'] },
      { icon: 'calendar-check', t: 'Monthly', q: 'How much did I really make?', points: ['What is left after salaries, rent, expenses and suppliers', 'The monthly goal and a comparison with the last 12 months', 'How much you lost in expired or spoiled products', 'What to buy for next month'] },
    ],
  },

  screens: {
    title: 'See what it looks like',
    lead: 'Real Genesis MZ screens, in a demo business.',
    items: [
      { key: 'inicio', cap: 'Your day at a glance: what came in, the goal and who is working' },
      { key: 'mensal', cap: 'Monthly report: from what came in to what is left' },
      { key: 'alertas', cap: 'Warnings: stock, expiry dates and customer credit' },
    ],
  },

  who: {
    title: 'For entrepreneurs in Mozambique',
    lead: 'Choose your type of business and Genesis already brings the most common products, with suggested prices you can change. All in meticais, with M-Pesa and e-Mola.',
    items: [
      { icon: 'beer', t: 'Bottle store' }, { icon: 'wine', t: 'Drinks shop' }, { icon: 'shopping-basket', t: 'Grocery shop' },
      { icon: 'store', t: 'Supermarket' }, { icon: 'wheat', t: 'Bakery' }, { icon: 'cake-slice', t: 'Pastry shop' },
      { icon: 'coffee', t: 'Coffee shop' }, { icon: 'beef', t: 'Butchery' }, { icon: 'flame', t: 'Grill house' },
      { icon: 'shirt', t: 'Boutique' },
    ],
    other: 'Your business is not on the list? Talk to us.',
    soon: {
      title: 'Coming soon',
      lead: 'We are preparing Genesis for these businesses with the care they deserve. Leave your contact and we will let you know as soon as it is ready.',
      items: [
        { icon: 'utensils', t: 'Restaurant', type: 'restaurante' }, { icon: 'hamburger', t: 'Fast food', type: 'fast_food' },
        { icon: 'pill', t: 'Pharmacy', type: 'farmacia' }, { icon: 'stethoscope', t: 'Clinic', type: 'clinica' },
        { icon: 'bed-double', t: 'Hotel and lodging', type: 'hotelaria' }, { icon: 'scissors', t: 'Hair and beauty salon', type: 'salao' },
        { icon: 'fuel', t: 'Fuel station', type: 'posto_combustivel' }, { icon: 'building', t: 'Property rental', type: 'arrendamento' },
        { icon: 'briefcase', t: 'Self-employed seller', type: 'nhonguista' }, { icon: 'ship', t: 'Importer', type: 'importador' },
      ],
      cta: 'Let me know when it is ready',
    },
  },

  how: {
    title: 'Getting started',
    items: [
      { t: 'Request an account', d: 'A short form: the business name, the type and your email.' },
      { t: 'Get your access', d: 'We approve the request and send you the sign-in details. The free month starts here.' },
      { t: 'Set up your business', d: 'Five guided steps: products and prices, costs, team, suppliers and opening hours.' },
      { t: 'Connect the counter', d: 'On the counter computer or tablet, type the code shown in your panel and start selling.' },
    ],
  },

  security: {
    title: 'Your business, protected',
    items: [
      'Your business figures are yours alone: nobody else has access to them.',
      'The panel asks for your PIN or Face ID, even if someone picks up your phone.',
      'Cashiers sell, but do not see costs, profits, reports or their colleagues\' sales.',
      'Cancellations, discounts and stock corrections are recorded with the name of who did them.',
      'If you change the password, whoever had the old one loses access at once.',
    ],
  },

  priceBlock: {
    title: 'One plan, everything included',
    lead: 'Everything you saw on this page, for your business.',
    free: 'New customers: the first month is free.',
    cta: 'See the plan',
  },

  faq: {
    title: 'Frequently asked questions',
    items: [
      { q: 'Do I need internet to sell?', a: 'No. The cashier just needs to sign in once with internet on that device. After that, they sell even without a network, and the sales go through on their own when the internet is back.' },
      { q: 'What if someone picks up my phone?', a: 'The panel asks for your PIN (or Face ID / fingerprint) every time you open it and after 5 minutes idle. And one tap on the eye hides every amount from the screen.' },
      { q: 'What equipment do I need?', a: 'A computer, tablet or phone with Chrome, Edge or Safari. A barcode scanner and a receipt printer are optional: without a printer, the receipt is a PDF.' },
      { q: 'Does it work on a phone?', a: 'Yes. The panel and the terminal work on a phone and can sit on the home screen, like an app.' },
      { q: 'Can cashiers see the business profit?', a: 'No. Cashiers only sell, print the receipt and note what spoiled or what customers asked for. Costs, profits and reports are for the owner only.' },
      { q: 'How much does it cost?', a: '{price} per month, everything included. New customers do not pay the first month.' },
      { q: 'How do I pay and how do I cancel?', a: 'For now, we arrange payment and cancellation with you on WhatsApp.' },
      { q: 'Can I use Genesis in English?', a: 'Yes. Each person chooses Portuguese or English, and the choice is kept.' },
    ],
  },

  final: {
    title: 'Start today, with the first month free',
    lead: 'Requesting an account takes a minute. Questions? Talk to us on WhatsApp.',
  },

  footer: {
    tagline: 'Sales, stock and cash for businesses in Mozambique.',
    product: 'Product', access: 'Access', contact: 'Contact', request: 'Request an account',
    whatsapp: 'WhatsApp',
    rights: '© 2026 Genesis MZ',
  },

  pricing: {
    eyebrow: 'Pricing',
    title: 'Simple pricing for your business',
    lead: 'One plan, everything included. No surprises.',
    planName: 'Genesis MZ',
    planDesc: 'For one business, with the owner, the cashiers and the counter.',
    free: 'New customers: the first month is free. You only start paying in the second month.',
    join: 'Join the plan',
    start: 'Start the free month',
    included: 'Included in the plan',
    includedItems: [
      'Sales terminal with a PIN for each cashier',
      'Sells without internet; sales go through when the network is back',
      'Cash, M-Pesa, e-Mola and Card kept separate',
      'Stock, expiry dates and warnings in time',
      'Till close without the cashier knowing how much should be there',
      'Panel protected with PIN and Face ID, and amounts hidden with one tap',
      'Customer credit, suppliers and shopping list',
      'Daily, weekly and monthly reports, with your real profit',
      'Printed or PDF receipts, with QR',
      'Team, salaries and goals',
      'Portuguese and English',
    ],
    annualTitle: 'Prefer to pay for the whole year?',
    annualText: 'Talk to us about the annual plan.',
    annualCta: 'Ask about the annual plan',
    premiumName: 'Premium',
    premiumJoin: 'Talk to us about Premium',
    payTitle: 'How to join and pay',
    paySteps: [
      { t: 'Tap «Join the plan»', d: 'It opens a WhatsApp chat with us, with the message already written.' },
      { t: 'We arrange the payment', d: 'We tell you how to pay and the exact amount.' },
      { t: 'Send the receipt', d: 'After paying, send us the receipt and your account email.' },
    ],
    paidCta: 'I have paid: send the receipt',
    mobileTitle: 'Mobile wallet',
    bankTitle: 'Bank deposit or transfer',
    account: 'Account', nib: 'NIB', holder: 'Holder',
    faqTitle: 'Questions about the plan',
    faq: [
      { q: 'When do I start paying?', a: 'The free month starts when your account is approved. You only pay from the second month.' },
      { q: 'What happens if the free month ends without payment?', a: 'You lose nothing. You still see the history and the reports, but no new sales are recorded until the subscription is paid.' },
      { q: 'Is the free month for everyone?', a: 'It is for new customers only.' },
      { q: 'How do I pay and how do I cancel?', a: 'For now, we arrange everything on WhatsApp: the payment method, the receipt and the cancellation.' },
    ],
  },
};
