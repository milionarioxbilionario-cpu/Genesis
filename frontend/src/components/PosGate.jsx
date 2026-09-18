import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../utils/api';
import CRMLayout from '../layouts/CRMLayout';
import CashierDashboard from '../pages/CashierDashboard';

// PosGate: o PC do balcão fica estacionado no Hub de Caixistas.
// - cashier autenticado -> abre o POS directamente.
// - owner autenticado -> redirecciona para o Hub (/owner/cashiers),
//   onde escolhe o perfil do caixista + senha antes de vender.
// - sem sessão -> /login.
export default function PosGate() {
  const [status, setStatus] = useState('loading'); // loading | cashier | owner | unauthorized
  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => {
        const role = res.data?.user?.role;
        if (role === 'cashier') setStatus('cashier');
        else if (role === 'owner') setStatus('owner');
        else setStatus('unauthorized');
      })
      .catch(() => setStatus('unauthorized'));
  }, []);
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  if (status === 'unauthorized') return <Navigate to="/login" replace />;
  if (status === 'owner') return <Navigate to="/owner/cashiers" replace />;
  return (
    <CRMLayout>
      <CashierDashboard />
    </CRMLayout>
  );
}
