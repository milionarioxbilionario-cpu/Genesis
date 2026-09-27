#!/usr/bin/env node
/* ==========================================================================
   GENESIS - VERIFICACAO DO SMTP (frente 2)
   --------------------------------------------------------------------------
   Uso:
     node scripts/check_mail.js                     -> mostra a configuracao
     node scripts/check_mail.js --to omeu@email.com -> envia um email de teste

   O que verifica, por ordem:
     1. MAIL_USER / MAIL_PASS presentes em backend/.env
     2. nodemailer instalado (o mailer e resiliente: se faltar, diz que falta)
     3. Ligacao real ao servidor SMTP (LOGIN + QUIT)
     4. Envio efectivo de um email de recuperacao de senha

   Nao muda nada no servidor nem escreve na base de dados.
   ========================================================================== */

const path = require('path');

// Carrega backend/.env quando corre de fora do processo principal.
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (err) { /* dotenv ausente: ja ha env carregada pelo shell */ }

const { getMailerConfig, sendPasswordResetEmail, sendMail } = require('../src/utils/mailer');

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1].trim() : '';
}

function title(t) {
  console.log('\n=== ' + t + ' ===');
}

async function main() {
  const cfg = getMailerConfig();

  title('1. Configuracao lida de backend/.env');
  console.log('  MAIL_USER   : ' + (cfg.user || '(vazio)'));
  console.log('  MAIL_PASS   : ' + (cfg.pass ? 'definida (' + cfg.pass.length + ' caracteres)' : '(vazio)'));
  console.log('  MAIL_FROM   : ' + cfg.from);
  console.log('  SMTP_HOST   : ' + cfg.host);
  console.log('  SMTP_PORT   : ' + cfg.port + (cfg.secure ? '  (SSL)' : '  (STARTTLS)'));
  console.log('  configurado : ' + (cfg.isConfigured ? 'SIM' : 'NAO'));

  if (!cfg.isConfigured) {
    console.log('');
    console.log('  FALTA CONFIGURAR. Preenche MAIL_USER e MAIL_PASS em backend/.env');
    console.log('  (senha de aplicativo do Google, 16 caracteres).');
    console.log('  Enquanto isso o forgot-password continua a funcionar, mas o');
    console.log('  codigo so aparece no log do servidor.');
    process.exitCode = 1;
    return;
  }

  let nodemailer = null;
  try {
    nodemailer = require('nodemailer');
  } catch (err) {
    nodemailer = null;
  }
  title('2. nodemailer');
  if (!nodemailer) {
    console.log('  FALTA: npm i nodemailer (o mailer degrada sem ele, mas nao envia).');
    process.exitCode = 1;
    return;
  }
  const pkg = require('nodemailer/package.json');
  console.log('  presente, versao ' + pkg.version);

  title('3. Ligacao SMTP');
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  try {
    const info = await transporter.verify();
    console.log('  OK -> ' + (typeof info === 'string' ? info : 'servidor aceitou as credenciais'));
  } catch (err) {
    console.log('  FALHOU -> ' + String(err && err.message ? err.message : err).split('\n')[0]);
    console.log('');
    console.log('  Causas habituais: senha de aplicativo errada, 2-FA desligada,');
    console.log('  ou IP bloqueado pelo Google (\"acesso menos seguro\").');
    process.exitCode = 1;
    return;
  }

  const to = arg('--to');
  title('4. Envio de teste');
  if (!to) {
    console.log('  saltado - volta a correr com:  node scripts/check_mail.js --to omeu@email.com');
    return;
  }

  const result = await sendPasswordResetEmail(to, '123456');
  if (result.ok) {
    console.log('  ENVIADO para ' + to + ' (messageId ' + result.messageId + ')');
    console.log('  -> Se chegou, a Frente 2 fica concluida.');
    return;
  }

  // Sem config de entrega, o sendMail devolve skipped - mostramos a razao.
  const raw = await sendMail({ to, subject: 'Genesis - teste SMTP', text: 'teste' });
  console.log('  FALHOU -> ' + (result.error || raw.error || 'desconhecido'));
  process.exitCode = 1;
}

main().catch((err) => {
  console.error('[check_mail] erro inesperado:', err && err.message ? err.message : err);
  process.exitCode = 1;
});
