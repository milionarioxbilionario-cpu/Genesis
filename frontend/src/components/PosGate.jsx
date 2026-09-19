import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CashierDashboard from '../pages/CashierDashboard';
import { getHubSeller, clearHubSeller } from '../utils/hubSession';

// PosGate: o PC do balcao fica estacionado no Hub de Caixistas.
// - cashier autenticado -> abre o POS directamente.
// - owner SEM vendedor activo -> redirect para o Hub (/hub).
// - owner COM vendedor activo (entrou com senha do caixista) -> POS.
// - sem sessao -> /login.
//
// IMPORTANTE: o POS e um ecra PROPRIO — nunca e embrulhado no CRMLayout,
// senao o caixista veria o menu do dono (Visao Geral, Stock, ...).
export default function PosGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [seller, setSeller] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState('');

  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => {
        const r = res.data?.user?.role;
        if (r === 'cashier') setStatus('cashier');
        else if (r === 'owner') {
          const s = getHubSeller();
          setSeller(s);
          setStatus(s ? 'hub-seller' : 'owner');
        } else setStatus('unauthorized');
      })
      .catch(() => setStatus('unauthorized'));
  }, []);

  // Sair do perfil: exige fecho de turno E perfil desbloqueado.
  async function handleLeave() {
    setLeaveMsg('');
    if (!seller) { clearHubSeller(); navigate('/hub'); return; }
    setLeaving(true);
    try {
      const state = await api.get(`/api/owner/cashiers/${seller.id}/shift-state`);
      if (state.data?.locked) {
        setLeaveMsg('Perfil bloqueado por erros no fecho de turno. So o dono pode desbloquear com a senha dele.');
        return;
      }
      if (state.data?.hasOpenSales) {
        setLeaveMsg('Ha vendas de hoje sem fecho de turno. Fecha o turno antes de sair do perfil.');
        return;
      }
      clearHubSeller();
      navigate('/hub');
    } catch (e) {
      setLeaveMsg(e?.response?.data?.error || 'Nao foi possivel verificar o turno.');
    } finally {
      setLeaving(false);
    }
  }

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b1321' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (status === 'unauthorized') return <Navigate to="/login" replace />;
  if (status === 'owner') return <Navigate to="/hub" replace />;
  if (status === 'hub-seller') {
    return (
      <CashierDashboard
        hubSeller={seller}
        onRequestLeave={handleLeave}
        leaving={leaving}
        leaveMsg={leaveMsg}
      />
    );
  }
  return <CashierDashboard />;
}
