import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { setHubSeller } from '../../utils/hubSession';

// HUB DE CAIXISTAS (modo quiosque do balcao). O PC fica logado como owner;
// cada perfil pede a SENHA DO CAIXISTA para entrar; sair exige fecho de
// turno; voltar ao menu exige a SENHA DO OWNER.
export default function Cashiers() {
  const navigate = useNavigate();
  const [cashiers, setCashiers] = useState([]);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [enterId, setEnterId] = useState(null);
  const [enterPassword, setEnterPassword] = useState('');
  const [resetId, setResetId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showOwnerGate, setShowOwnerGate] = useState(false);

  async function load() {
    try {
      const res = await api.get('/api/owner/cashiers');
      setCashiers(res.data || []);
    } catch (e) { console.error(e); }
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/api/owner/cashiers', form);
      setForm({ name: '', phone: '', password: '' });
      setMessage('Caixista criado com sucesso.');
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Nao foi possivel criar o caixista.');
    }
  }

  async function handleToggle(c) {
    setMessage('');
    try {
      const action = c.is_active === false ? 'reactivate' : 'deactivate';
      await api.put(`/api/owner/cashiers/${c.id}/${action}`);
      setMessage(c.is_active === false ? 'Caixista reactivado.' : 'Caixista desactivado.');
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Operacao falhou.');
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api.put(`/api/owner/cashiers/${resetId}/password`, { password: resetPassword });
      setResetId(null);
      setResetPassword('');
      setMessage('Senha do caixista redefinida (so o dono ve esta accao).');
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Nao foi possivel redefinir a senha.');
    }
  }

  async function handleEnter(c) {
    setMessage('');
    try {
      const login = await api.post('/api/auth/login', { email: c.email, password: enterPassword });
      if (login.data?.user?.id !== c.id) {
        setMessage('Essa senha nao e deste perfil.');
        return;
      }
      const op = await api.post(`/api/owner/cashiers/${c.id}/operate`);
      setHubSeller(op.data.cashier);
      setEnterId(null);
      setEnterPassword('');
      navigate('/pos');
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Senha do caixista incorrecta.');
    }
  }

  async function handleOwnerGate(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/api/owner/verify-password', { password: ownerPassword });
      setOwnerPassword('');
      setShowOwnerGate(false);
      navigate('/owner');
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Senha do dono incorrecta.');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 className="text-2xl font-bold">Caixistas - Hub do Balcao</h2>
        <button className="secondary-btn" type="button" onClick={() => setShowOwnerGate(true)}>
          Voltar ao menu do dono (pede senha)
        </button>
      </div>
      {message && <div className="pos-message" style={{ marginBottom: 12 }}>{message}</div>}
      {showOwnerGate && (
        <form onSubmit={handleOwnerGate} className="rounded-xl border bg-white p-4" style={{ marginBottom: 16 }}>
          <h3 className="font-bold">Confirmar senha do dono</h3>
          <p className="text-sm">So o dono sai do Hub para o menu. Os caixistas ficam aqui.</p>
          <input type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)}
            placeholder="Senha do dono" className="auth-input" style={{ marginTop: 8 }} required />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="primary-btn" type="submit">Confirmar</button>
            <button className="secondary-btn" type="button" onClick={() => setShowOwnerGate(false)}>Cancelar</button>
          </div>
        </form>
      )}
      <div className="rounded-xl border bg-white p-4" style={{ marginBottom: 16 }}>
        <h3 className="font-bold">Perfis (escolhe para vender)</h3>
        {cashiers.length === 0 ? <div>Sem caixistas - cria o primeiro abaixo.</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 12 }}>
            {cashiers.map((c) => (
              <div key={c.id} className="rounded-xl border p-4" style={{ background: c.is_active === false ? '#f1f5f9' : '#fff' }}>
                <div style={{ fontSize: 40 }}>Perfil</div>
                <div className="font-bold">{c.name}</div>
                <div className="text-sm">{c.is_active === false ? 'Inactivo' : 'Activo'}</div>
                {enterId === c.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleEnter(c); }} style={{ marginTop: 8 }}>
                    <input type="password" value={enterPassword} onChange={(e) => setEnterPassword(e.target.value)}
                      placeholder="Senha deste caixista" className="auth-input" required />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="primary-btn" type="submit">Entrar</button>
                      <button className="secondary-btn" type="button" onClick={() => { setEnterId(null); setEnterPassword(''); }}>X</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button className="primary-btn" type="button" disabled={c.is_active === false}
                      onClick={() => { setEnterId(c.id); setEnterPassword(''); }}>Entrar</button>
                    <button className="secondary-btn" type="button" onClick={() => handleToggle(c)}>
                      {c.is_active === false ? 'Reactivar' : 'Desactivar'}
                    </button>
                    <button className="secondary-btn" type="button" onClick={() => { setResetId(c.id); setResetPassword(''); }}>
                      Nova senha
                    </button>
                  </div>
                )}
                {resetId === c.id && (
                  <form onSubmit={handleReset} style={{ marginTop: 8 }}>
                    <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                      placeholder="Nova senha (min. 6)" className="auth-input" required minLength={6} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="primary-btn" type="submit">Guardar</button>
                      <button className="secondary-btn" type="button" onClick={() => setResetId(null)}>X</button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={handleCreate} className="rounded-xl border bg-white p-4">
        <h3 className="font-bold">Criar novo caixista</h3>
        <div style={{ display: 'grid', gap: 8, marginTop: 8, maxWidth: 420 }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome" className="auth-input" required />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Telefone (opcional)" className="auth-input" />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Senha inicial (min. 6)" className="auth-input" required minLength={6} />
          <button className="primary-btn" type="submit">Criar caixista</button>
        </div>
      </form>
    </div>
  );
}
