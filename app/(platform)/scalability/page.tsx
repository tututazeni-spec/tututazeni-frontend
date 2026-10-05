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
  OverviewChartsData,
  SlaConfig,
  UsersLoadData,
  ApiMetricsData,
  DatabaseMetricsData,
  FrontendMetricsData,
  QueueMetricsData,
  StorageMetricsData,
  IntegrationMetricsData,
  PerformanceMetricsData,
  CapacityMetricsData,
  AutoScalingData,
  AutoScalingUpdate,
  ResilienceData,
  ResilienceUpdate,
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

  const { data: overviewCharts = null } = useApiQuery<OverviewChartsData>(
    queryKeys.scalability.overviewCharts(),
    '/scalability/overview-charts',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000 },
  );

  const { data: usersLoad = null } = useApiQuery<UsersLoadData>(
    queryKeys.scalability.usersLoad(),
    '/scalability/users-load',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 60_000,
      enabled: activeTab === 'users',
    },
  );

  const { data: apiMetrics = null } = useApiQuery<ApiMetricsData>(
    queryKeys.scalability.apiMetrics(),
    '/scalability/api-metrics',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 30_000,
      enabled: activeTab === 'api',
    },
  );

  const { data: databaseMetrics = null } = useApiQuery<DatabaseMetricsData>(
    queryKeys.scalability.databaseMetrics(),
    '/scalability/database-metrics',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 30_000,
      enabled: activeTab === 'database',
    },
  );

  const { data: frontendMetrics = null } = useApiQuery<FrontendMetricsData>(
    queryKeys.scalability.frontendMetrics(),
    '/scalability/frontend-metrics',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 60_000,
      enabled: activeTab === 'content',
    },
  );

  const { data: queueMetrics = null } = useApiQuery<QueueMetricsData>(
    queryKeys.scalability.queueMetrics(),
    '/scalability/queue-metrics',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 30_000,
      enabled: activeTab === 'queues',
    },
  );

  const { data: storageMetrics = null } = useApiQuery<StorageMetricsData>(
    queryKeys.scalability.storageMetrics(),
    '/scalability/storage-metrics',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 60_000,
      enabled: activeTab === 'storage',
    },
  );

  const { data: capacityMetrics = null } = useApiQuery<CapacityMetricsData>(
    queryKeys.scalability.capacityMetrics(),
    '/scalability/capacity-metrics',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 60_000,
      enabled: activeTab === 'capacity',
    },
  );

  const { data: autoScaling = null } = useApiQuery<AutoScalingData>(
    queryKeys.scalability.autoScaling(),
    '/scalability/auto-scaling',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 60_000,
      enabled: activeTab === 'autoscaling',
    },
  );

  const { data: resilience = null } = useApiQuery<ResilienceData>(
    queryKeys.scalability.resilienceMetrics(),
    '/scalability/resilience-metrics',
    {
      staleTime: STALE_TIME.DYNAMIC,
      refetchInterval: 60_000,
      enabled: activeTab === 'resilience',
    },
  );

  const { data: integrationMetrics = null } =
    useApiQuery<IntegrationMetricsData>(
      queryKeys.scalability.integrationMetrics(),
      '/scalability/integration-metrics',
      {
        staleTime: STALE_TIME.DYNAMIC,
        refetchInterval: 60_000,
        enabled: activeTab === 'integrations',
      },
    );

  const { data: performanceMetrics = null } =
    useApiQuery<PerformanceMetricsData>(
      queryKeys.scalability.performanceMetrics(),
      '/scalability/performance-metrics',
      {
        staleTime: STALE_TIME.DYNAMIC,
        refetchInterval: 30_000,
        enabled: activeTab === 'performance',
      },
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

  const { data: contentDelivery = null } =
    useApiQuery<ContentDeliveryConfig | null>(
      queryKeys.scalability.contentDelivery(),
      '/scalability/content-delivery',
      { staleTime: STALE_TIME.SEMI_STATIC },
    );

  const refresh = () => {
    void refetchDashboard();
  };

  const syncIntegration = useApiMutation<unknown, number>(
    (integrationId) =>
      apiClient.post('/scalability/integrations/sync', { integrationId }),
    {
      invalidateKeys: [
        queryKeys.scalability.integrations(),
        queryKeys.scalability.dashboard(),
      ],
    },
  );
  const onSyncIntegration = (id: number) => {
    syncIntegration.mutate(id, {
      onSuccess: () =>
        notify({ title: 'Sincronização iniciada', intent: 'success' }),
      onError: (err) => {
        reportError(err, { source: 'ScalabilityPage.onSyncIntegration' });
        notify({
          title: 'Não foi possível iniciar a sincronização',
          intent: 'danger',
        });
      },
    });
  };

  // §15-17 — só ADMIN altera limites, política de scaling e resiliência.
  const canEditInfra = currentUser?.role?.code === 'ADMIN';

  const saveCapacity = useApiMutation<
    unknown,
    { maxConcurrentUsers: number; maxApiRps: number }
  >((v) => apiClient.patch('/scalability/capacity-limits', v), {
    invalidateKeys: [queryKeys.scalability.capacityMetrics()],
  });
  const saveAutoScaling = useApiMutation<unknown, AutoScalingUpdate>(
    (v) => apiClient.patch('/scalability/auto-scaling', v),
    { invalidateKeys: [queryKeys.scalability.autoScaling()] },
  );
  const saveResilience = useApiMutation<unknown, ResilienceUpdate>(
    (v) => apiClient.patch('/scalability/resilience', v),
    { invalidateKeys: [queryKeys.scalability.resilienceMetrics()] },
  );
  const infraCallbacks = (source: string, okTitle: string) => ({
    onSuccess: () => notify({ title: okTitle, intent: 'success' }),
    onError: (err: unknown) => {
      reportError(err, { source });
      notify({
        title: 'Não foi possível guardar as alterações',
        intent: 'danger',
      });
    },
  });

  const executeRule = useApiMutation<unknown, number>(
    (ruleId) => apiClient.post('/scalability/automations/execute', { ruleId }),
    {
      invalidateKeys: [
        queryKeys.scalability.automations(),
        queryKeys.scalability.dashboard(),
      ],
    },
  );
  const onExecuteRule = (id: number) => {
    executeRule.mutate(id, {
      onSuccess: () =>
        notify({ title: 'Execução iniciada', intent: 'success' }),
      onError: (err) => {
        reportError(err, { source: 'ScalabilityPage.onExecuteRule' });
        notify({
          title: 'Não foi possível executar a regra',
          intent: 'danger',
        });
      },
    });
  };

  const resolveAlert = useApiMutation<unknown, string>(
    (id) =>
      apiClient.patch(`/scalability/alerts/${id}/resolve`, {
        resolvedBy: currentUser ? String(currentUser.id) : 'unknown',
      }),
    {
      invalidateKeys: [
        queryKeys.scalability.alerts(),
        queryKeys.scalability.dashboard(),
      ],
    },
  );
  const onResolveAlert = (id: string) => {
    resolveAlert.mutate(id, {
      onSuccess: () => notify({ title: 'Alerta resolvido', intent: 'success' }),
      onError: (err) => {
        reportError(err, { source: 'ScalabilityPage.onResolveAlert' });
        notify({
          title: 'Não foi possível resolver o alerta',
          intent: 'danger',
        });
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
      overviewCharts={overviewCharts}
      usersLoad={usersLoad}
      apiMetrics={apiMetrics}
      databaseMetrics={databaseMetrics}
      frontendMetrics={frontendMetrics}
      queueMetrics={queueMetrics}
      storageMetrics={storageMetrics}
      integrationMetrics={integrationMetrics}
      performanceMetrics={performanceMetrics}
      capacityMetrics={capacityMetrics}
      autoScaling={autoScaling}
      resilience={resilience}
      canEditInfra={canEditInfra}
      infraSaving={
        saveCapacity.isPending ||
        saveAutoScaling.isPending ||
        saveResilience.isPending
      }
      onSaveCapacityLimits={(v) =>
        saveCapacity.mutate(
          v,
          infraCallbacks('ScalabilityPage.saveCapacity', 'Limites guardados'),
        )
      }
      onSaveAutoScaling={(v) =>
        saveAutoScaling.mutate(
          v,
          infraCallbacks(
            'ScalabilityPage.saveAutoScaling',
            'Política guardada',
          ),
        )
      }
      onSaveResilience={(v) =>
        saveResilience.mutate(
          v,
          infraCallbacks(
            'ScalabilityPage.saveResilience',
            'Resiliência guardada',
          ),
        )
      }
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
