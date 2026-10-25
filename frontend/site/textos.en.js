// Public site texts in English (Fase 11.3). Same structure and the same rule as
// textos.pt.js: only what Genesis does and has been verified.

export default {
  lang: 'en',
  htmlLang: 'en',
  ogLocale: 'en_US',
  paths: { home: '/en/', pricing: '/en/pricing' },
  other: { lang: 'pt', home: '/', pricing: '/planos', label: 'Português', short: 'PT' },
  og: '/site/og-en.png',
  price: (n) => `${n.toLocaleString('en-US')} MT`,
  perMonth: '/month',

  meta: {
    home: {
      title: 'Genesis MZ — Point of sale, stock and cash control for shops in Mozambique',
      description: 'Point of sale for bottle stores, grocery shops, bakeries, butcheries, restaurants and supermarkets in Mozambique. Sells offline, tracks stock and expiry dates, blind cash count and real profit. First month free.',
    },
    pricing: {
      title: 'Pricing — Genesis MZ',
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
    paid: '{g}! I have paid the Genesis MZ subscription and will send the receipt. My account email is: ',
  },

  hero: {
    eyebrow: 'Point of sale for shops in Mozambique',
    title: 'Sales, stock and cash for your shop — even without internet',
    lead: 'Cashiers sell at the terminal with their own PIN. The owner sees on the phone what came in, the real profit, the stock, the expiry dates and customer credit — and nobody touches the money without it being recorded.',
    already: 'Already have an account?',
    counter: 'At the counter?',
    primary: 'Try it free',
    secondary: 'Chat on WhatsApp',
    note: 'First month free for new customers · then {price}/month, everything included',
    trust: ['Sells offline', 'Cash, M-Pesa, e-Mola and Card', 'Panel with PIN and Face ID', 'Phone, tablet and computer'],
    shotAlt: 'Genesis MZ sales terminal with a customer basket and the Cash, M-Pesa, e-Mola and Card payment options',
    phoneAlt: 'Genesis MZ owner panel on a phone, with today\'s and this month\'s revenue',
  },

  pains: {
    title: 'What Genesis solves in your shop',
    lead: 'What costs a small shop the most is rarely a sale. It is the missing cash, the stock that expires and the credit nobody collected. Genesis has an answer for each one.',
    problem: 'The problem',
    solution: 'How Genesis solves it',
    items: [
      { icon: 'wallet', q: 'Cash goes missing from the till', a: 'At the end of the shift the cashier counts the cash without seeing how much there should be (blind count). Genesis compares it with the sales and shows the owner the difference. Three counts below lock the profile until the owner decides.' },
      { icon: 'calendar-clock', q: 'Products that spoil or pass their expiry date', a: 'Genesis tracks expiry dates: every purchase comes in as a batch with its own date, the batch that expires first is always sold first, the alert arrives before it expires and whatever passes the date is recorded as a loss, with the reason.' },
      { icon: 'hand-coins', q: 'Forgotten customer credit', a: 'Every credit ("cheneca") keeps the name, phone, amount and due date. Genesis warns about the ones due today, tomorrow or already overdue, and records every payment.' },
      { icon: 'chart-column', q: 'Not knowing your real profit', a: 'The monthly report takes salaries, rent, expenses and supplier deliveries away from what came in. You see the real net profit, not just the cash in the till.' },
    ],
  },

  features: {
    title: 'Everything the shop needs, in one system',
    lead: 'A summary of each part. Tap «See more details» to know exactly what it does.',
    more: 'See more details',
    items: [
      { icon: 'scan-barcode', t: 'A fast sales terminal', d: 'Search, barcode scanner, phone camera and keyboard shortcuts. Each cashier signs in with their own PIN.', more: ['Accent-insensitive search.', 'USB or Bluetooth barcode scanner and the phone camera.', 'Keyboard shortcuts to charge, discount, amount received, payment method and categories.', 'Each cashier signs in at the terminal with a 4-digit PIN; the owner\'s account never stays at the counter.', 'On a phone the products fill the screen and the total sits in a bar at the bottom.'] },
      { icon: 'wifi-off', t: 'Sells without internet', d: 'Sales are kept on the device and are sent automatically when the network is back. The terminal opens even offline.', more: ['The terminal opens offline with the saved profiles and the cashier signs in with the PIN.', 'Each sale has its own number from the device: when it syncs, it is never counted twice.', 'When the sale arrives, the server checks prices and stock again.', 'Offline, the owner sees in the panel the data already opened, read-only.'] },
      { icon: 'smartphone', t: 'Cash, M-Pesa, e-Mola and Card', d: 'Each payment method appears separately in the reports and in the shift close.', more: ['Change is calculated on screen.', 'The shift close counts only cash; M-Pesa, e-Mola and card are shown apart.', 'The reports show how much came in through each payment method.'] },
      { icon: 'calendar-clock', t: 'Stock by batch and expiry dates', d: 'Each purchase is a batch with an expiry date. Genesis sells what expires first and warns you before.', more: ['The owner chooses how many days before the expiry date to be warned.', 'The day after the expiry date, what was not sold is recorded as a loss automatically.', 'Breakage and internal use are recorded with the reason.', 'Stock adjustments by the owner only, always recorded.'] },
      { icon: 'lock-keyhole', t: 'Owner PIN for sensitive actions', d: 'Cancelling a sale, a discount above the limit or reopening the shift needs the owner\'s PIN.', more: ['Up to the limit the owner chooses, the cashier gives the discount alone; above it, the PIN is needed.', 'Wrong PINs are recorded; too many errors lock for 15 minutes.', 'Everything stays in the history (audit log) the owner can check.'] },
      { icon: 'fingerprint-pattern', t: 'A protected owner panel', d: 'The panel asks for your PIN (or Face ID / fingerprint) every time you open the app and after 5 minutes idle.', more: ['If someone picks up your phone, they do not see the shop\'s figures.', 'Five wrong PINs end the session: you can only get back in with email and password.', 'Private mode: one tap on the eye hides every money amount from the screen.'] },
      { icon: 'qr-code', t: 'Receipts with a verification QR', d: 'Receipts as PDF or printed. The customer scans the QR and confirms the receipt is genuine.', more: ['Thermal receipt printer (optional) or a PDF to share.', 'The QR opens a Genesis page that confirms the sale.'] },
      { icon: 'shopping-cart', t: 'Suggested shopping list', d: 'Genesis suggests what to buy based on sales and sends the list to the supplier on WhatsApp.', more: ['It counts what was sold, the missing stock and what customers asked for and was not there.', 'It shows the investment at cost price and the supplier delivery.', 'The message goes ready-written to the supplier\'s WhatsApp.'] },
      { icon: 'bell', t: 'Alerts in one bell', d: 'Low stock, expiry dates, customer credit, shift-close differences and the monthly goal reached.', more: ['Alerts disappear on their own when the situation is solved.', 'Tapping an alert opens the right page.'] },
      { icon: 'users', t: 'Team, salaries and goals', d: 'Cashiers, workers and salaries. A monthly sales goal with day-by-day progress.', more: ['On the Home page you see who is working now, who already closed the shift and who has not started.', 'The goal shows how much is left and on which day you get there at the current pace.'] },
      { icon: 'languages', t: 'Portuguese and English', d: 'Each person chooses their language: panel, terminal, receipts and PDFs.', more: ['The choice is saved in each person\'s account.'] },
    ],
  },

  reports: {
    title: 'Reports that answer your questions',
    lead: 'Three reports, each for one question. All of them also come as a PDF, to keep or share.',
    items: [
      { icon: 'sun', t: 'Daily', q: 'How did today go?', points: ['Revenue and gross profit of the day', 'Sales by cashier and by payment method', 'Comparison with the previous day', 'Cancellations, shift closes and breakage', 'Products customers asked for that were not in stock'] },
      { icon: 'calendar-range', t: 'Weekly', q: 'How was the week?', points: ['Best and worst day of the week', 'Best-selling and most profitable', 'Comparison with the previous week', 'What to buy for next week'] },
      { icon: 'calendar-check', t: 'Monthly', q: 'How much did I really make?', points: ['From revenue to net profit: minus salaries, rent, expenses and deliveries', 'Monthly goal and the last 12 months', 'Losses from expiry dates and breakage', 'What to buy for next month'] },
    ],
  },

  screens: {
    title: 'See what it looks like',
    lead: 'Real Genesis MZ screens, in a demo shop.',
    items: [
      { key: 'inicio', cap: 'Owner home: today, the goal and who is working' },
      { key: 'mensal', cap: 'Monthly report: from revenue to net profit' },
      { key: 'alertas', cap: 'Alerts: stock, expiry dates and customer credit' },
    ],
  },

  who: {
    title: 'Made for Mozambican retail',
    lead: 'When you set up the shop you choose the type of business and get a ready-made catalogue with the most common products (over 200 in total), with suggested prices you can change. In meticais, with M-Pesa and e-Mola.',
    items: [
      { icon: 'beer', t: 'Bottle store' }, { icon: 'shopping-basket', t: 'Grocery shop' }, { icon: 'croissant', t: 'Bakery' },
      { icon: 'beef', t: 'Butchery' }, { icon: 'utensils', t: 'Restaurant' }, { icon: 'store', t: 'Supermarket' },
    ],
    other: 'Your business is not on the list? Talk to us.',
  },

  how: {
    title: 'Getting started',
    items: [
      { t: 'Request an account', d: 'Fill in the request with the shop name, the type of business and your email.' },
      { t: 'Get your access', d: 'We approve the request and send you the sign-in details. The free month starts here.' },
      { t: 'Set up in 5 steps', d: 'Type of business, catalogue with prices, costs, team and suppliers, and opening hours — with an explanation at each step.' },
      { t: 'Connect the counter', d: 'Pair the counter computer or tablet with a 6-digit code and start selling.' },
    ],
  },

  security: {
    title: 'Your shop\'s data is yours alone',
    items: [
      'The owner panel asks for a PIN or Face ID when it opens and after 5 minutes idle.',
      'Each shop is kept apart from the others by two independent layers: in the application and in the database itself.',
      'Cashiers do not see costs, margins, reports or their colleagues\' sales.',
      'Cancellations, discounts and stock adjustments stay in the history the owner can check.',
      'Changing the password or the PIN ends the old sessions at once.',
    ],
  },

  priceBlock: {
    title: 'One plan, everything included',
    lead: 'Every feature on this page, for your shop.',
    free: 'New customers: the first month is free.',
    cta: 'See the plan',
  },

  faq: {
    title: 'Frequently asked questions',
    items: [
      { q: 'Do I need internet to sell?', a: 'No. Once the cashier has signed in once with internet on that device, the terminal opens and sells offline and sends the sales when the connection is back. Offline, the owner panel shows the data already opened, read-only.' },
      { q: 'What if someone picks up my phone?', a: 'The owner panel asks for your PIN (or Face ID / fingerprint) every time you open the app and after 5 minutes without use. There is also private mode, which hides money amounts from the screen.' },
      { q: 'What equipment do I need?', a: 'A computer, tablet or phone with an up-to-date browser (Chrome, Edge or Safari). A barcode scanner and a receipt printer are optional: without a printer, the receipt is a PDF.' },
      { q: 'Does it work on a phone?', a: 'Yes. The owner panel and the terminal work on a phone and can be installed on the home screen, like an app.' },
      { q: 'Can cashiers see the shop\'s profit?', a: 'No. Cashiers only see the terminal: they sell, print the receipt and record breakages and customer requests. Costs, margins and reports are for the owner only.' },
      { q: 'How much does it cost?', a: '{price} per month, everything included. New customers do not pay the first month.' },
      { q: 'How do I pay and how do I cancel?', a: 'For now, payment and cancellation are arranged with us on WhatsApp.' },
      { q: 'Can I use Genesis in English?', a: 'Yes. Each person chooses Portuguese or English, and the choice is saved in the account.' },
    ],
  },

  final: {
    title: 'Start today, with the first month free',
    lead: 'The account request is a short form. Questions? Talk to us on WhatsApp.',
  },

  footer: {
    tagline: 'Sales, stock and cash for shops in Mozambique.',
    product: 'Product', access: 'Access', contact: 'Contact', request: 'Request an account',
    whatsapp: 'WhatsApp',
    rights: '© 2026 Genesis MZ',
  },

  pricing: {
    eyebrow: 'Pricing',
    title: 'Simple pricing for your shop',
    lead: 'One plan, with every feature. No surprises.',
    planName: 'Genesis MZ',
    planDesc: 'For one shop, with the owner, the cashiers and the counter.',
    free: 'New customers: the first month is free — you only start paying in the second month.',
    join: 'Join the plan',
    start: 'Start the free month',
    included: 'Included in the plan',
    includedItems: [
      'Sales terminal with a PIN for each cashier',
      'Offline sales, sent when the network is back',
      'Cash, M-Pesa, e-Mola and Card kept separate',
      'Stock by batch, expiry dates and alerts',
      'Blind shift close',
      'Owner panel with PIN, Face ID and private mode',
      'Customer credit, suppliers and shopping list',
      'Daily, weekly and monthly reports with net profit',
      'PDF or printed receipts, with QR',
      'Team, salaries and goals',
      'Portuguese and English',
    ],
    annualTitle: 'Prefer to pay for the whole year?',
    annualText: 'Talk to us about the annual plan.',
    annualCta: 'Ask about the annual plan',
    payTitle: 'How to join and pay',
    paySteps: [
      { t: 'Tap «Join the plan»', d: 'It opens a WhatsApp chat with us, with the message already written.' },
      { t: 'We arrange the payment', d: 'We tell you how to pay and the exact amount.' },
      { t: 'Send the receipt', d: 'After paying, send us the receipt and your account email.' },
    ],
    paidCta: 'I have paid — send the receipt',
    mobileTitle: 'Mobile wallet',
    bankTitle: 'Bank deposit or transfer',
    account: 'Account', nib: 'NIB', holder: 'Holder',
    faqTitle: 'Questions about the plan',
    faq: [
      { q: 'When do I start paying?', a: 'The free month starts when your account is approved. You only pay from the second month.' },
      { q: 'What happens if the free month ends without payment?', a: 'You lose nothing. The panel still opens for viewing only: you see the history and the reports, but no new sales are recorded until the subscription is paid.' },
      { q: 'Is the free month for everyone?', a: 'It is for new customers only.' },
      { q: 'How do I pay and how do I cancel?', a: 'For now, we arrange everything on WhatsApp: the payment method, the receipt and the cancellation.' },
    ],
  },
};
