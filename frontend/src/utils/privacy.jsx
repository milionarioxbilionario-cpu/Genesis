import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setMoneyHidden } from './format';

// Modo privado do painel (Fase 13, pedido do fundador): um olho no cabecalho
// esconde todos os valores em dinheiro ("•••• MT") para quem esta ao lado nao
// ver quanto a loja fez. A escolha fica guardada neste aparelho, por conta.
// So o painel do dono: o terminal do caixista e os PDFs nunca escondem.
//
// O estado vive no AppShell (usePrivacyState): mudar redesenha o painel todo,
// e todas as paginas que usam money() passam a esconder ou mostrar.
export const PrivacyContext = createContext({ hidden: false, toggle: () => {} });
const key = (userId) => 'genesis.privado.' + (userId || 'anon');
const read = (k) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };

export function usePrivacyState(userId) {
  const [hidden, setHidden] = useState(() => read(key(userId)));
  useEffect(() => { setHidden(read(key(userId))); }, [userId]);
  // Tem de estar certo ANTES de os filhos se desenharem.
  setMoneyHidden(hidden);
  useEffect(() => () => setMoneyHidden(false), []);
  const toggle = useCallback(() => {
    setHidden((h) => {
      const next = !h;
      try { localStorage.setItem(key(userId), next ? '1' : '0'); } catch { /* modo privado do browser */ }
      setMoneyHidden(next);
      return next;
    });
  }, [userId]);
  return { hidden, toggle };
}

export const usePrivacy = () => useContext(PrivacyContext);
