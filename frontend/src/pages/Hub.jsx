import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { setHubSeller } from '../utils/hubSession';

// HUB DEDICADO — pagina propria do balcao (estilo Netflix, SEM sidebar).
// O caixista nunca ve o menu do dono: so perfis + senha.
//  - Perfil bloqueado (3 erros no fecho) mostra BLOQUEADO e so abre com a
//    senha do dono (que o desbloqueia).
//  - "Novo caixista" e "Modo do dono" exigem a senha do dono.
const HUB_CSS = `
.hub-card { transition: transform .28s ease, box-shadow .28s ease, border-color .28s ease; }
.hub-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 24px 60px rgba(0,0,0,.55); border-color: rgba(229,9,20,.55) !important; }
.hub-card.locked-card:hover { transform: none; box-shadow: none; border-color: rgba(244,63,94,.6) !important; }
.hub-btn { transition: background .2s ease, transform .2s ease; }
.hub-btn:hover { transform: translateY(-1px); }
`;

export default function Hub() {
  const navigate = useNavigate();
  const [cashiers, setCashiers] = useState([]);
  const [enterId, setEnterId] = useState(null);
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // gate: 'owner' | 'create' | { unlock: '<id>' }
  const [gate, setGate] = useState(null);
  const [ownerPw, setOwnerPw] = useState('');
  const [gateErr, setGateErr] = useState('');
  const [gateBusy, setGateBusy] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });

  async function load() {
    try { const r = await api.get('/api/owner/cashiers'); setCashiers(r.data || []); }
    catch (e) { console.error(e); }
  }
  useEffect(() => { load(); }, []);

  async function enter(c) {
    setMsg(''); setLoading(true);
    try {
      await api.post(`/api/owner/cashiers/${c.id}/verify-password`, { password: pw });
      const op = await api.post(`/api/owner/cashiers/${c.id}/operate`);
      setHubSeller(op.data.cashier);
      navigate('/pos');
    } catch (e) { setMsg(e?.response?.data?.error || 'Senha incorrecta.'); }
    finally { setLoading(false); }
  }

  function openGate(next) { setGate(next); setGateErr(''); setOwnerPw(''); }

  async function submitGate(e) {
    e.preventDefault();
    setGateErr(''); setGateBusy(true);
    try {
      // Verifica a senha do dono SEM trocar de sessao.
      await api.post('/api/owner/verify-password', { password: ownerPw });
      if (gate === 'owner') { navigate('/owner'); return; }
      if (gate === 'create') { setGate(null); setOwnerPw(''); setShowCreate(true); return; }
      if (gate && gate.unlock) {
        await api.post(`/api/owner/cashiers/${gate.unlock}/unlock-shift`, { password: ownerPw });
        setGate(null); setOwnerPw('');
        setMsg('Perfil desbloqueado com a senha do dono.');
        await load();
        return;
      }
      setGate(null); setOwnerPw('');
    } catch (err) {
      setGateErr(err?.response?.data?.error || 'Senha do dono incorrecta.');
    } finally { setGateBusy(false); }
  }

  async function submitCreate(e) {
    e.preventDefault(); setMsg('');
    try {
      await api.post('/api/owner/cashiers', form);
      setForm({ name: '', phone: '', password: '' });
      setShowCreate(false);
      setMsg('Caixista criado. O perfil ja aparece na grelha.');
      await load();
    } catch (err) { setMsg(err?.response?.data?.error || 'Nao foi possivel criar o caixista.'); }
  }

  function clickProfile(c) {
    setMsg('');
    if (c.locked) { openGate({ unlock: c.id }); return; }
    if (c.is_active === false) { setMsg('Este perfil esta inactivo. Reactiva-o no painel do dono.'); return; }
    setEnterId(c.id); setPw(''); setMsg('');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(1200px 600px at 50% -10%, rgba(229,9,20,0.16), transparent), #080b14' }}>
      <style>{HUB_CSS}</style>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 34px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#e50914,#7a1017)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 22 }}>G</div>
          <div>
            <div style={{ color: '#edf2f7', fontWeight: 900, fontSize: 20, letterSpacing: '-0.03em' }}>Genesis</div>
            <div style={{ color: '#64748b', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Hub do Balcao</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="hub-btn" onClick={() => openGate('create')} style={{ padding: '11px 20px', borderRadius: 14, background: '#e50914', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>+ Novo caixista</button>
          <button type="button" className="hub-btn" onClick={() => openGate('owner')} style={{ padding: '11px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(148,163,184,0.15)', color: '#edf2f7', fontWeight: 700, cursor: 'pointer' }}>Modo do dono</button>
        </div>
      </header>
      <main style={{ padding: '36px 34px' }}>
        <h1 style={{ color: '#edf2f7', fontSize: 32, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 6 }}>Quem esta a vender?</h1>
        <p style={{ color: '#64748b', marginBottom: 28 }}>Escolhe o teu perfil e introduz a tua senha para abrir o caixa.</p>
        {msg && <div style={{ marginBottom: 18, padding: '11px 16px', borderRadius: 12, background: 'rgba(122,165,214,0.12)', border: '1px solid rgba(122,165,214,0.32)', color: '#cfe0f5', fontWeight: 600 }}>{msg}</div>}
        {cashiers.length === 0 ? (
          <div style={{ color: '#475569', fontSize: 16 }}>Ainda nao ha caixistas. Usa "+ Novo caixista" acima (pede a senha do dono).</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 22 }}>
            {cashiers.map((c) => {
              const inactive = c.is_active === false;
              const blocked = Boolean(c.locked);
              return (
                <div key={c.id} onClick={() => clickProfile(c)} className={'hub-card' + (blocked ? ' locked-card' : '')} style={{ cursor: inactive && !blocked ? 'not-allowed' : 'pointer', opacity: inactive && !blocked ? 0.35 : 1, borderRadius: 20, background: 'linear-gradient(160deg,#141c2b,#0d1420)', border: blocked ? '1px solid rgba(244,63,94,0.55)' : '1px solid rgba(148,163,184,0.1)', padding: '26px 20px', textAlign: 'center', position: 'relative' }}>
                  {blocked && <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(244,63,94,0.18)', border: '1px solid rgba(244,63,94,0.5)', color: '#fda4af', fontSize: 10.5, fontWeight: 900, letterSpacing: '0.06em' }}>BLOQUEADO</div>}
                  <div style={{ width: 78, height: 78, margin: '0 auto 14px', borderRadius: 20, background: blocked ? 'linear-gradient(135deg,#7f1d1d,#450a0a)' : 'linear-gradient(135deg,#7aa5d6,#3b5a80)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: blocked ? '#fecaca' : '#0a1220', fontWeight: 900, fontSize: 32 }}>{blocked ? '\uD83D\uDD12' : (c.name || '?')[0].toUpperCase()}</div>
                  <div style={{ color: '#edf2f7', fontWeight: 800, fontSize: 16 }}>{c.name}</div>
                  <div style={{ color: blocked ? '#fb7185' : '#64748b', fontSize: 12, marginTop: 4 }}>{blocked ? (c.attempts + ' erros no fecho de turno') : (inactive ? 'Inactivo' : 'Activo')}</div>
                  {enterId === c.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); enter(c); }} onClick={(e) => e.stopPropagation()} style={{ marginTop: 12 }}>
                      <input autoFocus type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Senha deste perfil" className="auth-input" required />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="primary-btn" type="submit" disabled={loading}>Entrar</button>
                        <button className="secondary-btn" type="button" onClick={(e) => { e.stopPropagation(); setEnterId(null); }}>X</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ marginTop: 12, color: blocked ? '#fb7185' : '#7aa5d6', fontSize: 13, fontWeight: 700 }}>{blocked ? 'Abrir com a senha do dono \u2192' : 'Abrir caixa \u2192'}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      {gate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <form onSubmit={submitGate} style={{ background: '#111c2b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 24, padding: 32, width: 400 }}>
            <h3 style={{ color: '#edf2f7', fontWeight: 900, fontSize: 18, marginBottom: 6 }}>{gate === 'create' ? 'Criar novo caixista' : gate === 'owner' ? 'Acesso do dono' : 'Desbloquear perfil'}</h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>{gate === 'create' ? 'So o dono cria caixistas. Introduz a tua senha para continuar.' : gate === 'owner' ? 'Introduz a tua senha para abrir o painel de gestao.' : 'Este perfil foi bloqueado por erros no fecho de turno. Introduz a tua senha para o desbloquear.'}</p>
            <input autoFocus type="password" value={ownerPw} onChange={(e) => setOwnerPw(e.target.value)} placeholder="Senha do dono" className="auth-input" required />
            {gateErr && <div style={{ marginTop: 10, color: '#fda4af', fontSize: 13, fontWeight: 700 }}>{gateErr}</div>}
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="primary-btn" type="submit" disabled={gateBusy}>{gateBusy ? 'A verificar...' : 'Confirmar'}</button>
              <button className="secondary-btn" type="button" onClick={() => setGate(null)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)' }}>
          <form onSubmit={submitCreate} style={{ background: '#111c2b', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 24, padding: 32, width: 440 }}>
            <h3 style={{ color: '#edf2f7', fontWeight: 900, fontSize: 18, marginBottom: 16 }}>Novo caixista</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="auth-input" required />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefone (opcional)" className="auth-input" />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Senha inicial (min. 6)" className="auth-input" required minLength={6} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="primary-btn" type="submit">Criar caixista</button>
              <button className="secondary-btn" type="button" onClick={() => setShowCreate(false)}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
