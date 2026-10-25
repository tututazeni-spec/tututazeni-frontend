// ============================================================
// INNOVA PLATFORM — SCALABILITY MODULE — CONTAINER
// ============================================================
//
// Container mínimo: guarda o separador activo, garante que o dashboard
// carregou e monta a casca com um painel por aba. Os dados e as acções de cada
// aba vivem no próprio painel (components/scalability/ScalabilityPanels.tsx)
// via hooks/useScalability.ts — antes este ficheiro tinha ~25 queries e passava
// ~65 props à vista.
//
// Só ADMIN/AUDITOR chegam aqui (ver Sidebar.tsx e os @Roles() em
// scalability.controller.ts). Os endpoints não levam :tenantId — o backend
// resolve o tenant único da plataforma (resolveTenantId() em
// scalability.service.ts).

'use client';

import { useState } from 'react';
import {
  useScalabilityAlerts,
  useScalabilityDashboard,
} from '@/hooks/useScalability';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScalabilityShell } from '@/components/scalability/ScalabilityDashboardView';
import {
  AlertsPanel,
  ApiPanel,
  AutoScalingPanel,
  AutomationsPanel,
  CapacityPanel,
  ContentPanel,
  CostsPanel,
  DatabasePanel,
  ForecastsPanel,
  IncidentsPanel,
  IntegrationsPanel,
  LoadTestsPanel,
  OverviewPanel,
  PerformancePanel,
  QueuesPanel,
  ReportsPanel,
  ResiliencePanel,
  SettingsPanel,
  SlaPanel,
  StoragePanel,
  UsersPanel,
} from '@/components/scalability/ScalabilityPanels';

const PANELS = {
  overview: <OverviewPanel />,
  performance: <PerformancePanel />,
  integrations: <IntegrationsPanel />,
  automations: <AutomationsPanel />,
  alerts: <AlertsPanel />,
  sla: <SlaPanel />,
  users: <UsersPanel />,
  api: <ApiPanel />,
  database: <DatabasePanel />,
  content: <ContentPanel />,
  queues: <QueuesPanel />,
  storage: <StoragePanel />,
  capacity: <CapacityPanel />,
  autoscaling: <AutoScalingPanel />,
  resilience: <ResiliencePanel />,
  incidents: <IncidentsPanel />,
  forecasts: <ForecastsPanel />,
  loadtests: <LoadTestsPanel />,
  costs: <CostsPanel />,
  reports: <ReportsPanel />,
  settings: <SettingsPanel />,
};

export default function ScalabilityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    data: dashboard,
    isLoading,
    isError,
    dataUpdatedAt,
    refetch,
  } = useScalabilityDashboard();
  // Só para o selo de alertas abertos nos separadores/banner; o AlertsPanel
  // lê a mesma queryKey, por isso não há pedido duplicado.
  const { data: alerts = [] } = useScalabilityAlerts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas px-6 py-6">
        <Skeleton
          wrapperClassName="mx-auto max-w-7xl space-y-4"
          itemClassName="h-20 bg-surface-sunken rounded-panel"
          rows={4}
        />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="min-h-screen bg-canvas px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <EmptyState
            title="Não foi possível carregar o dashboard de escalabilidade"
            description="Verifica a ligação ao backend e tenta novamente."
            action={{
              label: 'Tentar novamente',
              onClick: () => void refetch(),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <ScalabilityShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      panels={PANELS}
      alerts={alerts}
      lastRefresh={new Date(dataUpdatedAt || Date.now())}
    />
  );
}
