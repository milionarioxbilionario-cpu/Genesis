import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CRMLayout from '../layouts/CRMLayout';
import CashierDashboard from '../pages/CashierDashboard';
import { getHubSeller, clearHubSeller } from '../utils/hubSession';

// PosGate: o PC do balcao fica estacionado no Hub de Caixistas.
// - cashier autenticado -> abre o POS directamente.
// - owner SEM vendedor activo -> redirect para o Hub (/owner/cashiers).
// - owner COM vendedor activo (entrou com senha do caixista) -> POS com
//   banner "A operar como X" + botao Sair (exige fecho de turno).
// - sem sessao -> /login.
export default function PosGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [role, setRole] = useState(null);
  const [seller, setSeller] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveMsg, setLeaveMsg] = useState('');

  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => {
        const r = res.data?.user?.role;
        setRole(r);
        if (r === 'cashier') setStatus('cashier');
        else if (r === 'owner') {
          const s = getHubSeller();
          setSeller(s);
          setStatus(s ? 'hub-seller' : 'owner');
        } else setStatus('unauthorized');
      })
      .catch(() => setStatus('unauthorized'));
  }, []);

  async function handleLeave() {
    setLeaveMsg('');
    if (!seller) { clearHubSeller(); navigate('/owner/cashiers'); return; }
    setLeaving(true);
    try {
      const res = await api.get(`/api/owner/cashiers/${seller.id}/open-shift`);
      if (res.data?.open) {
        setLeaveMsg('Ha vendas de hoje sem fecho de turno. Fecha o turno antes de sair do perfil.');
        return;
      }
      clearHubSeller();
      navigate('/owner/cashiers');
    } catch (e) {
      setLeaveMsg(e?.response?.data?.error || 'Nao foi possivel verificar o turno.');
    } finally {
      setLeaving(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (status === 'unauthorized') return <Navigate to="/login" replace />;
  if (status === 'owner') return <Navigate to="/owner/cashiers" replace />;
  if (status === 'hub-seller') {
    return (
      <CRMLayout>
        <div className="pos-message" style={{ marginBottom: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          A operar como <strong>{seller.name}</strong> (perfil do caixista). As vendas ficam em nome dele; a operacao fica auditada ao dono.
          <button type="button" className="secondary-btn" style={{ marginLeft: 12 }} disabled={leaving} onClick={handleLeave}>
            {leaving ? 'A verificar...' : 'Sair do perfil (exige fecho de turno)'}
          </button>
          {leaveMsg && <div style={{ marginTop: 8 }}>{leaveMsg}</div>}
        </div>
        <CashierDashboard hubSeller={seller} />
      </CRMLayout>
    );
  }
  return (
    <CRMLayout>
      <CashierDashboard />
    </CRMLayout>
  );
}
