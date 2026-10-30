import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Beer, BedDouble, Beef, CakeSlice, CheckCircle2, Coffee, Flame, Fuel, Hamburger, PackageOpen, Pill, Scissors, Shirt, ShoppingBasket, Ship, Stethoscope, Store, Utensils, Wheat, Wine, Briefcase, Building } from 'lucide-react';
import api from '../../utils/api';
import { errorMessage } from '../../utils/format';
import { Alert, Button, Input, Select } from '../../components/ui';
import { useI18n } from '../../i18n/react';
import AuthLayout from './AuthLayout';

// label em portugues = chave da traducao (quem mostra faz t(label)).
// 27/10: tipos separados (um restaurante nao e uma churrascaria). Igual a
// backend/src/utils/businessTypes.js. pending = modo proprio ainda por construir:
// «Brevemente» (decisao 27/10: primeiro o POS puro); deixam o contacto em /avise-me.
export const BUSINESS_TYPES = [
  { value: 'bottle_store', label: 'Bottle store', icon: Beer },
  { value: 'loja_bebidas', label: 'Loja de bebidas', icon: Wine },
  { value: 'mercearia', label: 'Mercearia ou contentor', icon: ShoppingBasket },
  { value: 'supermercado', label: 'Supermercado', icon: Store },
  { value: 'padaria', label: 'Padaria', icon: Wheat },
  { value: 'pastelaria', label: 'Pastelaria', icon: CakeSlice },
  { value: 'cafetaria', label: 'Cafetaria', icon: Coffee },
  { value: 'talho', label: 'Talho', icon: Beef },
  { value: 'restaurante', label: 'Restaurante', icon: Utensils, pending: true },
  { value: 'churrascaria', label: 'Churrascaria', icon: Flame },
  { value: 'fast_food', label: 'Fast food e lanchonete', icon: Hamburger, pending: true },
  { value: 'boutique', label: 'Boutique (roupa e calçado)', icon: Shirt },
  { value: 'farmacia', label: 'Farmácia', icon: Pill, pending: true },
  { value: 'salao', label: 'Salão e barbearia', icon: Scissors, pending: true },
  { value: 'clinica', label: 'Clínica', icon: Stethoscope, pending: true },
  { value: 'posto_combustivel', label: 'Posto de combustível', icon: Fuel, pending: true },
  { value: 'nhonguista', label: 'Vendedor por conta própria', icon: Briefcase, pending: true },
  { value: 'importador', label: 'Importador', icon: Ship, pending: true },
  { value: 'hotelaria', label: 'Hotel e alojamento', icon: BedDouble, pending: true },
  { value: 'arrendamento', label: 'Arrendamento de casas e flats', icon: Building, pending: true },
  { value: 'outro', label: 'Outro tipo de negócio', icon: PackageOpen },
];

// Especificacao 6.1, passo 1. NUIT e documento sao opcionais.
export default function RequestAccount() {
  const { t } = useI18n();
  const [form, setForm] = useState({ businessName: '', ownerName: '', businessType: 'bottle_store', location: '', phone: '', email: '', nuit: '', idDocument: '', acceptTerms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const body = { ...form };
    body.email = body.email.trim();
    for (const k of ['nuit', 'idDocument']) if (!body[k].trim()) delete body[k];
    try {
      await api.post('/api/auth/request-account', body);
      setDone(true);
    } catch (err) {
      const raw = err?.response?.data?.error;
      setError(Array.isArray(raw) ? t('Verifique os campos: nomes com pelo menos 3 letras, telefone com 8 ou mais dígitos e um email válido.') : errorMessage(err));
    } finally { setLoading(false); }
  }

  if (done) {
    return (
      <AuthLayout title={t('Pedido recebido')} footer={<Link to="/entrar" className="font-medium text-accent">{t('Voltar a entrar')}</Link>}>
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-5">
          <CheckCircle2 className="mt-0.5 shrink-0 text-positive" size={20} />
          <p className="text-base text-ink-2">{t('Entraremos em contacto em até 48 horas pelo telefone indicado. Depois da aprovação recebe os dados de acesso e tem 30 dias de teste gratuito.')}</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide title={t('Pedir uma conta')} description={t('30 dias de teste gratuito. Sem compromisso.')} footer={<>{t('Já tem conta?')} <Link to="/entrar" className="font-medium text-accent">{t('Entrar')}</Link></>}>
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label={t('Nome do negócio')} value={form.businessName} onChange={set('businessName')} required minLength={3} className="sm:col-span-2" />
        <Input label={t('O seu nome')} value={form.ownerName} onChange={set('ownerName')} required minLength={3} />
        <Select label={t('Tipo de negócio')} value={form.businessType} onChange={set('businessType')}>
          {BUSINESS_TYPES.filter((b) => !b.pending).map((b) => <option key={b.value} value={b.value}>{t(b.label)}</option>)}
        </Select>
        <Input label={t('Localização')} placeholder={t('Bairro, cidade')} value={form.location} onChange={set('location')} required minLength={3} />
        <Input label={t('Telefone (WhatsApp)')} inputMode="tel" placeholder="84 000 0000" value={form.phone} onChange={set('phone')} required minLength={8} hint={t('É por aqui que recebe os dados da conta e, depois, os relatórios do seu negócio.')} />
        <Input label={t('Email')} hint={t('Para entrar e recuperar a senha')} type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
        <Input label="NUIT" hint={t('Opcional')} value={form.nuit} onChange={set('nuit')} />
        <Input label={t('BI ou passaporte')} hint={t('Opcional')} value={form.idDocument} onChange={set('idDocument')} className="sm:col-span-2" />
        <p className="text-sm text-ink-2 sm:col-span-2">
          {t('Restaurante, fast food, hotel, farmácia, clínica, salão, posto de combustível e outros: brevemente.')}{' '}
          <Link to="/avise-me" className="font-medium text-accent">{t('Avise-me quando estiver pronto')}</Link>
        </p>
        {/* 30/10/2026: so maiores de 18 anos; Termos e Privacidade aceites (o servidor tambem exige). */}
        <label className="flex items-start gap-3 text-sm text-ink-2 sm:col-span-2">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--accent)]" checked={form.acceptTerms} onChange={(e) => setForm((f) => ({ ...f, acceptTerms: e.target.checked }))} />
          <span>
            {t('Tenho 18 anos ou mais e aceito os')}{' '}
            <a href={t('/termos')} target="_blank" rel="noopener" className="font-medium text-accent underline">{t('Termos e condições')}</a>{' '}
            {t('e a')}{' '}
            <a href={t('/privacidade')} target="_blank" rel="noopener" className="font-medium text-accent underline">{t('Política de privacidade')}</a>.
          </span>
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" size="lg" block loading={loading}>{t('Enviar pedido')}</Button>
        </div>
      </form>
    </AuthLayout>
  );
}
