import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Info } from 'lucide-react';
import api, { trackOwnCredentialChange } from '../../utils/api';
import useApi from '../../utils/useApi';
import { date, errorMessage } from '../../utils/format';
import { useI18n } from '../../i18n/react';
import { useSession, isManager } from '../../utils/session';
import { Alert, Badge, Button, Card, CardHeader, Dialog, Input, PageHeader, Skeleton, useToast } from '../../components/ui';

// Fase 16: perfil do dono — conta, senha, e-mail (codigo no actual e no novo),
// WhatsApp dos alertas, plano e aniversario (definido uma vez; o presente so se
// explica depois de definido).
export default function Profile() {
  const { user } = useSession();
  // E2: o gerente so muda a propria senha (o resto do perfil e do dono).
  if (isManager(user)) return <ManagerProfile user={user} />;
  return <OwnerProfile />;
}

function ManagerProfile({ user }) {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t('Perfil')} description={t('A sua conta de gerente.')} />
      <div className="grid max-w-4xl grid-cols-1 gap-4">
        <Card>
          <CardHeader title={user.name} description={user.email} />
          <p className="text-sm text-ink-muted">{t('O dono criou esta conta. Para mudar o nome ou o e-mail, fale com ele.')}</p>
        </Card>
        <PasswordCard />
      </div>
    </>
  );
}

function OwnerProfile() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/api/profile');
  if (loading && !data) return <Skeleton className="h-96 w-full" />;
  return (
    <>
      <PageHeader title={t('Perfil')} description={t('A sua conta, a segurança e o seu plano.')} />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      {data && (
        <div className="grid max-w-4xl grid-cols-1 gap-4">
          <AccountCard p={data} reload={reload} />
          <PasswordCard />
          <Card>
            <CardHeader title={t('PIN do painel e Face ID')} description={t('O painel pede o seu PIN (ou Face ID) ao abrir e depois de 5 minutos parado.')} />
            <Button onClick={() => navigate('/app/definicoes?tab=discounts')}>{t('Abrir o PIN e o Face ID')}</Button>
          </Card>
          <AlertsPhoneCard p={data} reload={reload} />
          <Card>
            <CardHeader title={t('Logótipo do estabelecimento')} description={t('Aparece no topo de cada recibo.')} />
            <Button onClick={() => navigate('/app/definicoes?tab=store')}>{t('Mudar o logótipo')}</Button>
          </Card>
          <PlanCard p={data} />
          <BirthdayCard p={data} reload={reload} />
        </div>
      )}
    </>
  );
}

