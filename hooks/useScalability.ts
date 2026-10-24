// hooks/useScalability.ts
// Dados e acções do módulo de Escalabilidade, um hook por fonte.
//
// Antes, app/(platform)/scalability/page.tsx fazia ~25 useApiQuery + 15
// mutations e passava tudo por props (~65) à vista, que só usa 1-3 por aba.
// Agora cada painel chama o hook de que precisa; o React Query deduplica pela
// queryKey, por isso vários painéis a ler o mesmo recurso (ex.: dashboard) não
// geram pedidos repetidos. Os painéis só montam quando a aba está activa, por
// isso o `enabled: activeTab === ...` de antes deixou de ser necessário.

'use client';

import { useApiMutation, useApiQuery } from './useApiQuery';
import { useCurrentRole } from './useCurrentRole';
import { useCurrentUser } from './useCurrentUser';
import { apiClient } from '../lib/apiClient';
import { queryKeys } from '../lib/queryKeys';
import { STALE_TIME } from '../lib/queryClient';
import { pollInterval } from '../lib/polling';
import { reportError } from '../lib/errorReporting';
import { useToast } from '../providers/ToastProvider';
import type {
  Alert,
  AlertRulesData,
  ApiMetricsData,
  AutoScalingData,
  AutoScalingUpdate,
  AutomationRule,
  CapacityMetricsData,
  ContentDeliveryConfig,
  CostsData,
  CostsSave,
  DashboardData,
  DatabaseMetricsData,
  ForecastsData,
  FrontendMetricsData,
  IncidentCreate,
  IncidentsData,
  IncidentUpdate,
  Integration,
  IntegrationMetricsData,
  LoadTestCreate,
  LoadTestsData,
  LoadTestUpdate,
  OverviewChartsData,
  PerformanceMetricsData,
  QueueMetricsData,
  ReportCatalogData,
  ReportData,
  ResilienceData,
  ResilienceUpdate,
  SettingsData,
  SettingsUpdate,
  SlaConfig,
  StorageMetricsData,
  UsersLoadData,
} from '../components/scalability/types';

const { scalability: keys } = queryKeys;

const dynamic = (ms?: number) => ({
  staleTime: STALE_TIME.DYNAMIC,
  ...(ms ? { refetchInterval: pollInterval(ms) } : {}),
});

// A API devolve ora um array, ora `{ data: [...] }` paginado.
const unwrapList = <T>(r: unknown): T => ((r as { data?: T }).data ?? r) as T;

// ─── Leituras ──────────────────────────────────────────────────────────────

export const useScalabilityDashboard = () =>
  useApiQuery<DashboardData>(
    keys.dashboard(),
    '/scalability/dashboard',
    dynamic(60_000),
  );

export const useOverviewCharts = () =>
  useApiQuery<OverviewChartsData>(
    keys.overviewCharts(),
    '/scalability/overview-charts',
    dynamic(60_000),
  );

export const useUsersLoad = () =>
  useApiQuery<UsersLoadData>(
    keys.usersLoad(),
    '/scalability/users-load',
    dynamic(60_000),
  );

export const useApiMetrics = () =>
  useApiQuery<ApiMetricsData>(
    keys.apiMetrics(),
    '/scalability/api-metrics',
    dynamic(30_000),
  );

export const useDatabaseMetrics = () =>
  useApiQuery<DatabaseMetricsData>(
    keys.databaseMetrics(),
    '/scalability/database-metrics',
    dynamic(30_000),
  );

export const useFrontendMetrics = () =>
  useApiQuery<FrontendMetricsData>(
    keys.frontendMetrics(),
    '/scalability/frontend-metrics',
    dynamic(60_000),
  );

export const useQueueMetrics = () =>
  useApiQuery<QueueMetricsData>(
    keys.queueMetrics(),
    '/scalability/queue-metrics',
    dynamic(30_000),
  );

export const useStorageMetrics = () =>
  useApiQuery<StorageMetricsData>(
    keys.storageMetrics(),
    '/scalability/storage-metrics',
    dynamic(60_000),
  );

