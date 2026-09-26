// Utilitario de envio de emails transaccionais (recuperacao de conta, alertas).
//
// Configuracao suportada (ver plan.md):
//   - SMTP Gmail (App Password de 16 caracteres gerada na Google Account)
//   - MAIL_USER / SMTP_USER
//   - MAIL_PASS / SMTP_PASS  (espacos sao removidos automaticamente, comum ao copiar do Google)
//   - MAIL_FROM (se omitido, usa MAIL_USER)
//   - SMTP_HOST (default: smtp.gmail.com)
//   - SMTP_PORT (default: 465 com SSL ou 587 com STARTTLS)
//
// Se nao estiver configurado, as funcoes devolvem { ok: false, skipped: true }
// sem rebentar o fluxo principal da aplicacao.

// NOTA (2026-09-26): o require e LAZY (dentro de getTransporter) e protegido
// com try/catch. Se o nodemailer faltar ou a versao instalada nao suportar
// require, o reset continua a funcionar por WhatsApp/log em vez de o modulo
// inteiro falhar no arranque e deitar o backend abaixo.
function loadNodemailer() {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require('nodemailer');
  } catch (err) {
    console.error('[mailer] nodemailer indisponivel:', String((err && err.message) || err).slice(0, 160));
    return null;
  }
}

function getMailerConfig() {
  const user = (process.env.MAIL_USER || process.env.SMTP_USER || '').trim();
  // App passwords do Google vem frequentemente no formato "abcd efgh ijkl mnop".
  // Espacos devem ser sempre removidos.
  const pass = (process.env.MAIL_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT || (host === 'smtp.gmail.com' ? 465 : 587));
  const secure = port === 465;
  const from = (process.env.MAIL_FROM || user || 'Genesis <no-reply@genesis.local>').trim();

  return {
    isConfigured: Boolean(user && pass),
    user,
    pass,
    host,
    port,
    secure,
    from,
  };
}

let cachedTransporter = null;

function getTransporter() {
  const cfg = getMailerConfig();
  if (!cfg.isConfigured) return null;

  const nodemailer = loadNodemailer();
  if (!nodemailer) return null;

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }
  return cachedTransporter;
}

/**
 * Envia email generico.
 * @param {{ to: string, subject: string, text?: string, html?: string }} opts
 */
async function sendMail({ to, subject, text, html }) {
  const cfg = getMailerConfig();
  if (!cfg.isConfigured) {
    return { ok: false, skipped: true, reason: 'smtp-not-configured' };
  }

  const transporter = getTransporter();
  try {
    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const msg = String(err && err.message ? err.message : err);
    console.error('[mailer] Falha no envio para', to, ':', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Envia codigo de recuperacao de palavra-passe.
 * @param {string} to - Destinatario
 * @param {string} code - Codigo de 6 digitos
 */
async function sendPasswordResetEmail(to, code) {
  const subject = `${code} é o seu código de recuperação Genesis`;
  const text = `Recebeu este pedido porque solicitou a recuperação da palavra-passe no Genesis.\n\n` +
    `O seu código de recuperação é: ${code}\n\n` +
    `Este código é válido por 15 minutos e permite até 5 tentativas.\n\n` +
    `Se não fez este pedido, ignore este email. A sua palavra-passe mantém-se inalterada.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; margin-top: 0;">Recuperação de Palavra-passe</h2>
      <p style="color: #475569; font-size: 15px;">Recebeu este pedido porque solicitou a reposição da sua palavra-passe na plataforma Genesis.</p>
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0284c7;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">O código é válido por <strong>15 minutos</strong> e permite até 5 tentativas.</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">Se não fez este pedido, pode ignorar esta mensagem com total segurança.</p>
    </div>
  `;

  return sendMail({ to, subject, text, html });
}

module.exports = {
  getMailerConfig,
  sendMail,
  sendPasswordResetEmail,
};