function AccountCard({ p, reload }) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('ask');
  const [form, setForm] = useState({ new_email: '', password: '', code_current: '', code_new: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dev, setDev] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const close = () => { setOpen(false); setStep('ask'); setError(''); setDev(null); setForm({ new_email: '', password: '', code_current: '', code_new: '' }); };
  async function start() {
    setBusy(true); setError('');
    try {
      const r = await api.post('/api/profile/email/start', { new_email: form.new_email.trim(), password: form.password });
      setDev(r.data.devCodes || null);
      setStep('codes');
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function confirm() {
    setBusy(true); setError('');
    try {
      await api.post('/api/profile/email/confirm', { code_current: form.code_current.trim(), code_new: form.code_new.trim() });
      toast(t('E-mail mudado.'));
      close(); reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <Card>
      <CardHeader title={t('Conta')} />
      <dl className="grid gap-3 sm:grid-cols-2">
        <div><dt className="text-sm text-ink-muted">{t('Nome')}</dt><dd className="text-base text-ink">{p.name}</dd></div>
        <div><dt className="text-sm text-ink-muted">{t('E-mail')}</dt><dd className="break-all text-base text-ink">{p.email}</dd></div>
      </dl>
      <div className="mt-4"><Button onClick={() => setOpen(true)}>{t('Mudar o e-mail')}</Button></div>
      <Dialog open={open} size="sm" title={t('Mudar o e-mail')} onClose={close}
        footer={step === 'ask'
          ? <><Button onClick={close}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!form.new_email.includes('@') || !form.password} onClick={start}>{t('Enviar os códigos')}</Button></>
          : <><Button onClick={close}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!/^\d{6}$/.test(form.code_current) || !/^\d{6}$/.test(form.code_new)} onClick={confirm}>{t('Confirmar')}</Button></>}>
        <div className="flex flex-col gap-3">
          {error && <Alert tone="danger">{error}</Alert>}
          {step === 'ask' ? (
            <>
              {!p.email_enabled && <Alert tone="warning">{t('O envio de e-mails ainda não está activo. Se o pedido falhar, fale com o suporte.')}</Alert>}
              <Input label={t('E-mail novo')} type="email" value={form.new_email} onChange={set('new_email')} autoFocus />
              <Input label={t('A sua senha')} type="password" autoComplete="current-password" value={form.password} onChange={set('password')} hint={t('Para confirmar que é você.')} />
            </>
          ) : (
            <>
              <p className="text-base text-ink-2">{t('Enviámos um código de 6 dígitos para o e-mail actual e outro para o novo. Escreva os dois.')}</p>
              {dev && <Alert tone="info">{t('Teste local (sem envio de e-mails): {a} / {b}', { a: dev.current, b: dev.next })}</Alert>}
              <Input label={t('Código do e-mail actual')} inputMode="numeric" maxLength={6} value={form.code_current} onChange={set('code_current')} inputClassName="num" />
              <Input label={t('Código do e-mail novo')} inputMode="numeric" maxLength={6} value={form.code_new} onChange={set('code_new')} inputClassName="num" />
            </>
          )}
        </div>
      </Dialog>
    </Card>
  );
}

function PasswordCard() {
  const { t } = useI18n();
  const toast = useToast();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mismatch = f.confirm && f.next !== f.confirm;
  const valid = f.current && f.next.length >= 8 && f.next === f.confirm;
  async function save() {
    setBusy(true); setError('');
    try {
      await trackOwnCredentialChange(api.put('/api/profile/password', { current_password: f.current, new_password: f.next }));
      toast(t('Senha mudada. As outras sessões foram fechadas.'));
      setF({ current: '', next: '', confirm: '' });
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <Card>
      <CardHeader title={t('Senha')} description={t('Ao mudar a senha, quem tinha a antiga perde o acesso na hora.')} />
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label={t('Senha actual')} type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} />
        <Input label={t('Senha nova')} type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} hint={t('Pelo menos 8 caracteres.')} />
        <Input label={t('Repetir a senha nova')} type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} error={mismatch ? t('Não é igual à senha nova.') : undefined} />
      </div>
      <div className="mt-4 flex justify-end"><Button variant="primary" loading={busy} disabled={!valid} onClick={save}>{t('Mudar a senha')}</Button></div>
    </Card>
  );
}

