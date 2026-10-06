import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => vi.fn(),
}));

// Os modais têm testes próprios; aqui só interessa que a interacção os monta.
vi.mock('./ImportUsersModal', () => ({
  ImportUsersModal: () => <div>[ImportUsersModal]</div>,
}));
vi.mock('./LoadTestModal', () => ({
  LoadTestModal: () => <div>[LoadTestModal]</div>,
}));
// Painéis auto-contidos (fazem os seus próprios pedidos) — não precisam de QueryClient aqui.
vi.mock('./HistoryCharts', () => ({
  EndpointHistoryChart: () => null,
  HourlyHistoryCharts: () => null,
  QueueHistoryChart: () => null,
  RecommendationsCard: () => null,
}));
vi.mock('./WhatIfPanel', () => ({ WhatIfPanel: () => null }));
vi.mock('./RetentionStatusCard', () => ({ RetentionStatusCard: () => null }));
vi.mock('./RenameTenantModal', () => ({
  RenameTenantModal: ({ currentName }: { currentName: string }) => (
    <div>[RenameTenantModal {currentName}]</div>
  ),
}));

import { ScalabilityDashboardView } from './ScalabilityDashboardView';
import type {
  DashboardData,
  Alert,
  Integration,
  AutomationRule,
} from './types';

const DASHBOARD: DashboardData = {
  tenantInfo: {
    id: 'tenant-1',
    tenantCode: 'SONANGOL',
    tenantName: 'Sonangol EP',
    plan: 'ENTERPRISE',
    maxUsers: 5000,
    activeUsersCount: 3847,
    registeredUsersCount: 4210,
    storageUsedGb: 128,
    maxStorageGb: 500,
  },
  performanceSummary: {
    uptimePercent: 99.97,
    avgLatencyMs: 187,
    errorRate: 0.03,
    activeSessionsNow: 412,
    requestsPerMinute: 2840,
    cpuUsagePercent: 34,
    memoryUsagePercent: 61,
    dbUsagePercent: 42,
  },
  integrations: { total: 7, active: 5, withErrors: 1, lastSyncAt: null },
  automations: { total: 18, active: 14, executionsToday: 234, failedToday: 3 },
  alerts: { open: 4, critical: 1, warning: 2, info: 1 },
  slaCompliance: {
    currentUptimePercent: 99.97,
    slaTarget: 99.9,
    isBreached: false,
    avgLatencyMs: 187,
    latencyTarget: 2000,
  },
};

const ALERTS: Alert[] = [
  {
    id: '1',
    severity: 'CRITICAL',
    category: 'INTEGRATION',
    title: 'Falha ERP',
    message: 'x',
    isResolved: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    severity: 'WARNING',
    category: 'PERFORMANCE',
    title: 'CPU alta',
    message: 'x',
    isResolved: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    severity: 'INFO',
    category: 'AUTOMATION',
    title: 'Automação corrida',
    message: 'x',
    isResolved: false,
    createdAt: new Date().toISOString(),
  },
];

const INTEGRATIONS: Integration[] = [];
const AUTOMATIONS: AutomationRule[] = [];

function renderView(activeTab: string) {
  return renderViewWithAlerts(activeTab, ALERTS);
}

function renderViewWithAlerts(activeTab: string, alerts: Alert[]) {
  return render(
    <ScalabilityDashboardView
      activeTab={activeTab}
      onTabChange={vi.fn()}
      dashboard={DASHBOARD}
      alerts={alerts}
      integrations={INTEGRATIONS}
      automations={AUTOMATIONS}
      slaConfigs={[]}
      contentDelivery={null}
      lastRefresh={new Date('2026-09-03T22:00:00Z')}
      onRefresh={vi.fn()}
      onSyncIntegration={vi.fn()}
      onExecuteRule={vi.fn()}
      onResolveAlert={vi.fn()}
    />,
  );
}

