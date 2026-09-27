import React from 'react';

/* ==========================================================================
   SINAL DE PORTA (cadeado da reposição de senha)
   A página de reposição de senha usa o estilo "auth-screen" de ecrã inteiro,
   portanto a animação vive aqui, nesta peça: a barreira sobe depois de o
   código do email ser confirmado e passar à 3ª fase.

   - `locked`   → portas vermelhas estreitas (código ainda não confirmado).
   - `unlocked` → portas abertas com fundo ciano até à direita (caminho livre
     para a nova senha). Também serve de indicador de progresso de segurança.
   ========================================================================== */

export default function SecurityGateIcon({ unlocked = false, className = '' }) {
  const cls = 'security-gate' + (unlocked ? ' is-open' : '') + (className ? ' ' + className : '');
  return (
    <div className={cls} aria-hidden="true">
      <div className="security-gate-glow" />
      <div className="security-gate-frame">
        <div className="security-gate-barrier security-gate-left" />
        <div className="security-gate-gap">
          <div className="security-gate-lock">🔒</div>
        </div>
        <div className="security-gate-barrier security-gate-right" />
      </div>
    </div>
  );
}
