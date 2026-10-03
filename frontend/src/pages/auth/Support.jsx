import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSession, FullPageSpinner } from '../../utils/session';
import { errorMessage } from '../../utils/format';
import { Alert } from '../../components/ui';
import AuthLayout from './AuthLayout';

// Entrada do Super Admin em MODO SUPORTE (so leitura). O codigo vem no
// fragmento (#) do link gerado no painel admin, que nunca chega a logs de
// servidor nem ao Referer.
export default function Support() {
  const navigate = useNavigate();
  const { reload } = useSession();
  const [error, setError] = useState('');
  const started = useRef(false); // o codigo e de uso unico: nunca o enviar 2x
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = window.location.hash.slice(1);
    window.history.replaceState(null, '', window.location.pathname);
    if (!code) { setError('Link de suporte incompleto.'); return; }
    api.post('/api/auth/support', { code })
      .then(() => reload())
      .then(() => navigate('/app', { replace: true }))
      .catch((err) => setError(errorMessage(err, 'Link de suporte inválido ou expirado.')));
  }, [navigate, reload]);
  if (!error) return <FullPageSpinner />;
  return <AuthLayout title="Modo suporte"><Alert tone="danger">{error} Gere um novo link no painel de administração.</Alert></AuthLayout>;
}
