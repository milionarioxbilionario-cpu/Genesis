// Ecras isolados (Hub do balcao, POS): o botao "voltar" do browser NAO pode
// furar o isolamento. Sem isto, um caixista sai do perfil sem fechar o turno
// ou ve o painel do dono sem a senha — so com o back do navegador.
//
// Tecnica: ao montar, empilha-se uma entrada fantasma no historico. Quando o
// utilizador carrega "voltar", o browser dispara `popstate` em vez de sair;
// o handler repoe imediatamente a armadilha e chama `onBackAttempt`
// (abrir o gate de senha / mostrar erro). As saidas LEGITIMAS usam
// navigate() do React Router (pushState interno, nao dispara popstate),
// por isso passam sem interferencia.
import { useEffect, useRef } from 'react';

export function useIsolatedScreen(onBackAttempt) {
  const cbRef = useRef(onBackAttempt);
  cbRef.current = onBackAttempt;

  useEffect(() => {
    // Entrada fantasma: um "voltar" cai aqui em vez de sair do ecra.
    try { window.history.pushState({ genesis_isolated: true }, '', window.location.href); } catch { /* noop */ }

    const onPop = () => {
      // Repoe a armadilha para a proxima tentativa e avisa o ecra.
      try { window.history.pushState({ genesis_isolated: true }, '', window.location.href); } catch { /* noop */ }
      if (typeof cbRef.current === 'function') {
        try { cbRef.current(); } catch { /* noop */ }
      }
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
