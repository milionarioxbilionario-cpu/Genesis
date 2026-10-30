import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { Alert, Button, Input, Segmented, Select } from '../../components/ui';
import { useI18n } from '../../i18n/react';
import AuthLayout from './AuthLayout';
import { BUSINESS_TYPES } from './RequestAccount';

// Etapa A (decisao do fundador 27/10): os negocios com modo proprio ainda por
// construir deixam o contacto; o pedido chega ao painel de administracao e o
// fundador avisa quando o modo existir (nada e enviado automaticamente).
export const COMING_SOON = BUSINESS_TYPES.filter((b) => b.pending);

export default function NotifyMe() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const initial = COMING_SOON.some((b) => b.value === params.get('tipo')) ? params.get('tipo') : COMING_SOON[0].value;
  const [form, setForm] = useState({ business_type: initial, name: '', phone: '', email: '', channel: 'whatsapp' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const needsEmail = form.channel !== 'whatsapp';

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/waitlist', form);
      setDone(true);
    } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
  }

  if (done) {
    const label = t(BUSINESS_TYPES.find((b) => b.value === form.business_type)?.label || '');
    return (
      <AuthLayout title={t('Está na lista')} footer={<a href="/" className="font-medium text-accent">{t('Voltar ao início')}</a>}>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-5">
          <CheckCircle2 className="mt-0.5 shrink-0 text-positive" size={20} />
          <p className="text-base text-ink-2">{t('Obrigado. Quando o Genesis para {type} estiver pronto, avisamos por {channel}.', { type: label, channel: form.channel === 'both' ? t('WhatsApp e e-mail') : form.channel === 'email' ? t('e-mail') : 'WhatsApp' })}</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('Avise-me quando estiver pronto')} description={t('Estamos a preparar o Genesis para estes negócios com o cuidado que merecem. Deixe o contacto e avisamos assim que estiver pronto.')}
      footer={<>{t('O seu negócio vende ao balcão?')} <Link to="/pedir-conta" className="font-medium text-accent">{t('Pedir uma conta')}</Link></>}>
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Select label={t('Tipo de negócio')} value={form.business_type} onChange={set('business_type')}>
          {COMING_SOON.map((b) => <option key={b.value} value={b.value}>{t(b.label)}</option>)}
        </Select>
        <Input label={t('O seu nome')} value={form.name} onChange={set('name')} required minLength={2} maxLength={80} autoComplete="name" />
        <Input label={t('Número de WhatsApp')} inputMode="tel" placeholder="84 000 0000" value={form.phone} onChange={set('phone')} required minLength={8} autoComplete="tel" />
        <Input label={t('E-mail')} type="email" autoComplete="email" value={form.email} onChange={set('email')} required={needsEmail} hint={needsEmail ? undefined : t('Opcional')} />
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">{t('Como quer ser avisado?')}</p>
          <Segmented className="w-full" value={form.channel} onChange={(v) => setForm((f) => ({ ...f, channel: v }))}
            options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: t('E-mail') }, { value: 'both', label: t('Os dois') }]} />
        </div>
        <Button type="submit" variant="primary" size="lg" block loading={loading}>{t('Avisem-me')}</Button>
      </form>
    </AuthLayout>
  );
}