export const useCapacityMetrics = () =>
  useApiQuery<CapacityMetricsData>(
    keys.capacityMetrics(),
    '/scalability/capacity-metrics',
    dynamic(60_000),
  );

export const useAutoScaling = () =>
  useApiQuery<AutoScalingData>(
    keys.autoScaling(),
    '/scalability/auto-scaling',
    dynamic(60_000),
  );

export const useResilience = () =>
  useApiQuery<ResilienceData>(
    keys.resilienceMetrics(),
    '/scalability/resilience-metrics',
    dynamic(60_000),
  );

export const useIncidents = () =>
  useApiQuery<IncidentsData>(
    keys.incidents(),
    '/scalability/incidents',
    dynamic(60_000),
  );

export const useForecasts = () =>
  useApiQuery<ForecastsData>(
    keys.forecasts(),
    '/scalability/forecasts',
    dynamic(),
  );

export const useLoadTests = () =>
  useApiQuery<LoadTestsData>(
    keys.loadTests(),
    '/scalability/load-tests',
    dynamic(),
  );

export const useCosts = () =>
  useApiQuery<CostsData>(keys.costs(), '/scalability/costs', dynamic());

export const useAlertRules = () =>
  useApiQuery<AlertRulesData>(
    keys.alertRules(),
    '/scalability/alert-rules',
    dynamic(60_000),
  );

export const useIntegrationMetrics = () =>
  useApiQuery<IntegrationMetricsData>(
    keys.integrationMetrics(),
    '/scalability/integration-metrics',
    dynamic(60_000),
  );

export const usePerformanceMetrics = () =>
  useApiQuery<PerformanceMetricsData>(
    keys.performanceMetrics(),
    '/scalability/performance-metrics',
    dynamic(30_000),
  );

// §23-24 — o backend responde 403 a perfis não autorizados; sem retry.
export const useReportCatalog = () =>
  useApiQuery<ReportCatalogData>(keys.reportCatalog(), '/scalability/reports', {
    staleTime: STALE_TIME.STATIC,
    retry: false,
  });

export const useReport = (type: string | null) =>
  useApiQuery<ReportData>(
    keys.report(type ?? ''),
    `/scalability/reports/${type}`,
    {
      staleTime: STALE_TIME.DYNAMIC,
      enabled: type !== null,
      retry: false,
    },
  );

export const useScalabilitySettings = () =>
  useApiQuery<SettingsData>(keys.settings(), '/scalability/settings', {
    staleTime: STALE_TIME.DYNAMIC,
    retry: false,
  });

export const useScalabilityIntegrations = () =>
  useApiQuery<Integration[]>(keys.integrations(), '/scalability/integrations', {
    staleTime: STALE_TIME.DYNAMIC,
    params: { limit: 100 },
    select: unwrapList<Integration[]>,
  });

export const useScalabilityAutomations = () =>
  useApiQuery<AutomationRule[]>(
    keys.automations(),
    '/scalability/automations',
    {
      staleTime: STALE_TIME.DYNAMIC,
      params: { limit: 100 },
      select: unwrapList<AutomationRule[]>,
    },
  );

export const useScalabilityAlerts = () =>
  useApiQuery<Alert[]>(keys.alerts(), '/scalability/alerts', {
    staleTime: STALE_TIME.DYNAMIC,
    params: { isResolved: false, limit: 100 },
    select: unwrapList<Alert[]>,
  });

