import React, { useCallback, useEffect, useRef } from 'react';

/* ==========================================================================
   IMPRESSORA 3D (peça real — substitui o velho Receipt3D, que era só uma
   barra de 6px com gradiente).
   --------------------------------------------------------------------------
   `state`: 'idle' (repouso) ou 'printing' (a cosper o papel).
   `onPrinted`: chamado quando a animação de saída termina (animationend).
   `repeatKey`: muda de valor para a peça RE-ARRANCAR a animação de raiz —
   sem isto o React reutilizava o DOM e o papel aparecia já fora.

   Como funciona a física: o papel (children = recibo real) nasce ESCONDIDO
   (max-height 0 + clip-path) e cresce na vertical a partir da fenda, com
   inclinação 3D no início que endireita no fim. A "barra de tinta" corre na
   fenda ao mesmo tempo. O fim da animação do papel dispara `onPrinted`.
   ========================================================================== */

export function Printer3D({
  state = 'idle',
  repeatKey = 0,
  onPrinted,
  showBrand = true,
  className = '',
  children,
}) {
  const printingRef = useRef(false);
  const settled = useRef(false);

  // Cada mudança de (repeatKey, state) é um novo ciclo: limpa as guardas.
  useEffect(() => {
    settled.current = false;
    printingRef.current = state === 'printing';
  }, [repeatKey, state]);

  // O evento BUBBLE do papel chega aqui. Interessa só a animação
  // g-receipt-feed (a de saída); o g-receipt-settle do repouso é infinito e
  // não chega a acabar, mas filtra-se na mesma por nome por segurança.
  const handlePaperEnd = useCallback((event) => {
    if (event.animationName && event.animationName !== 'g-receipt-feed') return;
    if (!printingRef.current || settled.current) return;
    settled.current = true;
    printingRef.current = false;
    if (typeof onPrinted === 'function') onPrinted();
  }, [onPrinted]);

  return (
    <div className={'g-printer ' + className} data-state={state} role="img" aria-label="Impressora a imprimir o recibo">
      <div className="g-printer-body">
        {showBrand && (
          <div className="g-printer-brand">
            <span className="g-printer-name">GENESIS <b>TP-80</b></span>
            <span className="g-printer-leds" aria-hidden="true">
              <span className="g-printer-led g-printer-led--power" title="Ligada" />
              <span className="g-printer-led g-printer-led--ink" title="A imprimir" />
            </span>
          </div>
        )}
        <div className="g-printer-slot" aria-hidden="true">
          <div className="g-printer-inkbar" key={'ink-' + String(repeatKey)} />
        </div>
      </div>
      <div className="g-printer-paper-clip">
        <div
          key={'paper-' + String(repeatKey)}
          className="g-receipt-3d-stage"
          onAnimationEnd={handlePaperEnd}
        >
          <div className="g-receipt-3d">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* Compatibilidade: o POS antigo importava Receipt3D do kit de UI.
   Agora o Receipt3D É a impressora (papel em repouso). */
export function Receipt3D({ children, className = '' }) {
  return (
    <Printer3D state="idle" repeatKey={0} showBrand={false} className={className}>
      {children}
    </Printer3D>
  );
}

export default Printer3D;
