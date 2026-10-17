import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getLang, setLang, subscribe, t } from './core.js';
import './en/common.js';

// Fornece a lingua aos componentes: quem usa useI18n() volta a desenhar quando
// a lingua muda (o resto do estado — carrinho, formularios — fica intacto).
const I18nCtx = createContext({ lang: getLang(), t, setLang });

export function I18nProvider({ children }) {
  const [lang, setState] = useState(getLang());
  useEffect(() => subscribe(setState), []);
  // t novo a cada lingua: useMemo/useCallback que dependem de t recalculam.
  const value = useMemo(() => ({ lang, t: (s, v) => t(s, v), setLang }), [lang]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
