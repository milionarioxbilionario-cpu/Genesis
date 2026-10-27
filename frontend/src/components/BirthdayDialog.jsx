import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import api from '../utils/api';
import { useI18n } from '../i18n/react';
import { Button, Dialog } from './ui';

// Fase 16: no dia do aniversario do dono, ao entrar, uma janela de parabens com o
// estilo da marca a dizer que o presente esta no Perfil. Aparece uma vez por dia
// e por aparelho (o servidor e que decide se e o dia e se ja foi recolhido).
const seenKey = (day) => 'genesis.gift.seen.' + day;
const today = () => new Date().toISOString().slice(0, 10);

export default function BirthdayDialog() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState(null);
  useEffect(() => {
    let alive = true;
    try { if (localStorage.getItem(seenKey(today()))) return undefined; } catch { /* sem armazenamento: mostra */ }
    api.get('/api/profile', { silent: true }).then((r) => { if (alive && r.data?.gift?.available) setName(r.data.name || ''); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  if (name === null) return null;
  const close = () => { try { localStorage.setItem(seenKey(today()), '1'); } catch { /* ignora */ } setName(null); };
  return (
    <Dialog open size="sm" title={t('Parabéns, {name}!', { name: name.split(' ')[0] })} onClose={close}
      footer={<><Button onClick={close}>{t('Depois')}</Button><Button variant="primary" onClick={() => { close(); navigate('/app/perfil'); }}>{t('Ver o presente')}</Button></>}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent"><Gift size={32} aria-hidden="true" /></span>
        <p className="text-md text-ink">{t('Hoje é o seu dia. A equipa Genesis deseja-lhe um ano cheio de boas vendas.')}</p>
        <p className="text-base text-ink-2">{t('O seu presente — 1 mês de Premium — está à sua espera no Perfil.')}</p>
      </div>
    </Dialog>
  );
}
