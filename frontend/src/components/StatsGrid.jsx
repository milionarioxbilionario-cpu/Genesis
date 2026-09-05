import React from 'react';

function formatCurrency(val, currency = 'MZN') {
  if (val == null) return `${currency} 0,00`;
  const amount = Number(val) / 100;
  return `${currency} ${amount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StatsGrid({ tenant }) {
  const t = tenant || (window.GENESIS_DATA && window.GENESIS_DATA.tenants.find(x => x.id === window.GENESIS_DATA.activeTenantId));
  if (!t) return null;

  const deals = t.deals || [];
  const totalWon = deals.filter(d => d.stage === 'won').reduce((s, d) => s + (Number(d.value) || 0), 0);
  const inPipeline = deals.filter(d => d.stage !== 'won').reduce((s, d) => s + (Number(d.value) || 0), 0);

  return (
    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-title">MRR Assinaturas Ativas</div>
        </div>
        <div className="stat-value">{formatCurrency(t.stats?.mrr || 0, t.currency)}</div>
        <div className="stat-footer">{t.stats?.mrrGrowth || ''} vs mês passado</div>
      </div>

      <div className="stat-card">
        <div className="stat-header"><div className="stat-title">Volume em Pipeline</div></div>
        <div className="stat-value">{formatCurrency(inPipeline, t.currency)}</div>
        <div className="stat-footer">{deals.filter(d => d.stage !== 'won').length} negócios ativos</div>
      </div>

      <div className="stat-card">
        <div className="stat-header"><div className="stat-title">Fechado Ganho</div></div>
        <div className="stat-value">{formatCurrency(totalWon, t.currency)}</div>
        <div className="stat-footer">{deals.filter(d => d.stage === 'won').length} convertidos</div>
      </div>

      <div className="stat-card">
        <div className="stat-header"><div className="stat-title">Taxa de Conversão</div></div>
        <div className="stat-value">{t.stats?.winRate || '—'}</div>
        <div className="stat-footer">Benchmark setorial: 22%</div>
      </div>
    </div>
  );
}
