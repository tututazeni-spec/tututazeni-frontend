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
vi.mock('./RenameTenantModal', () => ({
  RenameTenantModal: ({ currentName }: { currentName: string }) => (
    <div>[RenameTenantModal {currentName}]</div>
  ),
}));

import { ScalabilityDashboardView } from './ScalabilityDashboardView';
import type { DashboardData, Alert, Integration, AutomationRule } from './types';

const DASHBOARD: DashboardData = {
  tenantInfo: {
    id: 'tenant-1',
    tenantCode: 'SONANGOL',
    tenantName: 'Sonangol EP',
    plan: 'ENTERPRISE',
    maxUsers: 5000,
    activeUsersCount: 3847,
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
    expect(screen.getByText('Sem alertas nesta categoria.')).toBeInTheDocument();
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
    expect(
      screen.queryByText(/\[RenameTenantModal/),
    ).not.toBeInTheDocument();

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
    fireEvent.click(
      screen.getByRole('button', { name: 'Configurar Teste' }),
    );
    expect(screen.getByText('[LoadTestModal]')).toBeInTheDocument();
  });
});

describe('ScalabilityDashboardView — integrações e automações', () => {
  test('lista vazia mostra EmptyState em vez de nada', () => {
    renderView('integrations');
    expect(screen.getByText('Sem integrações configuradas')).toBeInTheDocument();
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
