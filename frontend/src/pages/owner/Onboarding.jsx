import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { money, errorMessage } from '../../utils/format';
import { useSession } from '../../utils/session';
import { Alert, Button, Card, Input, MoneyInput, Spinner, cx } from '../../components/ui';
import { BUSINESS_TYPES } from '../auth/RequestAccount';

const STEPS = ['Tipo de negócio', 'Categorias adicionais', 'Catálogo', 'Custos e equipa', 'Horário'];

// Especificacao 6.1 — passo 3 (onboarding self-service em 5 etapas).
// Valores escritos em MZN, guardados em centavos (MoneyInput).
export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [step, setStep] = useState(0);
  const [mainType, setMainType] = useState('bottle_store');
  const [extraTypes, setExtraTypes] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [rent, setRent] = useState(0);
  const [costs, setCosts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [hours, setHours] = useState({ opening_time: '08:00', closing_time: '20:00' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Catalogo pre-definido (master_catalogs) do tipo principal + adicionais.
  useEffect(() => {
    if (step !== 2 || catalog) return;
    const types = [mainType, ...extraTypes.filter((t) => t !== mainType)];
    Promise.all(types.map((t) => api.get('/api/catalogs/' + t).then((r) => r.data.template.sampleProducts).catch(() => [])))
      .then((lists) => {
        const seen = new Set();
        const rows = [];
        for (const p of lists.flat()) {
          const key = p.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push({ key, include: true, name: p.name, category: p.category || 'Geral', sell: Math.round(Number(p.price_mzn || 0) * 100), cost: Math.round(Number(p.cost_mzn || 0) * 100), stock: String(p.stock || 0) });
        }
        setCatalog(rows);
      });
  }, [step, catalog, mainType, extraTypes]);

  const included = useMemo(() => (catalog || []).filter((p) => p.include && p.name.trim() && p.sell > 0), [catalog]);
  const updateRow = (key, patch) => setCatalog((c) => c.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  async function finish() {
    setSaving(true); setError('');
    try {
      if (rent > 0) await api.post('/api/settings/fixed-costs', { description: 'Renda', amount: rent, type: 'rent' });
      for (const c of costs.filter((x) => x.description.trim() && x.amount > 0)) await api.post('/api/settings/fixed-costs', { description: c.description.trim(), amount: c.amount, type: 'other' });
      for (const e of employees.filter((x) => x.name.trim() && x.role.trim())) await api.post('/api/owner/employees', { name: e.name.trim(), role: e.role.trim(), monthly_salary: e.salary });
      await api.put('/api/settings/hours', hours);
      // Por ultimo: importa o catalogo e marca o onboarding como concluido.
      await api.post(`/api/catalogs/${mainType}/import`, {
        products: included.map((p) => ({ name: p.name.trim(), price_mzn: p.sell / 100, cost_mzn: p.cost / 100, stock: Number(p.stock) || 0, category: p.category })),
      });
      navigate('/app', { replace: true });
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  const canNext = step !== 2 || (catalog && included.length > 0);

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex h-14 items-center gap-2.5 border-b border-border bg-surface px-6">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
        <span className="font-semibold text-ink">Configurar a loja</span>
        <span className="ml-auto text-sm text-ink-muted">{user?.name}</span>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ol className="mb-8 grid grid-cols-5 gap-2" aria-label="Progresso">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-col gap-2">
              <span className={cx('h-1 rounded-full', i <= step ? 'bg-accent' : 'bg-muted-bg')} />
              <span className={cx('hidden text-xs sm:block', i === step ? 'font-medium text-ink' : 'text-ink-muted')}>{i + 1}. {s}</span>
            </li>
          ))}
        </ol>

        {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

        {step === 0 && (
          <Section title="Que tipo de negócio tem?" description="Carregamos um catálogo de produtos adequado.">
            <div className="grid gap-2 sm:grid-cols-2">
              {BUSINESS_TYPES.map((t) => (
                <Choice key={t.value} checked={mainType === t.value} onClick={() => { setMainType(t.value); setExtraTypes((x) => x.filter((v) => v !== t.value)); setCatalog(null); }}>{t.label}</Choice>
              ))}
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="Vende também outra coisa?" description="Opcional. Ex.: bottle store com churrasqueira.">
            <div className="grid gap-2 sm:grid-cols-2">
              {BUSINESS_TYPES.filter((t) => t.value !== mainType && t.value !== 'outro').map((t) => (
                <Choice key={t.value} checked={extraTypes.includes(t.value)} onClick={() => { setExtraTypes((x) => (x.includes(t.value) ? x.filter((v) => v !== t.value) : [...x, t.value])); setCatalog(null); }}>{t.label}</Choice>
              ))}
            </div>
          </Section>
        )}

        {step === 2 && (
          <Section title="O seu catálogo" description="Desmarque o que não vende e ajuste preços e stock. Pode acrescentar produtos depois.">
            {!catalog ? <div className="flex justify-center py-10"><Spinner /></div> : (
              <>
                <Card padded={false} className="divide-y divide-border">
                  {catalog.map((p) => (
                    <div key={p.key} className={cx('grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_130px_130px_80px]', !p.include && 'opacity-50')}>
                      <input type="checkbox" aria-label={'Incluir ' + p.name} className="h-4 w-4 accent-[color:var(--accent)]" checked={p.include} onChange={(e) => updateRow(p.key, { include: e.target.checked })} />
                      <Input aria-label="Nome" value={p.name} onChange={(e) => updateRow(p.key, { name: e.target.value })} />
                      <MoneyInput aria-label="Preço de venda" valueCents={p.sell} onChangeCents={(v) => updateRow(p.key, { sell: v })} className="col-start-2 sm:col-start-auto" />
                      <MoneyInput aria-label="Custo" valueCents={p.cost} onChangeCents={(v) => updateRow(p.key, { cost: v })} className="col-start-2 sm:col-start-auto" />
                      <Input aria-label="Stock" inputMode="numeric" value={p.stock} onChange={(e) => updateRow(p.key, { stock: e.target.value.replace(/\D/g, '') })} className="col-start-2 sm:col-start-auto" inputClassName="num text-right" />
                    </div>
                  ))}
                </Card>
                <div className="mt-3 flex items-center justify-between text-sm text-ink-muted">
                  <span>Colunas: produto · preço de venda · custo · stock inicial</span>
                  <Button size="sm" icon={Plus} onClick={() => setCatalog((c) => [...c, { key: 'novo-' + Date.now(), include: true, name: '', category: 'Geral', sell: 0, cost: 0, stock: '0' }])}>Produto</Button>
                </div>
                <p className="mt-2 text-sm text-ink-2">{included.length} produto(s) a importar.</p>
              </>
            )}
          </Section>
        )}

        {step === 3 && (
          <Section title="Custos fixos e equipa" description="Entram no relatório mensal para calcular o lucro real.">
            <Card>
              <MoneyInput label="Renda mensal do local" hint="Deixe a zero se o espaço é seu." valueCents={rent} onChangeCents={setRent} className="max-w-xs" />
              <h3 className="mb-2 mt-5 text-sm font-medium text-ink-2">Outros custos mensais</h3>
              {costs.map((c, i) => (
                <div key={i} className="mb-2 grid grid-cols-[minmax(0,1fr)_160px_auto] gap-2">
                  <Input aria-label="Descrição" placeholder="Ex.: Luz, água, transporte" value={c.description} onChange={(e) => setCosts((x) => x.map((y, j) => (j === i ? { ...y, description: e.target.value } : y)))} />
                  <MoneyInput aria-label="Valor" valueCents={c.amount} onChangeCents={(v) => setCosts((x) => x.map((y, j) => (j === i ? { ...y, amount: v } : y)))} />
                  <Button variant="ghost" aria-label="Remover" icon={Trash2} onClick={() => setCosts((x) => x.filter((_, j) => j !== i))} />
                </div>
              ))}
              <Button size="sm" icon={Plus} onClick={() => setCosts((x) => [...x, { description: '', amount: 0 }])}>Custo</Button>
              <h3 className="mb-2 mt-5 text-sm font-medium text-ink-2">Trabalhadores com salário fixo</h3>
              {employees.map((e, i) => (
                <div key={i} className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px_auto] gap-2">
                  <Input aria-label="Nome" placeholder="Nome" value={e.name} onChange={(ev) => setEmployees((x) => x.map((y, j) => (j === i ? { ...y, name: ev.target.value } : y)))} />
                  <Input aria-label="Função" placeholder="Função" value={e.role} onChange={(ev) => setEmployees((x) => x.map((y, j) => (j === i ? { ...y, role: ev.target.value } : y)))} />
                  <MoneyInput aria-label="Salário" valueCents={e.salary} onChangeCents={(v) => setEmployees((x) => x.map((y, j) => (j === i ? { ...y, salary: v } : y)))} />
                  <Button variant="ghost" aria-label="Remover" icon={Trash2} onClick={() => setEmployees((x) => x.filter((_, j) => j !== i))} />
                </div>
              ))}
              <Button size="sm" icon={Plus} onClick={() => setEmployees((x) => [...x, { name: '', role: '', salary: 0 }])}>Trabalhador</Button>
              <p className="mt-4 text-sm text-ink-muted">Os caixistas e os seus PINs criam-se depois em Equipa.</p>
            </Card>
          </Section>
        )}

        {step === 4 && (
          <Section title="Horário de funcionamento" description="Usado no fecho do dia.">
            <Card>
              <div className="grid max-w-sm grid-cols-2 gap-4">
                <Input label="Abertura" type="time" value={hours.opening_time} onChange={(e) => setHours({ ...hours, opening_time: e.target.value })} />
                <Input label="Fecho" type="time" value={hours.closing_time} onChange={(e) => setHours({ ...hours, closing_time: e.target.value })} />
              </div>
              <div className="mt-5 border-t border-border pt-4 text-sm text-ink-2">
                <p>Resumo: {included.length} produto(s) · renda {money(rent)} · {employees.filter((e) => e.name.trim()).length} trabalhador(es).</p>
              </div>
            </Card>
          </Section>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="ghost" disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>Voltar</Button>
          {step < STEPS.length - 1
            ? <Button variant="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continuar</Button>
            : <Button variant="primary" loading={saving} onClick={finish}>Concluir e entrar</Button>}
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

function Choice({ checked, onClick, children }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={checked} className={cx('flex h-12 items-center justify-between rounded-lg border px-4 text-left text-base transition-colors', checked ? 'border-accent bg-accent-soft text-ink' : 'border-border bg-surface text-ink-2 hover:border-border-strong')}>
      {children}
      {checked && <Check size={16} className="text-accent" />}
    </button>
  );
}