function AlertsPhoneCard({ p, reload }) {
  const { t } = useI18n();
  const toast = useToast();
  const [phone, setPhone] = useState(p.alerts_phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true); setError('');
    try { await api.put('/api/profile/alerts-phone', { phone: phone.trim() }); toast(t('Número guardado.')); reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  return (
    <Card>
      <CardHeader title={t('WhatsApp dos alertas')} description={t('O número que recebe os relatórios e os avisos do negócio.')} />
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      <div className="flex flex-wrap items-end gap-3">
        <Input label={t('Número')} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="84 123 4567" className="w-56" />
        <Button variant="primary" loading={busy} disabled={phone.trim() === (p.alerts_phone || '')} onClick={save}>{t('Guardar')}</Button>
      </div>
    </Card>
  );
}

function PlanCard({ p }) {
  const { t } = useI18n();
  const premium = p.plan.effective === 'premium';
  // Premium oferecido (presente): a decorrer ou ainda por comecar (plano mensal = proximo ciclo).
  const gifted = p.plan.plan !== 'premium' && p.plan.premium_until && new Date(p.plan.premium_until) > new Date();
  const lastDay = gifted ? date(new Date(new Date(p.plan.premium_until).getTime() - 1)) : '';
  return (
    <Card>
      <CardHeader title={t('Plano')} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={premium ? 'positive' : 'neutral'}>{premium ? t('Premium') : t('Básico')}</Badge>
        <span className="text-sm text-ink-2">{p.plan.period === 'annual' ? t('Pagamento anual') : t('Pagamento mensal')}</span>
      </div>
      {gifted && (premium
        ? <p className="mt-2 text-sm text-ink-2">{t('Premium oferecido até {d}.', { d: lastDay })}</p>
        : <p className="mt-2 text-sm text-ink-2">{t('Premium oferecido de {a} a {b} (começa no próximo ciclo da subscrição).', { a: date(p.plan.premium_from), b: lastDay })}</p>)}
      <p className="mt-3 text-sm text-ink-muted">{t('Premium: conteúdos premium e personalizados. Para mudar de plano, fale connosco pelo WhatsApp.')}</p>
    </Card>
  );
}

function BirthdayCard({ p, reload }) {
  const { t } = useI18n();
  const toast = useToast();
  const [day, setDay] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(false);
  async function save() {
    setBusy(true); setError('');
    try { await api.put('/api/profile/birthday', { birthday: day }); toast(t('Data de aniversário guardada.')); reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function claim() {
    setBusy(true); setError('');
    try {
      const r = await api.post('/api/profile/birthday/gift');
      const starts = new Date(r.data.premium_from) > new Date();
      toast(starts ? t('Presente recolhido: 1 mês de Premium a partir de {d}. Parabéns!', { d: date(r.data.premium_from) }) : t('Presente recolhido: tem 1 mês de Premium. Parabéns!'));
      reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  const claimed = p.gift.claimed_this_year;
  return (
    <Card>
      <CardHeader title={t('Aniversário')} />
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      {!p.birthday ? (
        <>
          <p className="mb-3 text-sm text-ink-2">{t('Só pode escolher a data uma vez. Confirme antes de guardar.')}</p>
          <div className="flex flex-wrap items-end gap-3">
            <Input label={t('Data de nascimento')} type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-56" />
            <Button variant="primary" loading={busy} disabled={!day} onClick={save}>{t('Guardar')}</Button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-base text-ink">{date(p.birthday + 'T12:00:00')}</p>
          <span className={claimed ? 'opacity-30' : ''} aria-label={claimed ? t('Presente deste ano já recolhido') : t('Presente de aniversário')} title={claimed ? t('Presente deste ano já recolhido') : t('Presente de aniversário')}>
            <Gift size={28} className="text-accent" aria-hidden="true" />
          </span>
          <button type="button" className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover" onClick={() => setInfo(true)}><Info size={16} aria-hidden="true" />{t('Para que serve')}</button>
          {p.gift.available && <Button variant="primary" loading={busy} onClick={claim}>{t('Recolher o presente')}</Button>}
        </div>
      )}
      <Dialog open={info} size="sm" title={t('O seu presente de aniversário')} onClose={() => setInfo(false)} footer={<Button variant="primary" onClick={() => setInfo(false)}>{t('Entendi')}</Button>}>
        <div className="flex flex-col gap-2 text-base text-ink-2">
          <p>{t('No dia do seu aniversário, ao entrar no Genesis, recebe 1 mês de Premium. Recolhe-o aqui, no Perfil.')}</p>
          <p>{t('Plano mensal: o mês de Premium começa no próximo ciclo da sua subscrição.')}</p>
          <p>{t('Plano anual: o Premium começa no próprio dia e dura até ao mesmo dia do mês seguinte.')}</p>
          <p>{t('Depois de recolhido, o ícone fica transparente até ao ano seguinte.')}</p>
        </div>
      </Dialog>
    </Card>
  );
}
