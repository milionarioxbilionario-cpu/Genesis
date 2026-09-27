import React from 'react';

/* ==========================================================================
   A PISCINA (so no modo claro)
   --------------------------------------------------------------------------
   Camada puramente decorativa: azulejos + ondas + causticas. O estilo vive em
   ui/theme-toggle.css (secção "A PISCINA"), onde esta documentado camada a
   camada. `aria-hidden` + `pointer-events: none` (no CSS) garantem que nao
   interfere com leitores de ecra nem com cliques.
   ========================================================================== */

export default function PoolWater() {
  return (
    <div className="g-pool" aria-hidden="true">
      <div className="g-pool-tiles" />
      <div className="g-pool-wave g-pool-wave-a" />
      <div className="g-pool-wave g-pool-wave-b" />
      <div className="g-pool-wave g-pool-wave-c" />
      <div className="g-pool-wave g-pool-wave-d" />
      <div className="g-pool-caustic g-pool-caustic-a" />
      <div className="g-pool-caustic g-pool-caustic-b" />
      <div className="g-pool-caustic g-pool-caustic-c" />
    </div>
  );
}
