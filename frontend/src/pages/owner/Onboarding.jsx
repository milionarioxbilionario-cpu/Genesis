import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, LogOut, Plus, Trash2 } from 'lucide-react';
import api, { announceEstablishmentChange, saveLanguage } from '../../utils/api';
import { money, errorMessage } from '../../utils/format';
import { useSession } from '../../utils/session';
import { useI18n } from '../../i18n/react';
import '../../i18n/en/auth';
import '../../i18n/en/owner';
import { BrandMark, Alert, Button, Card, Input, LanguageSwitch, MoneyInput, Spinner, cx } from '../../components/ui';
import { BUSINESS_TYPES } from '../auth/RequestAccount';
import HoursEditor, { DEFAULT_SCHEDULE, scheduleFrom } from '../../components/HoursEditor';
import LocationCard from './LocationCard';

// Nomes dos passos em portugues = chave da traducao.
const STEPS = ['Tipo de negócio', 'Categorias adicionais', 'Catálogo', 'Custos e equipa', 'Horário'];

// Especificacao 6.1 — passo 3 (onboarding self-service em 5 etapas).
// Valores escritos em MZN, guardados em centavos (MoneyInput).
export default function Onboarding() {
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [mainType, setMainType] = useState('bottle_store');
  const [extraTypes, setExtraTypes] = useState([]);
  const [catalog, setCatalog] = useState(null);
  // 31/10 (R1): o catalogo pode vir do Genesis (sugerido) ou de outro estabelecimento do dono.
  const [source, setSource] = useState('master');
  const [others, setOthers] = useState([]);
  useEffect(() => { api.get('/api/establishments', { silent: true }).then(({ data }) => setOthers(data.filter((e) => !e.is_current && e.onboarding_completed))).catch(() => {}); }, []);
  const [rent, setRent] = useState(0);
  // 27/10 (fundador): as linhas comecam abertas, com exemplos — so com o botao «+» ninguem percebia para que serviam.
  const [costs, setCosts] = useState([{ description: '', amount: 0 }]);
  const [employees, setEmployees] = useState([{ name: '', role: '', salary: 0 }]);
  const [suppliers, setSuppliers] = useState([{ name: '', phone: '', delivery: 0 }]);
  // 31/10: horario por dia, 24 h, depois da meia-noite (components/HoursEditor.jsx).
  const [hours, setHours] = useState({ schedule: DEFAULT_SCHEDULE });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const barcodeRefs = useRef(new Map());

  // 31/10: o que ja escreveu fica guardado neste aparelho (por estabelecimento):
  // sair a meio, voltar ao principal ou a rede cair nao apaga nada.
  const draftKey = user?.tenant_id ? 'genesis.onboarding.' + user.tenant_id : null;
  const restored = useRef(false);
  useEffect(() => {
    if (!draftKey || restored.current) return;
    restored.current = true;
    let d = null;
    try { d = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { d = null; }
    if (d && typeof d === 'object') {
      if (d.mainType) setMainType(d.mainType);
      if (Array.isArray(d.extraTypes)) setExtraTypes(d.extraTypes);
      if (Array.isArray(d.catalog)) setCatalog(d.catalog);
      if (typeof d.rent === 'number') setRent(d.rent);
      if (Array.isArray(d.costs)) setCosts(d.costs);
      if (Array.isArray(d.employees)) setEmployees(d.employees);
      if (Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
      if (d.hours) setHours({ schedule: scheduleFrom(d.hours) });
      if (Number.isInteger(d.step)) setStep(d.step);
      return;
    }
    // Sem rascunho: o tipo escolhido ao criar o estabelecimento (ou no pedido de conta) ja vem marcado.
    api.get('/api/settings', { silent: true }).then(({ data }) => {
      const bt = data?.store?.business_type;
      if (bt && BUSINESS_TYPES.some((b) => b.value === bt)) setMainType(bt);
    }).catch(() => {});
  }, [draftKey]);
  useEffect(() => {
    if (!draftKey || !restored.current) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ step, mainType, extraTypes, catalog, rent, costs, employees, suppliers, hours })); } catch { /* aparelho sem espaco: segue sem rascunho */ }
  }, [draftKey, step, mainType, extraTypes, catalog, rent, costs, employees, suppliers, hours]);
  const clearDraft = () => { try { if (draftKey) localStorage.removeItem(draftKey); } catch { /* nada */ } };

  // Voltar ao estabelecimento principal a meio (o rascunho fica guardado).
  const isExtra = Boolean(user?.home_tenant_id && user.tenant_id && user.tenant_id !== user.home_tenant_id);
  async function goHome() {
    try {
      await api.post('/api/establishments/home');
      announceEstablishmentChange(user.home_tenant_id);
      window.location.assign('/app');
    } catch (err) { setError(errorMessage(err)); }
  }

  // Catalogo pre-definido (master_catalogs) do tipo principal + adicionais.
  useEffect(() => {
    if (step !== 2 || catalog) return;
    const types = [mainType, ...extraTypes.filter((x) => x !== mainType)];
    setCatalogError('');
    if (source !== 'master') {
      api.get('/api/establishments/' + source + '/catalog').then(({ data }) => setCatalog(data.map((p, i) => ({ key: 'c' + i + '-' + p.name.toLowerCase(), include: true, name: p.name, category: p.category || 'Geral', sell: Math.round(Number(p.price_mzn || 0) * 100), cost: Math.round(Number(p.cost_mzn || 0) * 100), stock: '0', barcode: p.barcode || '', image_url: p.image_url || null, icon: p.icon || null, unit: p.unit, vat_rate: p.vat_rate, min_stock: p.min_stock, has_expiry: p.has_expiry }))))
        .catch((err) => { setCatalogError(errorMessage(err)); setCatalog([]); });
      return;
    }
    Promise.all(types.map((x) => api.get('/api/catalogs/' + x).then((r) => r.data.template.sampleProducts).catch(() => null)))
      .then((lists) => {
        if (lists.every((l) => l === null)) setCatalogError('Não foi possível carregar o catálogo sugerido. Pode acrescentar produtos à mão ou voltar e tentar de novo.');
        const seen = new Set();
        const rows = [];
        for (const p of lists.filter(Boolean).flat()) {
          const key = p.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ key, include: true, name: p.name, category: p.category || 'Geral', sell: Math.round(Number(p.price_mzn || 0) * 100), cost: Math.round(Number(p.cost_mzn || 0) * 100), stock: String(p.stock || 0), barcode: p.barcode || '', image_url: p.image_url || null, icon: p.icon || null });
        }
        setCatalog(rows);
      });
  }, [step, catalog, mainType, extraTypes, source]);

  const included = useMemo(() => (catalog || []).filter((p) => p.include && p.name.trim() && p.sell > 0), [catalog]);
  const updateRow = (key, patch) => setCatalog((c) => c.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  // O mesmo codigo em dois produtos: o leitor do balcao nao saberia qual somar.
  const duplicateBarcodes = useMemo(() => {
    const count = new Map();
    for (const p of included) if (p.barcode.trim()) count.set(p.barcode.trim(), (count.get(p.barcode.trim()) || 0) + 1);
    return new Set([...count].filter(([, n]) => n > 1).map(([code]) => code));
  }, [included]);

  // O leitor USB escreve o codigo e envia Enter: salta para a linha seguinte.
  function onBarcodeKey(e, index) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const next = catalog[index + 1];
    if (next) barcodeRefs.current.get(next.key)?.focus();
  }

  async function finish() {
    setSaving(true); setError('');
    try {
      // 31/10: tudo num so pedido (tudo ou nada). Antes eram 6+ pedidos e, se um
      // falhava, «Concluir» outra vez duplicava a renda, os custos e a equipa.
      await api.post('/api/onboarding/complete', {
        business_type: mainType,
        products: included.map((p) => ({ name: p.name.trim(), price_mzn: p.sell / 100, cost_mzn: p.cost / 100, stock: Number(p.stock) || 0, category: p.category, barcode: p.barcode.trim() || null, image_url: p.image_url, icon: p.icon || null, unit: p.unit, vat_rate: p.vat_rate, min_stock: p.min_stock, has_expiry: p.has_expiry })),
        rent,
        costs: costs.filter((x) => x.description.trim() && x.amount > 0).map((c) => ({ description: c.description.trim(), amount: c.amount })),
        employees: employees.filter((x) => x.name.trim() && x.role.trim()).map((e) => ({ name: e.name.trim(), role: e.role.trim(), monthly_salary: e.salary })),
        suppliers: suppliers.filter((x) => x.name.trim()).map((x) => ({ name: x.name.trim(), phone: x.phone.trim() || null, delivery_cost_per_visit: x.delivery })),
        hours,
      });
      clearDraft();
      navigate('/app', { replace: true });
    } catch (err) {
      // Ja estava configurado (ex.: o 1.o clique chegou e a resposta perdeu-se): segue.
      if (err?.response?.data?.code === 'ONBOARDING_DONE') { clearDraft(); navigate('/app', { replace: true }); return; }
      setError(errorMessage(err));
    } finally { setSaving(false); }
  }

  const canNext = step !== 2 || (catalog && included.length > 0 && duplicateBarcodes.size === 0);

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-14 items-center gap-2.5 border-b border-border bg-surface px-6">
        <BrandMark />
        <span className="min-w-0 truncate font-semibold text-ink">{t('Configurar o estabelecimento')}{user?.tenant?.name ? ' · ' + user.tenant.name : ''}</span>
        <span className="ml-auto flex items-center gap-1">
          {isExtra && <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={goHome}><span className="hidden sm:inline">{t('Voltar ao estabelecimento principal')}</span></Button>}
          <LanguageSwitch onChange={saveLanguage} />
          <Button variant="ghost" size="sm" icon={LogOut} onClick={logout} aria-label={t('Sair')}><span className="hidden sm:inline">{t('Sair')}</span></Button>
        </span>
      </header>
      <div className={cx('mx-auto px-4 py-8', step === 2 ? 'max-w-5xl' : 'max-w-3xl')}>
        <ol className="mb-8 grid grid-cols-5 gap-2" aria-label={t('Progresso')}>
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col gap-2">
              <span className={cx('h-1 rounded-full', i <= step ? 'bg-accent' : 'bg-muted-bg')} />
              <span className={cx('hidden text-xs sm:block', i === step ? 'font-medium text-ink' : 'text-ink-muted')}>{i + 1}. {t(s)}</span>
            </li>
          ))}
        </ol>

        {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

        {step === 0 && (
          <Section title={t('Que tipo de negócio tem?')} description={t('Carregamos um catálogo de produtos adequado.')}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BUSINESS_TYPES.map((b) => (
                <Choice key={b.value} icon={b.icon} checked={mainType === b.value} onClick={() => { setMainType(b.value); setExtraTypes((x) => x.filter((v) => v !== b.value)); setCatalog(null); }}>{t(b.label)}</Choice>
              ))}
            </div>
            {BUSINESS_TYPES.find((b) => b.value === mainType)?.pending && (
              <Alert tone="info" className="mt-4">{t('O Genesis está a preparar um modo próprio para este tipo de negócio. Por agora já pode vender, controlar o stock e ver os relatórios com o terminal de vendas; quando o modo próprio ficar pronto, passa para ele sem perder nada.')}</Alert>
            )}
          </Section>
        )}

        {step === 1 && (
          <Section title={t('Vende também outra coisa?')} description={t('Opcional. Ex.: bottle store com churrascaria.')}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BUSINESS_TYPES.filter((b) => b.value !== mainType && b.value !== 'outro' && !b.pending).map((b) => (
                <Choice key={b.value} icon={b.icon} checked={extraTypes.includes(b.value)} onClick={() => { setExtraTypes((x) => (x.includes(b.value) ? x.filter((v) => v !== b.value) : [...x, b.value])); setCatalog(null); }}>{t(b.label)}</Choice>
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title={t('O seu catálogo')} description={t('Preços sugeridos para Moçambique — confirme-os com os seus. Desmarque o que não vende. Se tiver leitor de código de barras, clique na coluna “Código de barras” e passe cada produto no leitor: salta sozinho para a linha seguinte.')}>
            {others.length > 0 && (
              <Card className="mb-4">
                <p className="mb-2 font-medium text-ink">{t('De onde vêm os produtos?')}</p>
                <div className="flex flex-col gap-2">
                  <Choice checked={source === 'master'} onClick={() => { setSource('master'); setCatalog(null); }}>{t('Catálogo sugerido pelo Genesis para este tipo de negócio')}</Choice>
                  {others.map((e) => <Choice key={e.id} checked={source === e.id} onClick={() => { setSource(e.id); setCatalog(null); }}>{t('Copiar os produtos de {name}', { name: e.name })}</Choice>)}
                </div>
              </Card>
            )}
            {!catalog ? <div className="flex justify-center py-10"><Spinner /></div> : (
              <>
                {catalogError && <Alert tone="warning" className="mb-3">{t(catalogError)}</Alert>}
                <Card padded={false} className="divide-y divide-border">
                  <div className="hidden gap-3 px-4 py-2 text-xs font-medium text-ink-muted sm:grid sm:grid-cols-[16px_minmax(0,1fr)_150px_110px_110px_64px]">
                    <span /><span>{t('Produto')}</span><span>{t('Código de barras')}</span><span className="text-right">{t('Preço de venda')}</span><span className="text-right">{t('Custo')}</span><span className="text-right">{t('Stock')}</span>
                  </div>
                  {catalog.map((p, i) => {
                    const dup = p.include && p.barcode.trim() && duplicateBarcodes.has(p.barcode.trim());
                    const newGroup = i === 0 || catalog[i - 1].category !== p.category;
                    return (
                      <React.Fragment key={p.key}>
                      {newGroup && <div className="bg-subtle px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">{p.category}</div>}
                      <div className={cx('grid grid-cols-[16px_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[16px_minmax(0,1fr)_150px_110px_110px_64px]', !p.include && 'opacity-50')}>
                        <input type="checkbox" aria-label={t('Incluir {name}', { name: p.name })} className="h-4 w-4 accent-[color:var(--accent)]" checked={p.include} onChange={(e) => updateRow(p.key, { include: e.target.checked })} />
                        <div className="flex min-w-0 items-center gap-2">
                          {p.image_url && <img src={p.image_url} alt="" className="h-9 w-9 shrink-0 rounded object-contain" loading="lazy" />}
                          <Input aria-label={t('Nome')} value={p.name} onChange={(e) => updateRow(p.key, { name: e.target.value })} className="min-w-0 flex-1" />
                        </div>
                        <Input
                          aria-label={t('Código de barras de {name}', { name: p.name })}
                          placeholder={t('Ler ou escrever')}
                          inputMode="numeric"
                          value={p.barcode}
                          ref={(el) => { if (el) barcodeRefs.current.set(p.key, el); else barcodeRefs.current.delete(p.key); }}
                          onChange={(e) => updateRow(p.key, { barcode: e.target.value.replace(/[^0-9A-Za-z-]/g, '') })}
                          onKeyDown={(e) => onBarcodeKey(e, i)}
                          className="col-start-2 sm:col-start-auto"
                          inputClassName="num"
                          aria-invalid={Boolean(dup)}
                        />
                        <MoneyInput aria-label={t('Preço de venda')} valueCents={p.sell} onChangeCents={(v) => updateRow(p.key, { sell: v })} className="col-start-2 sm:col-start-auto" />
                        <MoneyInput aria-label={t('Custo')} valueCents={p.cost} onChangeCents={(v) => updateRow(p.key, { cost: v })} className="col-start-2 sm:col-start-auto" />
                        <Input aria-label={t('Stock')} inputMode="numeric" value={p.stock} onChange={(e) => updateRow(p.key, { stock: e.target.value.replace(/\D/g, '') })} className="col-start-2 sm:col-start-auto" inputClassName="num text-right" />
                      </div>
                      </React.Fragment>
                    );
                  })}
                </Card>
                {duplicateBarcodes.size > 0 && <Alert tone="danger" className="mt-3">{t('O código {c} está em mais do que um produto. Cada código só pode pertencer a um produto.', { c: [...duplicateBarcodes][0] })}</Alert>}
                <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
                  <span>{t('{n} produto(s) a importar · {b} com código de barras.', { n: included.length, b: included.filter((p) => p.barcode.trim()).length })}</span>
                  <Button size="sm" icon={Plus} onClick={() => setCatalog((c) => [...c, { key: 'novo-' + Date.now(), include: true, name: '', category: 'Geral', sell: 0, cost: 0, stock: '0', barcode: '', image_url: null }])}>{t('Produto')}</Button>
                </div>
              </>
            )}
          </Section>
        )}

        {step === 3 && (
          <Section title={t('Custos fixos e equipa')} description={t('No fim de cada mês, o Genesis tira ao que vendeu tudo o que o negócio paga: salários, renda, luz e água, limpeza, as entregas dos fornecedores e o que mais quiser (até o combustível do seu carro). O que sobra é o dinheiro que fica mesmo para si — já sem nada para pagar.')}>
            <Alert tone="info" className="mb-4">{t('Sem isto, o Genesis mostra quanto vendeu e quanto ganhou nos produtos, mas os salários, a renda e as outras despesas teria de os tirar à mão. Com isto preenchido, ele faz essa conta por si e mostra, por exemplo: «4 000 MT foram para a entrega dos refrescos; ficam-lhe 31 500 MT». Pode deixar em branco e preencher depois em Definições.')}</Alert>
            <Card>
              <MoneyInput label={t('Renda mensal do local')} hint={t('Deixe a zero se o espaço é seu.')} valueCents={rent} onChangeCents={setRent} className="max-w-xs" />
              <h3 className="mb-1 mt-5 text-sm font-medium text-ink-2">{t('Outros custos mensais')}</h3>
              <p className="mb-2 text-sm text-ink-muted">{t('O que paga todos os meses além da renda. Escreva o que é e quanto custa por mês.')}</p>
              {costs.map((c, i) => (
                <div key={i} className="mb-2 grid grid-cols-[minmax(0,1fr)_160px_auto] gap-2">
                  <Input aria-label={t('Descrição')} placeholder={t('Ex.: Luz e água')} value={c.description} onChange={(e) => setCosts((x) => x.map((y, j) => (j === i ? { ...y, description: e.target.value } : y)))} />
                  <MoneyInput aria-label={t('Valor')} valueCents={c.amount} onChangeCents={(v) => setCosts((x) => x.map((y, j) => (j === i ? { ...y, amount: v } : y)))} />
                  <Button variant="ghost" aria-label={t('Remover')} icon={Trash2} onClick={() => setCosts((x) => x.filter((_, j) => j !== i))} />
                </div>
              ))}
              <Button size="sm" icon={Plus} onClick={() => setCosts((x) => [...x, { description: '', amount: 0 }])}>{t('Custo')}</Button>
              <h3 className="mb-1 mt-5 text-sm font-medium text-ink-2">{t('Trabalhadores com salário fixo')}</h3>
              <p className="mb-2 text-sm text-ink-muted">{t('Quem trabalha consigo e quanto recebe por mês: o nome, o que faz e o salário.')}</p>
              {employees.map((e, i) => (
                <div key={i} className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_auto] gap-2">
                  <Input aria-label={t('Nome')} placeholder={t('Ex.: João Mabunda')} value={e.name} onChange={(ev) => setEmployees((x) => x.map((y, j) => (j === i ? { ...y, name: ev.target.value } : y)))} />
                  <Input aria-label={t('Função')} placeholder={t('Ex.: Ajudante de balcão')} value={e.role} onChange={(ev) => setEmployees((x) => x.map((y, j) => (j === i ? { ...y, role: ev.target.value } : y)))} />
                  <MoneyInput aria-label={t('Salário')} placeholder={t('Salário')} valueCents={e.salary} onChangeCents={(v) => setEmployees((x) => x.map((y, j) => (j === i ? { ...y, salary: v } : y)))} />
                  <Button variant="ghost" aria-label={t('Remover')} icon={Trash2} onClick={() => setEmployees((x) => x.filter((_, j) => j !== i))} />
                </div>
              ))}
              <Button size="sm" icon={Plus} onClick={() => setEmployees((x) => [...x, { name: '', role: '', salary: 0 }])}>{t('Trabalhador')}</Button>
              <h3 className="mb-1 mt-5 text-sm font-medium text-ink-2">{t('Fornecedores')}</h3>
              <p className="mb-2 text-sm text-ink-muted">{t('Quem lhe traz o stock. O custo de cada entrega entra no lucro do mês; o WhatsApp serve para lhe enviar a lista de compras.')}</p>
              {suppliers.map((s, i) => (
                <div key={i} className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_auto] gap-2">
                  <Input aria-label={t('Nome do fornecedor')} placeholder={t('Ex.: Distribuidora CDM')} value={s.name} onChange={(e) => setSuppliers((x) => x.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} />
                  <Input aria-label={t('WhatsApp do fornecedor')} placeholder="WhatsApp" inputMode="tel" value={s.phone} onChange={(e) => setSuppliers((x) => x.map((y, j) => (j === i ? { ...y, phone: e.target.value } : y)))} />
                  <MoneyInput aria-label={t('Custo por entrega')} placeholder={t('Custo por entrega')} valueCents={s.delivery} onChangeCents={(v) => setSuppliers((x) => x.map((y, j) => (j === i ? { ...y, delivery: v } : y)))} />
                  <Button variant="ghost" aria-label={t('Remover')} icon={Trash2} onClick={() => setSuppliers((x) => x.filter((_, j) => j !== i))} />
                </div>
              ))}
              <Button size="sm" icon={Plus} onClick={() => setSuppliers((x) => [...x, { name: '', phone: '', delivery: 0 }])}>{t('Fornecedor')}</Button>
              <p className="mt-4 text-sm text-ink-muted">{t('Os caixistas e os seus PINs criam-se depois em Equipa.')}</p>
            </Card>
          </Section>
        )}

        {step === 4 && (
          <Section title={t('Horário de funcionamento')} description={t('Para que serve: à hora de fecho o Genesis prepara o relatório do dia (o que se vendeu, quem vendeu, o que faltou). Pode mudar depois em Definições.')}>
            <Card>
              <HoursEditor value={hours.schedule} onChange={(schedule) => setHours({ schedule })} />
              <div className="mt-5 border-t border-border pt-4 text-sm text-ink-2">
                <p>{t('Resumo: {p} produto(s) · renda {r} · {e} trabalhador(es) · {s} fornecedor(es).', { p: included.length, r: money(rent), e: employees.filter((x) => x.name.trim()).length, s: suppliers.filter((x) => x.name.trim()).length })}</p>
              </div>
            </Card>
            {/* 31/10 (fundador): a localizacao pede-se ao criar, com o aviso de que e importante. */}
            <div className="mt-4"><LocationCard s={{ geo: null, store: {} }} compact /></div>
          </Section>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>{t('Voltar')}</Button>
          {step < STEPS.length - 1
            ? <Button variant="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>{t('Continuar')}</Button>
            : <Button variant="primary" loading={saving} onClick={finish}>{t('Concluir e entrar')}</Button>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }) {
  return (
    <section>
      <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
      {description && <p className="mb-5 mt-1 text-base text-ink-muted">{description}</p>}
      {children}
    </section>
  );
}

function Choice({ checked, onClick, children, icon: Icon }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={checked} className={cx('flex h-12 items-center justify-between rounded-lg border px-4 text-left text-base transition-colors', checked ? 'border-accent bg-accent-soft text-ink' : 'border-border bg-surface text-ink-2 hover:border-border-strong')}>
      <span className="flex items-center gap-3">{Icon && <Icon size={18} className={checked ? 'text-accent' : 'text-ink-muted'} aria-hidden="true" />}{children}</span>
      {checked && <Check size={16} className="text-accent" />}
    </button>
  );
}
