import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { mznToCents } from '../../utils/money';
import { Card, CardHead, Button, Badge, Input, PageHead, Table, EmptyState, Skeleton, useToast } from '../../components/ui';
import { Users } from 'lucide-react';

/* TRABALHADORES — registo + folha salarial + teste WhatsApp.
   Logica intacta da versao anterior; so o visual passou ao padrao Genesis. */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Employees() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState({ employeeCount: 0, monthlyTotal: 0, averageSalary: 0, employees: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', role: 'Vendedor', monthly_salary: 2500, phone: '', start_date: new Date().toISOString().slice(0, 10) });
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Teste de alerta Genesis');

  const load = async () => {
    setLoading(true);
    try {
      const [employeesRes, payrollRes] = await Promise.all([
        api.get('/api/owner/employees'),
        api.get('/api/owner/payroll')
      ]);
      setEmployees(employeesRes.data || []);
      setPayroll(payrollRes.data || { employeeCount: 0, monthlyTotal: 0, averageSalary: 0, employees: [] });
    } catch { toast.push('Erro ao carregar trabalhadores ou folha salarial.', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const monthlyTotal = useMemo(() => payroll.monthlyTotal || employees.reduce((sum, emp) => sum + Number(emp.monthly_salary || 0), 0), [employees, payroll]);
  const activeCount = payroll.employeeCount || employees.filter((emp) => emp.is_active !== false).length;

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/owner/employees', { ...form, monthly_salary: mznToCents(form.monthly_salary) });
      setForm({ name: '', role: 'Vendedor', monthly_salary: 2500, phone: '', start_date: new Date().toISOString().slice(0, 10) });
      toast.push('Trabalhador registado com sucesso.', 'ok');
      await load();
    } catch (err) { toast.push(err?.response?.data?.error || 'Erro ao registar trabalhador.', 'err'); }
    finally { setSaving(false); }
  };

  const handleWhatsAppTest = async () => {
    if (!testPhone || !testMessage) { toast.push('Preenche telefone e mensagem para testar o WhatsApp.', 'warn'); return; }
    try {
      const res = await api.post('/api/owner/whatsapp/test', { phone: testPhone, message: testMessage });
      toast.push(res.data?.ok ? 'Mensagem enviada com sucesso ou em fila de envio.' : 'Teste de WhatsApp concluido.', 'ok');
    } catch (err) { toast.push(err?.response?.data?.error || 'Erro ao testar WhatsApp.', 'err'); }
  };

  return (
    <div className="g-page">
      <PageHead title="Trabalhadores" sub="Equipa, folha salarial e alertas WhatsApp"
        actions={<Button variant="ghost" onClick={load}>Atualizar</Button>} />
      <div className="g-kpis" style={{ marginBottom: 24 }}>
        <Card tight><div className="g-stat"><span className="g-stat-label">Trabalhadores activos</span><span className="g-stat-value">{activeCount}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Folha mensal</span><span className="g-stat-value">{MZN(monthlyTotal)}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Media salarial</span><span className="g-stat-value">{MZN(payroll.averageSalary || 0)}</span></div></Card>
      </div>
      <div className="g-cols-2" style={{ marginBottom: 24 }}>
        <Card>
          <CardHead title="Registar trabalhador" hint="O salario entra no relatorio mensal" />
          <form onSubmit={handleCreate} style={{ display: 'grid', gap: 14 }}>
            <Input label="Nome" placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Funcao" placeholder="Ex: Vendedor" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <Input label="Salario mensal (MZN)" type="number" min="0" step="0.01" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} />
              <Input label="Data de inicio" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <Input label="Telefone" placeholder="Ex: 84 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div><Button variant="primary" type="submit" disabled={saving}>{saving ? 'A guardar...' : 'Guardar trabalhador'}</Button></div>
          </form>
        </Card>
        <Card>
          <CardHead title="Teste de WhatsApp" hint="Verifica se os alertas chegam ao teu numero" />
          <div style={{ display: 'grid', gap: 14 }}>
            <Input label="Numero de destino" placeholder="+2588xxxxxxx" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
            <label><span className="g-label">Mensagem</span>
              <textarea className="g-input" rows={3} placeholder="Mensagem para enviar" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} style={{ resize: 'vertical' }} />
            </label>
            <div><Button variant="primary" onClick={handleWhatsAppTest}>Enviar teste</Button></div>
          </div>
        </Card>
      </div>
      <Card tight>
        <div style={{ padding: '14px 16px 0' }}><CardHead title="Lista de trabalhadores" /></div>
        {loading ? <div style={{ padding: 16 }}><Skeleton height={160} /></div> : (
          <Table rowKey={(r) => r.id} rows={employees}
            empty={<EmptyState icon={<Users size={26} aria-hidden="true" />} title="Sem trabalhadores" hint="Regista o primeiro trabalhador no formulario acima." />}
            columns={[
              { key: 'name', label: 'Nome', render: (r) => (<div><div style={{ fontWeight: 700 }}>{r.name}</div><div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{r.role || '—'} · {r.phone || 'Sem telefone'}</div></div>) },
              { key: 'monthly_salary', label: 'Salario', align: 'right', numeric: true, render: (r) => MZN(r.monthly_salary) },
              { key: 'is_active', label: 'Estado', render: (r) => <Badge tone={r.is_active === false ? 'neutral' : 'ok'}>{r.is_active === false ? 'INACTIVO' : 'ACTIVO'}</Badge> },
            ]} />
        )}
      </Card>
      <div style={{ height: 28 }} />
    </div>
  );
}