export const useSlaConfigs = () =>
  useApiQuery<SlaConfig[]>(keys.sla(), '/scalability/sla', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

export const useContentDelivery = () =>
  useApiQuery<ContentDeliveryConfig | null>(
    keys.contentDelivery(),
    '/scalability/content-delivery',
    {
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

/** §15-17 — só ADMIN altera limites, política de scaling e resiliência. */
export function useCanEditInfra(): boolean {
  return useCurrentRole() === 'ADMIN';
}

// ─── Acções ────────────────────────────────────────────────────────────────

type Done = () => void;

/**
 * Todas as mutations do módulo, já com toast de sucesso/erro e reportError.
 * `done` (opcional) corre só em caso de sucesso, p. ex. para fechar um modal.
 */
export function useScalabilityActions() {
  const notify = useToast();
  const { data: currentUser } = useCurrentUser();

  const callbacks = (
    source: string,
    okTitle: string,
    failTitle: string,
    done?: Done,
  ) => ({
    onSuccess: () => {
      notify({ title: okTitle, intent: 'success' as const });
      done?.();
    },
    onError: (err: unknown) => {
      reportError(err, { source: `ScalabilityPage.${source}` });
      notify({ title: failTitle, intent: 'danger' as const });
    },
  });
  const saveFail = 'Não foi possível guardar as alterações';

  const syncIntegration = useApiMutation<unknown, number>(
    (integrationId) =>
      apiClient.post('/scalability/integrations/sync', { integrationId }),
    { invalidateKeys: [keys.integrations(), keys.dashboard()] },
  );
  const executeRule = useApiMutation<unknown, number>(
    (ruleId) => apiClient.post('/scalability/automations/execute', { ruleId }),
    { invalidateKeys: [keys.automations(), keys.dashboard()] },
  );
  const resolveAlert = useApiMutation<unknown, string>(
    (id) =>
      apiClient.patch(`/scalability/alerts/${id}/resolve`, {
        resolvedBy: currentUser ? String(currentUser.id) : 'unknown',
      }),
    { invalidateKeys: [keys.alerts(), keys.dashboard()] },
  );
  const saveCapacity = useApiMutation<
    unknown,
    { maxConcurrentUsers: number; maxApiRps: number }
  >((v) => apiClient.patch('/scalability/capacity-limits', v), {
    invalidateKeys: [keys.capacityMetrics()],
  });
  const saveAutoScaling = useApiMutation<unknown, AutoScalingUpdate>(
    (v) => apiClient.patch('/scalability/auto-scaling', v),
    { invalidateKeys: [keys.autoScaling()] },
  );
  const saveResilience = useApiMutation<unknown, ResilienceUpdate>(
    (v) => apiClient.patch('/scalability/resilience', v),
    { invalidateKeys: [keys.resilienceMetrics()] },
  );
  const createIncident = useApiMutation<unknown, IncidentCreate>(
    (v) => apiClient.post('/scalability/incidents', v),
    { invalidateKeys: [keys.incidents()] },
  );
  const updateIncident = useApiMutation<
    unknown,
    { id: string; body: IncidentUpdate }
  >((v) => apiClient.patch(`/scalability/incidents/${v.id}`, v.body), {
    invalidateKeys: [keys.incidents()],
  });
  const saveDbCapacity = useApiMutation<unknown, number | null>(
    (dbCapacityGb) =>
      apiClient.patch('/scalability/forecast-settings', { dbCapacityGb }),
    { invalidateKeys: [keys.forecasts()] },
  );
  const createLoadTest = useApiMutation<unknown, LoadTestCreate>(
    (v) => apiClient.post('/scalability/load-tests', v),
    { invalidateKeys: [keys.loadTests()] },
  );
  const updateLoadTest = useApiMutation<
    unknown,
    { id: string; body: LoadTestUpdate }
  >((v) => apiClient.patch(`/scalability/load-tests/${v.id}`, v.body), {
    invalidateKeys: [keys.loadTests()],
  });
  const saveCosts = useApiMutation<unknown, CostsSave>(
    (v) => apiClient.put('/scalability/costs', v),
    { invalidateKeys: [keys.costs()] },
  );
  const evaluateAlerts = useApiMutation<unknown, void>(
    () => apiClient.post('/scalability/alert-rules/evaluate', {}),
    { invalidateKeys: [keys.alertRules(), keys.alerts(), keys.dashboard()] },
  );
  const saveSettings = useApiMutation<unknown, SettingsUpdate>(
    (v) => apiClient.patch('/scalability/settings', v),
    {
      invalidateKeys: [
        keys.settings(),
        keys.alertRules(),
        keys.capacityMetrics(),
      ],
    },
  );

  return {
    syncIntegration: (id: number) =>
      syncIntegration.mutate(
        id,
        callbacks(
          'onSyncIntegration',
          'Sincronização iniciada',
          'Não foi possível iniciar a sincronização',
        ),
      ),
    executeRule: (id: number) =>
      executeRule.mutate(
        id,
        callbacks(
          'onExecuteRule',
          'Execução iniciada',
          'Não foi possível executar a regra',
        ),
      ),
    resolveAlert: (id: string) =>
      resolveAlert.mutate(
        id,
        callbacks(
          'onResolveAlert',
          'Alerta resolvido',
          'Não foi possível resolver o alerta',
        ),
      ),
    saveCapacity: (v: { maxConcurrentUsers: number; maxApiRps: number }) =>
      saveCapacity.mutate(
        v,
        callbacks('saveCapacity', 'Limites guardados', saveFail),
      ),
    saveAutoScaling: (v: AutoScalingUpdate) =>
      saveAutoScaling.mutate(
        v,
        callbacks('saveAutoScaling', 'Política guardada', saveFail),
      ),
    saveResilience: (v: ResilienceUpdate) =>
      saveResilience.mutate(
        v,
        callbacks('saveResilience', 'Resiliência guardada', saveFail),
      ),
    saveDbCapacity: (gb: number | null) =>
      saveDbCapacity.mutate(
        gb,
        callbacks('saveDbCapacity', 'Capacidade da BD guardada', saveFail),
      ),
    createIncident: (v: IncidentCreate, done: Done) =>
      createIncident.mutate(
        v,
        callbacks(
          'createIncident',
          'Incidente registado',
          'Não foi possível registar o incidente',
          done,
        ),
      ),
    updateIncident: (id: string, body: IncidentUpdate, done: Done) =>
      updateIncident.mutate(
        { id, body },
        callbacks(
          'updateIncident',
          'Incidente actualizado',
          'Não foi possível actualizar o incidente',
          done,
        ),
      ),
    createLoadTest: (v: LoadTestCreate, done: Done) =>
      createLoadTest.mutate(
        v,
        callbacks(
          'createLoadTest',
          'Teste de carga registado',
          'Não foi possível registar o teste',
          done,
        ),
      ),
    updateLoadTest: (id: string, body: LoadTestUpdate, done: Done) =>
      updateLoadTest.mutate(
        { id, body },
        callbacks(
          'updateLoadTest',
          'Teste actualizado',
          'Não foi possível actualizar o teste',
          done,
        ),
      ),
    saveCosts: (v: CostsSave, done: Done) =>
      saveCosts.mutate(
        v,
        callbacks(
          'saveCosts',
          'Custos guardados',
          'Não foi possível guardar os custos',
          done,
        ),
      ),
    evaluateAlerts: () =>
      evaluateAlerts.mutate(
        undefined,
        callbacks(
          'evaluateAlerts',
          'Regras avaliadas',
          'Não foi possível avaliar as regras',
        ),
      ),
    saveSettings: (v: SettingsUpdate, done: Done) =>
      saveSettings.mutate(
        v,
        callbacks(
          'saveSettings',
          'Configurações guardadas',
          'Não foi possível guardar as configurações',
          done,
        ),
      ),
    pending: {
      infra:
        saveCapacity.isPending ||
        saveAutoScaling.isPending ||
        saveResilience.isPending,
      incident: createIncident.isPending || updateIncident.isPending,
      forecast: saveDbCapacity.isPending,
      loadTest: createLoadTest.isPending || updateLoadTest.isPending,
      costs: saveCosts.isPending,
      alertsEvaluating: evaluateAlerts.isPending,
      settings: saveSettings.isPending,
    },
  };
}
