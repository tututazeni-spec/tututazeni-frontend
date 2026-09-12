// ============================================================
// INNOVA PLATFORM — SCALABILITY MODULE — CONTAINER
// src/pages/scalability/scalability.page.tsx
// ============================================================
//
// Container: guarda estado, decide quando actualizar e passa tudo por props
// à vista apresentacional (ScalabilityDashboardView) — sem lógica de render
// aqui. Extraído do ficheiro original (2020 linhas, container+apresentação
// juntos); os *Tab já estavam razoavelmente isolados, faltava só separar o
// topo. Ver memory project_innova_component_separation_audit, item 3.1.
//
// Já não corre sobre dados mock — usa os endpoints reais sem :tenantId
// (GET /scalability/dashboard, /integrations, /automations, /sla,
// /content-delivery — resolvem sozinhos o tenant único da plataforma, ver
// resolveTenantId() em scalability.service.ts) mais GET /scalability/alerts
// (já era tenant-less). Só ADMIN/AUDITOR chegam aqui (ver Sidebar.tsx e os
// @Roles() em scalability.controller.ts).

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScalabilityDashboardView } from '@/components/scalability/ScalabilityDashboardView';
import type {
  AutomationRule,
  Alert,
  ContentDeliveryConfig,
  DashboardData,
  Integration,
  SlaConfig,
} from '@/components/scalability/types';

export default function ScalabilityPage() {
  const notify = useToast();
  const { data: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('overview');

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
    dataUpdatedAt,
    refetch: refetchDashboard,
  } = useApiQuery<DashboardData>(
    queryKeys.scalability.dashboard(),
    '/scalability/dashboard',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000 },
  );

  const { data: integrations = [] } = useApiQuery<Integration[]>(
    queryKeys.scalability.integrations(),
    '/scalability/integrations',
    {
      staleTime: STALE_TIME.DYNAMIC,
      params: { limit: 100 },
      select: (r: any) => r.data ?? r,
    },
  );

  const { data: automations = [] } = useApiQuery<AutomationRule[]>(
    queryKeys.scalability.automations(),
    '/scalability/automations',
    {
      staleTime: STALE_TIME.DYNAMIC,
      params: { limit: 100 },
      select: (r: any) => r.data ?? r,
    },
  );

  const { data: alerts = [] } = useApiQuery<Alert[]>(
    queryKeys.scalability.alerts(),
    '/scalability/alerts',
    {
      staleTime: STALE_TIME.DYNAMIC,
      params: { isResolved: false, limit: 100 },
      select: (r: any) => r.data ?? r,
    },
  );

  const { data: slaConfigs = [] } = useApiQuery<SlaConfig[]>(
    queryKeys.scalability.sla(),
    '/scalability/sla',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const { data: contentDelivery = null } = useApiQuery<ContentDeliveryConfig | null>(
    queryKeys.scalability.contentDelivery(),
    '/scalability/content-delivery',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const refresh = () => {
    void refetchDashboard();
  };

  const syncIntegration = useApiMutation<unknown, number>(
    (integrationId) => apiClient.post('/scalability/integrations/sync', { integrationId }),
    { invalidateKeys: [queryKeys.scalability.integrations(), queryKeys.scalability.dashboard()] },
  );
  const onSyncIntegration = (id: number) => {
    syncIntegration.mutate(id, {
      onSuccess: () => notify({ title: 'Sincronização iniciada', intent: 'success' }),
      onError: (err) => {
        reportError(err, { source: 'ScalabilityPage.onSyncIntegration' });
        notify({ title: 'Não foi possível iniciar a sincronização', intent: 'danger' });
      },
    });
  };

  const executeRule = useApiMutation<unknown, number>(
    (ruleId) => apiClient.post('/scalability/automations/execute', { ruleId }),
    { invalidateKeys: [queryKeys.scalability.automations(), queryKeys.scalability.dashboard()] },
  );
  const onExecuteRule = (id: number) => {
    executeRule.mutate(id, {
      onSuccess: () => notify({ title: 'Execução iniciada', intent: 'success' }),
      onError: (err) => {
        reportError(err, { source: 'ScalabilityPage.onExecuteRule' });
        notify({ title: 'Não foi possível executar a regra', intent: 'danger' });
      },
    });
  };

  const resolveAlert = useApiMutation<unknown, string>(
    (id) =>
      apiClient.patch(`/scalability/alerts/${id}/resolve`, {
        resolvedBy: currentUser ? String(currentUser.id) : 'unknown',
      }),
    { invalidateKeys: [queryKeys.scalability.alerts(), queryKeys.scalability.dashboard()] },
  );
  const onResolveAlert = (id: string) => {
    resolveAlert.mutate(id, {
      onSuccess: () => notify({ title: 'Alerta resolvido', intent: 'success' }),
      onError: (err) => {
        reportError(err, { source: 'ScalabilityPage.onResolveAlert' });
        notify({ title: 'Não foi possível resolver o alerta', intent: 'danger' });
      },
    });
  };

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-canvas px-6 py-6">
        <Skeleton
          wrapperClassName="mx-auto max-w-7xl space-y-4 animate-pulse"
          itemClassName="h-20 bg-surface-sunken rounded-panel"
          rows={4}
        />
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    return (
      <div className="min-h-screen bg-canvas px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <EmptyState
            title="Não foi possível carregar o dashboard de escalabilidade"
            description="Verifica a ligação ao backend e tenta novamente."
            action={{ label: 'Tentar novamente', onClick: refresh }}
          />
        </div>
      </div>
    );
  }

  return (
    <ScalabilityDashboardView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      dashboard={dashboard}
      alerts={alerts}
      integrations={integrations}
      automations={automations}
      slaConfigs={slaConfigs}
      contentDelivery={contentDelivery}
      lastRefresh={new Date(dataUpdatedAt || Date.now())}
      onRefresh={refresh}
      onSyncIntegration={onSyncIntegration}
      onExecuteRule={onExecuteRule}
      onResolveAlert={onResolveAlert}
    />
  );
}
