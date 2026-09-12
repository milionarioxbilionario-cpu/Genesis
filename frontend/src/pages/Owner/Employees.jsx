import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const currency = (value) => `MZN ${(Number(value || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState({ employeeCount: 0, monthlyTotal: 0, averageSalary: 0, employees: [] });
  const [form, setForm] = useState({
    name: '',
    role: 'Vendedor',
    monthly_salary: 250000,
    phone: '',
    start_date: new Date().toISOString().slice(0, 10)
  });
  const [message, setMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Teste de alerta Genesis');

  const load = async () => {
    try {
      const [employeesRes, payrollRes] = await Promise.all([
        api.get('/api/owner/employees'),
        api.get('/api/owner/payroll')
      ]);
      setEmployees(employeesRes.data || []);
      setPayroll(payrollRes.data || { employeeCount: 0, monthlyTotal: 0, averageSalary: 0, employees: [] });
    } catch (e) {
      console.error(e);
      setMessage('Erro ao carregar trabalhadores ou salário.');
    }
  };

  useEffect(() => { load(); }, []);

  const monthlyTotal = useMemo(() => payroll.monthlyTotal || employees.reduce((sum, emp) => sum + Number(emp.monthly_salary || 0), 0), [employees, payroll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/owner/employees', {
        ...form,
        monthly_salary: Number(form.monthly_salary || 0),
      });
      setForm({ name: '', role: 'Vendedor', monthly_salary: 250000, phone: '', start_date: new Date().toISOString().slice(0, 10) });
      setMessage('Trabalhador registado com sucesso.');
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Erro ao registar trabalhador.');
    }
  };

  const handleWhatsAppTest = async () => {
    if (!testPhone || !testMessage) {
      setMessage('Preencha telefone e mensagem para testar o WhatsApp.');
      return;
    }

    try {
      const res = await api.post('/api/owner/whatsapp/test', { phone: testPhone, message: testMessage });
      setMessage(res.data?.ok ? 'Mensagem enviada com sucesso ou em fila de envio.' : 'Teste de WhatsApp concluído.');
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Erro ao testar WhatsApp.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Trabalhadores & Payroll</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Trabalhadores ativos</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{payroll.employeeCount || employees.filter((emp) => emp.is_active !== false).length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Folha mensal</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{currency(monthlyTotal)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-slate-500">Média salarial</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{currency(payroll.averageSalary || 0)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-4">
          <h3 className="text-lg font-bold mb-3">Registar trabalhador</h3>
          {message && <div className="mb-3 rounded-xl bg-amber-50 p-2 text-sm text-amber-900">{message}</div>}
          <form onSubmit={handleCreate} className="space-y-3">
            <input className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Função" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Salário mensal" value={form.monthly_salary} onChange={(e) => setForm({ ...form, monthly_salary: e.target.value })} />
              <input type="date" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <input className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white">Guardar trabalhador</button>
          </form>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h3 className="text-lg font-bold mb-3">Teste de WhatsApp</h3>
          <div className="space-y-3">
            <input className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="+2588xxxxxxx" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
            <textarea className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" rows={3} placeholder="Mensagem para enviar" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
            <button type="button" onClick={handleWhatsAppTest} className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white">Enviar teste</button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-lg font-bold mb-3">Lista de trabalhadores</h3>
        {employees.length === 0 ? (
          <div className="text-slate-500">Sem trabalhadores registados</div>
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => (
              <div key={emp.id} className="flex flex-col gap-1 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{emp.name}</div>
                  <div className="text-sm text-slate-500">{emp.role} • {emp.phone || 'Sem telefone'}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{currency(emp.monthly_salary)}</div>
                  <div className="text-xs text-slate-500">{emp.is_active === false ? 'Inativo' : 'Ativo'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
