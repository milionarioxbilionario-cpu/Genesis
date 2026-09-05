import React from 'react';

export default function Pipeline({ tenant }) {
  const t = tenant || (window.GENESIS_DATA && window.GENESIS_DATA.tenants.find(x => x.id === window.GENESIS_DATA.activeTenantId));
  if (!t) return null;

  const stages = t.stages || [];

  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
      {stages.map((stage) => (
        <div key={stage.id} style={{ flex: 1, background: 'var(--bg-surface)', borderRadius: 8, padding: 8, minHeight: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>{stage.title}</strong>
            <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}></span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(t.deals || []).filter(d => d.stage === stage.id).map((deal) => (
              <div key={deal.id} className="kanban-card" style={{ background: '#fff', padding: 10, borderRadius: 6, boxShadow: '0 6px 14px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700 }}>{deal.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{deal.value ? `${t.currency} ${deal.value.toLocaleString()}` : ''}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 6 }}>{deal.company}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
