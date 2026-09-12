const sendWhatsAppAlert = async ({ to, message, tenantName }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    console.info('[WhatsApp] Twilio not configured; skipping message.', { to, tenantName });
    return { ok: false, skipped: true, reason: 'twilio-not-configured' };
  }

  const whatsappTo = String(to || '').trim();
  if (!whatsappTo) {
    throw new Error('Número de WhatsApp obrigatório');
  }

  const normalizedTo = whatsappTo.startsWith('whatsapp:') ? whatsappTo : `whatsapp:${whatsappTo}`;
  const payload = new URLSearchParams({
    From: from,
    To: normalizedTo,
    Body: String(message || '').trim() || `Olá ${tenantName || 'cliente'}, este é um alerta do Genesis.`
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload.toString()
  });

  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error_message || 'Erro ao enviar WhatsApp';
    throw new Error(errorMessage);
  }

  return { ok: true, sid: data.sid, provider: 'twilio', to: normalizedTo };
};

module.exports = { sendWhatsAppAlert };
