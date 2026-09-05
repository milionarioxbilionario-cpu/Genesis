// Genesis CRM - Multi-Tenant Initial Mock Data
window.GENESIS_DATA = {
  activeTenantId: 'tenant-1',
  tenants: [
    {
      id: 'tenant-1',
      name: 'Genesis Core Enterprise',
      code: 'GEN-CORP',
      plan: 'Enterprise SaaS',
      currency: 'R$',
      color: '#6366f1',
      logoText: 'GC',
      stats: {
        mrr: 148500,
        mrrGrowth: '+14.2%',
        pipelineValue: 520000,
        activeLeads: 86,
        winRate: '34.8%',
        dealsClosed: 42
      },
      stages: [
        { id: 'lead', title: 'Leads / Prospecção', color: '#6366f1' },
        { id: 'qualified', title: 'Qualificação', color: '#06b6d4' },
        { id: 'proposal', title: 'Proposta Enviada', color: '#f59e0b' },
        { id: 'negotiation', title: 'Negociação Final', color: '#a855f7' },
        { id: 'won', title: 'Fechado Ganho 🎉', color: '#10b981' }
      ],
      deals: [
        {
          id: 'deal-101',
          title: 'Implantação Multi-Tenant Banco Alfa',
          company: 'Banco Alfa S.A.',
          contactName: 'Carlos Mendonça',
          email: 'carlos@bancoalfa.com.br',
          phone: '+55 11 98765-4321',
          value: 120000,
          stage: 'negotiation',
          priority: 'high',
          tags: ['Enterprise', 'Prioridade Máxima', 'Fintech'],
          assignee: { name: 'Mariana Lima', avatar: 'ML', color: '#10b981' },
          updatedAt: 'Há 12 min',
          activities: [
            { type: 'call', title: 'Call de alinhamento com CTO', date: 'Hoje às 14:00', author: 'Mariana Lima', note: 'Discutida a arquitetura multilocatária e segurança.' },
            { type: 'note', title: 'Proposta customizada revisada', date: 'Ontem às 18:30', author: 'Mariana Lima', note: 'Desconto de 5% aprovado pela diretoria para fechamento anual.' }
          ],
          tasks: [
            { id: 't1', title: 'Enviar minuta contratual revisada', done: false, due: 'Amanhã' },
            { id: 't2', title: 'Validar compliance LGPD com jurídico', done: true, due: 'Ontem' }
          ]
        },
        {
          id: 'deal-102',
          title: 'Assinatura SaaS Enterprise 500 Licenças',
          company: 'Omni Retail Logística',
          contactName: 'Beatriz Vasconcelos',
          email: 'beatriz@omniretail.com',
          phone: '+55 21 99887-1122',
          value: 78000,
          stage: 'proposal',
          priority: 'medium',
          tags: ['Logística', 'Expansão'],
          assignee: { name: 'Rodrigo Silva', avatar: 'RS', color: '#6366f1' },
          updatedAt: 'Há 1 hora',
          activities: [
            { type: 'proposal', title: 'Envio de Proposta Comercial v2', date: 'Hoje às 11:15', author: 'Rodrigo Silva', note: 'Enviado pacote com suporte 24/7 incluso.' }
          ],
          tasks: [
            { id: 't3', title: 'Agendar call de follow-up pós proposta', done: false, due: 'Em 2 dias' }
          ]
        },
        {
          id: 'deal-103',
          title: 'Upgrade Plano Growth para Pro Tenant',
          company: 'Nexus Health Care',
          contactName: 'Dr. Eduardo Farias',
          email: 'eduardo@nexushealth.med',
          phone: '+55 31 97654-3210',
          value: 45000,
          stage: 'won',
          priority: 'high',
          tags: ['Healthtech', 'Contrato Anual'],
          assignee: { name: 'Mariana Lima', avatar: 'ML', color: '#10b981' },
          updatedAt: 'Há 3 horas',
          activities: [
            { type: 'won', title: 'Contrato Assinado Digitalmente via DocuSign', date: 'Hoje às 10:00', author: 'Mariana Lima', note: 'Pagamento efetuado via cartão corporativo anual.' }
          ],
          tasks: [
            { id: 't4', title: 'Iniciar onboarding técnico do tenant', done: false, due: 'Segunda-feira' }
          ]
        },
        {
          id: 'deal-104',
          title: 'Piloto Módulo CRM Inteligente',
          company: 'Vortex Soluções Digitais',
          contactName: 'Renata Albuquerque',
          email: 'renata@vortexdigi.io',
          phone: '+55 41 99123-8877',
          value: 32000,
          stage: 'qualified',
          priority: 'low',
          tags: ['Inbound', 'SaaS B2B'],
          assignee: { name: 'Felipe Santos', avatar: 'FS', color: '#f59e0b' },
          updatedAt: 'Há 5 horas',
          activities: [
            { type: 'qualification', title: 'Formulário de qualificação BANT preenchido', date: 'Ontem', author: 'Felipe Santos', note: 'Orçamento aprovado para o Q3.' }
          ],
          tasks: [
            { id: 't5', title: 'Apresentar demonstração guiada do módulo', done: false, due: 'Amanhã 15h' }
          ]
        },
        {
          id: 'deal-105',
          title: 'Integração API Genesis Hub',
          company: 'Starlight E-commerce',
          contactName: 'Lucas Bittencourt',
          email: 'lucas@starlight.store',
          phone: '+55 19 98822-3344',
          value: 54000,
          stage: 'lead',
          priority: 'medium',
          tags: ['API Partner', 'Novos Leads'],
          assignee: { name: 'Rodrigo Silva', avatar: 'RS', color: '#6366f1' },
          updatedAt: 'Há 1 dia',
          activities: [
            { type: 'lead', title: 'Lead capturado via Landing Page Genesis', date: 'Ontem', author: 'Sistema', note: 'Interesse manifestado em webhook multi-tenant.' }
          ],
          tasks: [
            { id: 't6', title: 'Primeiro contato telefônico SDR', done: false, due: 'Hoje' }
          ]
        }
      ],
      leads: [
        { id: 'lead-1', name: 'Carlos Mendonça', company: 'Banco Alfa S.A.', status: 'Negociação', score: 94, email: 'carlos@bancoalfa.com.br', phone: '+55 11 98765-4321', value: 120000 },
        { id: 'lead-2', name: 'Beatriz Vasconcelos', company: 'Omni Retail Logística', status: 'Proposta', score: 88, email: 'beatriz@omniretail.com', phone: '+55 21 99887-1122', value: 78000 },
        { id: 'lead-3', name: 'Dr. Eduardo Farias', company: 'Nexus Health Care', status: 'Fechado Ganho', score: 99, email: 'eduardo@nexushealth.med', phone: '+55 31 97654-3210', value: 45000 },
        { id: 'lead-4', name: 'Renata Albuquerque', company: 'Vortex Soluções', status: 'Qualificado', score: 76, email: 'renata@vortexdigi.io', phone: '+55 41 99123-8877', value: 32000 },
        { id: 'lead-5', name: 'Lucas Bittencourt', company: 'Starlight E-commerce', status: 'Novo Lead', score: 62, email: 'lucas@starlight.store', phone: '+55 19 98822-3344', value: 54000 },
        { id: 'lead-6', name: 'Juliana Paes Costa', company: 'Kroma Indústria', status: 'Qualificado', score: 81, email: 'juliana@kroma.ind.br', phone: '+55 11 97711-2233', value: 92000 },
        { id: 'lead-7', name: 'Marcos Vinicius', company: 'Solaris Cloud', status: 'Novo Lead', score: 55, email: 'marcos@solariscloud.com', phone: '+55 48 99655-4433', value: 28000 }
      ]
    },
    {
      id: 'tenant-2',
      name: 'Aura Health Tech',
      code: 'AURA-MED',
      plan: 'Scale Multi-Tenant',
      currency: 'R$',
      color: '#06b6d4',
      logoText: 'AH',
      stats: {
        mrr: 92000,
        mrrGrowth: '+22.8%',
        pipelineValue: 310000,
        activeLeads: 54,
        winRate: '41.2%',
        dealsClosed: 29
      },
      stages: [
        { id: 'lead', title: 'Triagem / Contato Inicial', color: '#06b6d4' },
        { id: 'qualified', title: 'Diagnóstico Clínico B2B', color: '#6366f1' },
        { id: 'proposal', title: 'Proposta Telemedicina', color: '#f59e0b' },
        { id: 'negotiation', title: 'Validação Jurídica', color: '#a855f7' },
        { id: 'won', title: 'Clínica Ativada 🎉', color: '#10b981' }
      ],
      deals: [
        {
          id: 'deal-201',
          title: 'Rede Clínicas São Lucas - 12 Unidades',
          company: 'Rede São Lucas Medicina',
          contactName: 'Dra. Adriana Mattos',
          email: 'adriana@saolucas.com.br',
          phone: '+55 11 97123-0000',
          value: 140000,
          stage: 'negotiation',
          priority: 'high',
          tags: ['Multi-Unidade', 'Alta Prioridade'],
          assignee: { name: 'Camila Rocha', avatar: 'CR', color: '#06b6d4' },
          updatedAt: 'Há 45 min',
          activities: [
            { type: 'meeting', title: 'Reunião com corpo médico', date: 'Hoje', author: 'Camila Rocha', note: 'Aprovada compatibilidade com prontuário eletrônico.' }
          ],
          tasks: [
            { id: 't201', title: 'Enviar minuta do SLA 99.9%', done: false, due: 'Segunda-feira' }
          ]
        },
        {
          id: 'deal-202',
          title: 'Laboratório Vital Diagnósticos',
          company: 'Vital Lab Diagnósticos',
          contactName: 'Rogério Prado',
          email: 'rogerio@vitallab.com.br',
          phone: '+55 21 98111-2233',
          value: 65000,
          stage: 'proposal',
          priority: 'medium',
          tags: ['Laboratórios', 'Integração LIS'],
          assignee: { name: 'Camila Rocha', avatar: 'CR', color: '#06b6d4' },
          updatedAt: 'Há 2 horas',
          activities: [],
          tasks: []
        }
      ],
      leads: [
        { id: 'lead-201', name: 'Dra. Adriana Mattos', company: 'Rede São Lucas Medicina', status: 'Negociação', score: 96, email: 'adriana@saolucas.com.br', phone: '+55 11 97123-0000', value: 140000 },
        { id: 'lead-202', name: 'Rogério Prado', company: 'Vital Lab Diagnósticos', status: 'Proposta', score: 82, email: 'rogerio@vitallab.com.br', phone: '+55 21 98111-2233', value: 65000 }
      ]
    },
    {
      id: 'tenant-3',
      name: 'Nexus FinTech Global',
      code: 'NEX-FIN',
      plan: 'Financial High-Sec',
      currency: 'US$',
      color: '#10b981',
      logoText: 'NX',
      stats: {
        mrr: 215000,
        mrrGrowth: '+31.5%',
        pipelineValue: 890000,
        activeLeads: 112,
        winRate: '38.0%',
        dealsClosed: 64
      },
      stages: [
        { id: 'lead', title: 'Inbound Inquiries', color: '#10b981' },
        { id: 'qualified', title: 'Security & Compliance', color: '#06b6d4' },
        { id: 'proposal', title: 'Pricing & Terms', color: '#f59e0b' },
        { id: 'negotiation', title: 'Executive Review', color: '#a855f7' },
        { id: 'won', title: 'Contract Closed 🚀', color: '#10b981' }
      ],
      deals: [
        {
          id: 'deal-301',
          title: 'Global Payment Gateway Modernization',
          company: 'Apex Clearing House Inc.',
          contactName: 'Michael Sterling',
          email: 'm.sterling@apexclearing.com',
          phone: '+1 (555) 349-2091',
          value: 380000,
          stage: 'negotiation',
          priority: 'high',
          tags: ['Tier-1 Bank', 'High Security'],
          assignee: { name: 'Arthur Pendelton', avatar: 'AP', color: '#10b981' },
          updatedAt: 'Just now',
          activities: [
            { type: 'audit', title: 'SOC2 Type II Audit Completed', date: 'Today', author: 'Arthur Pendelton', note: 'Passed all tenant segregation compliance tests.' }
          ],
          tasks: [
            { id: 't301', title: 'Execute master service agreement', done: false, due: 'Friday' }
          ]
        }
      ],
      leads: [
        { id: 'lead-301', name: 'Michael Sterling', company: 'Apex Clearing House Inc.', status: 'Executive Review', score: 98, email: 'm.sterling@apexclearing.com', phone: '+1 (555) 349-2091', value: 380000 }
      ]
    }
  ]
};
