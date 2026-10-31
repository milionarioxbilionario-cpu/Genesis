import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import api from '../utils/api';
import { useSession } from '../utils/session';
import { useI18n } from '../i18n/react';
import { Button, Dialog } from './ui';

// E2 (31/10/2026): uma vez por conta (neste aparelho), quando o dono passa a ter
// 2 ou mais estabelecimentos: o Painel geral e o Hub ficam activos.
export default function GroupCongrats() {
  const { user } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const key = 'genesis.group.congrats.' + (user?.id || '');
  useEffect(() => {
    if (!user || user.role !== 'owner' || user.scope) return;
    try { if (localStorage.getItem(key)) return; } catch { return; }
    api.get('/api/establishments', { silent: true }).then(({ data }) => { if (Array.isArray(data) && data.length > 1) setOpen(true); }).catch(() => {});
  }, [user, key]);
  const close = () => { try { localStorage.setItem(key, '1'); } catch { /* sem armazenamento */ } setOpen(false); };
  return (
    <Dialog open={open} onClose={close} title={t('Parabéns!')}
      footer={<><Button onClick={close}>{t('Agora não')}</Button><Button variant="primary" icon={LayoutGrid} onClick={() => { close(); navigate('/geral'); }}>{t('Abrir o Painel geral')}</Button></>}>
      <p className="text-base text-ink-2">{t('Activou o Painel geral e o Hub. Daqui vê todos os seus estabelecimentos juntos, entra em cada um e cria os gerentes.')}</p>
      <p className="mt-2 text-sm text-ink-muted">{t('Ao entrar, o Genesis pergunta em qual estabelecimento quer trabalhar.')}</p>
    </Dialog>
  );
}