describe('ScalabilityDashboardView — alertas', () => {
  test('"Críticos" mostra só os alertas CRITICAL', () => {
    renderViewWithAlerts('alerts', ALERTS);
    expect(screen.getByText('Falha ERP')).toBeInTheDocument();
    expect(screen.getByText('CPU alta')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Críticos' }));

    expect(screen.getByText('Falha ERP')).toBeInTheDocument();
    expect(screen.queryByText('CPU alta')).not.toBeInTheDocument();
    expect(screen.queryByText('Automação corrida')).not.toBeInTheDocument();
  });

  test('"Avisos" mostra só os alertas WARNING', () => {
    renderViewWithAlerts('alerts', ALERTS);
    fireEvent.click(screen.getByRole('button', { name: 'Avisos' }));
    expect(screen.getByText('CPU alta')).toBeInTheDocument();
    expect(screen.queryByText('Falha ERP')).not.toBeInTheDocument();
    expect(screen.queryByText('Automação corrida')).not.toBeInTheDocument();
  });

  test('estado vazio quando o filtro não tem correspondência', () => {
    renderViewWithAlerts('alerts', [ALERTS[2]]);
    fireEvent.click(screen.getByRole('button', { name: 'Críticos' }));
    expect(
      screen.getByText('Sem alertas nesta categoria.'),
    ).toBeInTheDocument();
  });

  test('chip activo reflecte-se em aria-pressed', () => {
    renderViewWithAlerts('alerts', ALERTS);
    fireEvent.click(screen.getByRole('button', { name: 'Críticos' }));
    expect(screen.getByRole('button', { name: 'Críticos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('"Resolver" chama onResolveAlert com o id do alerta', () => {
    const onResolveAlert = vi.fn();
    render(
      <ScalabilityDashboardView
        activeTab="alerts"
        onTabChange={vi.fn()}
        dashboard={DASHBOARD}
        alerts={[ALERTS[0]]}
        integrations={INTEGRATIONS}
        automations={AUTOMATIONS}
        slaConfigs={[]}
        contentDelivery={null}
        lastRefresh={new Date('2026-09-03T22:00:00Z')}
        onRefresh={vi.fn()}
        onSyncIntegration={vi.fn()}
        onExecuteRule={vi.fn()}
        onResolveAlert={onResolveAlert}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Resolver' }));
    expect(onResolveAlert).toHaveBeenCalledWith('1');
  });
});

describe('ScalabilityDashboardView — tenant activo', () => {
  test('o lápis abre o modal de renomear com o nome actual', () => {
    renderView('overview');
    expect(screen.queryByText(/\[RenameTenantModal/)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Editar nome da empresa' }),
    );

    expect(
      screen.getByText('[RenameTenantModal Sonangol EP]'),
    ).toBeInTheDocument();
  });
});

describe('ScalabilityDashboardView — utilizadores', () => {
  test('"Importar CSV" monta o modal de importação', () => {
    renderView('users');
    expect(screen.queryByText('[ImportUsersModal]')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Importar CSV' }));
    expect(screen.getByText('[ImportUsersModal]')).toBeInTheDocument();
  });
});

describe('ScalabilityDashboardView — performance', () => {
  test('"Configurar Teste" monta o modal de teste de carga', () => {
    renderView('performance');
    expect(screen.queryByText('[LoadTestModal]')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Configurar Teste' }));
    expect(screen.getByText('[LoadTestModal]')).toBeInTheDocument();
  });
});

describe('ScalabilityDashboardView — integrações e automações', () => {
  test('lista vazia mostra EmptyState em vez de nada', () => {
    renderView('integrations');
    expect(
      screen.getByText('Sem integrações configuradas'),
    ).toBeInTheDocument();
  });

  test('regras vazias mostram EmptyState', () => {
    renderView('automations');
    expect(screen.getByText('Sem regras de automação')).toBeInTheDocument();
  });
});

describe('ScalabilityDashboardView — SLA', () => {
  test('sem SLA configurado mostra EmptyState (não fabrica compliance)', () => {
    renderView('sla');
    expect(screen.getByText('Sem SLA configurado')).toBeInTheDocument();
  });
});

describe('ScalabilityDashboardView — conteúdo', () => {
  test('sem configuração de CDN mostra EmptyState (não fabrica infra)', () => {
    renderView('content');
    expect(
      screen.getByText('Sem configuração de entrega de conteúdo'),
    ).toBeInTheDocument();
  });
});

describe('ScalabilityDashboardView — filas e storage', () => {
  const renderWith = (
    activeTab: string,
    extra: Partial<React.ComponentProps<typeof ScalabilityDashboardView>>,
  ) =>
    render(
      <ScalabilityDashboardView
        activeTab={activeTab}
        onTabChange={vi.fn()}
        dashboard={DASHBOARD}
        alerts={[]}
        integrations={INTEGRATIONS}
        automations={AUTOMATIONS}
        slaConfigs={[]}
        contentDelivery={null}
        lastRefresh={new Date('2026-09-03T22:00:00Z')}
        onRefresh={vi.fn()}
        onSyncIntegration={vi.fn()}
        onExecuteRule={vi.fn()}
        onResolveAlert={vi.fn()}
        {...extra}
      />,
    );

  test('as abas Filas & Jobs e Storage existem', () => {
    renderView('overview');
    expect(screen.getByText('Filas & Jobs')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  test('sem dados mostra estado de carregamento', () => {
    renderView('queues');
    expect(screen.getByText('A carregar filas e jobs')).toBeInTheDocument();
    renderView('storage');
    expect(
      screen.getByText('A carregar métricas de storage'),
    ).toBeInTheDocument();
  });

  test('filas: mostra indicadores, falhas e domínios síncronos', () => {
    renderWith('queues', {
      queueMetrics: {
        mode: 'QUEUE',
        redisAvailable: true,
        totals: {
          executed: 120,
          pending: 3,
          running: 1,
          failed: 2,
          delayed: 0,
          avgDurationMs: 1500,
          throughputPerMin: 4.2,
          queueSize: 3,
          retries: 5,
        },
        queues: [
          {
            key: 'email',
            label: 'Email',
            domain: 'Notifications',
            waiting: 3,
            active: 1,
            delayed: 0,
            failed: 2,
            completed: 100,
            queueSize: 3,
            avgDurationMs: 1500,
            throughputPerMin: 4.2,
            retries: 5,
            lastFailure: { at: null, reason: 'SMTP timeout' },
          },
        ],
        dbJobs: [],
        synchronousDomains: ['Payroll', 'Reports'],
        depthHistory: [],
        historyHours: 6,
      },
    });
    expect(screen.getByText('Jobs falhados')).toBeInTheDocument();
    expect(screen.getByText('1.5 s', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/SMTP timeout/)).toBeInTheDocument();
    expect(screen.getByText(/Payroll, Reports/)).toBeInTheDocument();
    expect(screen.getByText('Histórico insuficiente')).toBeInTheDocument();
  });

  test('storage: mostra quota, utilização e maiores ficheiros', () => {
    renderWith('storage', {
      storageMetrics: {
        totalGb: 50,
        usedGb: 2,
        usedMb: 2048,
        availableGb: 48,
        usagePercent: 4,
        monthlyGrowthMb: 120,
        files: 10,
        byModule: [
          {
            key: 'DOCUMENT_REPOSITORY',
            label: 'Document Repository',
            files: 10,
            mb: 2048,
            percent: 100,
          },
        ],
        byKind: [],
        byType: [],
        byUnit: [],
        growth: [],
        largestFiles: [
          {
            module: 'Content Library',
            name: 'formacao.mp4',
            type: 'Vídeo',
            mb: 900,
            createdAt: new Date().toISOString(),
          },
        ],
        note: 'nota',
      },
    });
    expect(screen.getByText('50 GB')).toBeInTheDocument();
    expect(screen.getByText('4% da quota')).toBeInTheDocument();
    expect(screen.getByText('Document Repository')).toBeInTheDocument();
    expect(screen.getByText('formacao.mp4')).toBeInTheDocument();
  });
});
