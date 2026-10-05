// ===========================================================================
//  CONFIGURAR O ENVIO DE EMAILS (Brevo SMTP) NO SERVIDOR
//  ssh -t ... root@<IP> "cd /srv/genesis/backend && sudo -u genesis node scripts/configurar_email.js && systemctl restart genesis-backend"
//
//  Pede o login SMTP e a chave SMTP do Brevo (a chave nao aparece no ecra),
//  envia um email de teste e SO guarda se o envio funcionar. Grava no .env
//  de producao e na copia mestra (/srv/genesis/backend.env, que o publicar.sh
//  volta a copiar em cada publicacao). Nunca imprime a chave.
// ===========================================================================
const fs = require('fs');
const readline = require('readline');
const nodemailer = require('nodemailer');

const HOST = 'smtp-relay.brevo.com';
const PORT = 587;
const FROM = 'Genesis <no-reply@genesismz.com>';
const FILES = ['/srv/genesis/backend/.env', '/srv/genesis/backend.env'];

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else rl.output.write('*'); };
    }
    rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(answer.trim()); });
  });
}

function setVars(file, vars) {
  if (!fs.existsSync(file)) return false;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (const [k, v] of Object.entries(vars)) {
    const line = `${k}=${JSON.stringify(v)}`;
    const i = lines.findIndex((l) => l.startsWith(k + '='));
    if (i >= 0) lines[i] = line; else lines.splice(lines.length - (lines[lines.length - 1] === '' ? 1 : 0), 0, line);
  }
  fs.writeFileSync(file, lines.join('\n'), { mode: 0o600 });
  return true;
}

(async () => {
  console.log('\n  Configurar emails do Genesis (Brevo)\n');
  console.log('  No Brevo: menu do canto superior direito -> "SMTP & API" -> separador "SMTP".\n');
  const user = await ask('  Login SMTP (ex.: 8a1b2c001@smtp-brevo.com): ');
  const pass = (await ask('  Chave SMTP (nao aparece no ecra): ', { hidden: true })).replace(/\s+/g, '');
  const to = await ask('  Enviar email de teste para: ');
  if (!user || !pass || !to) { console.log('\n  Faltam dados. Nada foi alterado.'); process.exit(1); }

  const transporter = nodemailer.createTransport({ host: HOST, port: PORT, secure: false, auth: { user, pass }, connectionTimeout: 15000, greetingTimeout: 15000 });
  try {
    await transporter.verify();
    const info = await transporter.sendMail({
      from: FROM, to, subject: 'Teste do Genesis: os emails estão a funcionar',
      text: 'Se recebeu este email, o Genesis já consegue enviar códigos de recuperação de senha.',
    });
    console.log('\n  Email de teste enviado (' + info.messageId + ').');
  } catch (err) {
    console.log('\n  FALHOU o envio: ' + String(err.message || err).slice(0, 200));
    console.log('  Nada foi alterado. Confirme o login e a chave SMTP, e se o remetente no-reply@genesismz.com');
    console.log('  esta autorizado no Brevo (dominio genesismz.com verificado).');
    process.exit(1);
  }

  const vars = { MAIL_USER: user, MAIL_PASS: pass, MAIL_FROM: FROM, SMTP_HOST: HOST, SMTP_PORT: String(PORT) };
  const saved = FILES.filter((f) => setVars(f, vars));
  console.log('  Configuracao guardada em: ' + saved.join(', '));
  console.log('  O servidor vai reiniciar para usar a configuracao nova.\n');
})();
