// components/scalability/ScalabilityPanels.tsx
// Painéis "ligados" do módulo de Escalabilidade: cada um lê os dados de que
// precisa pelos hooks de hooks/useScalability.ts e renderiza a aba
// apresentacional correspondente. Substitui as ~65 props que o container
// passava à vista (ver ScalabilityShell em ScalabilityDashboardView.tsx).

'use client';

import { useState } from 'react';
import { downloadAuditFile } from '@/components/audit/downloadAuditFile';
import {
  useAlertRules,
  useApiMetrics,
  useAutoScaling,
  useCanEditInfra,
  useCapacityMetrics,
  useContentDelivery,
  useCosts,
  useDatabaseMetrics,
  useForecasts,
  useFrontendMetrics,
  useIncidents,
  useIntegrationMetrics,
  useLoadTests,
  useOverviewCharts,
  usePerformanceMetrics,
  useQueueMetrics,
  useReport,
  useReportCatalog,
  useResilience,
  useScalabilityActions,
  useScalabilityAlerts,
  useScalabilityAutomations,
  useScalabilityDashboard,
  useScalabilityIntegrations,
  useScalabilitySettings,
  useSlaConfigs,
  useStorageMetrics,
  useUsersLoad,
} from '@/hooks/useScalability';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import type { ReportFormat } from './types';
import {
  AlertsTab,
  ApiTab,
  AutomationsTab,
  ContentTab,
  DatabaseTab,
  IntegrationsTab,
  OverviewTab,
  PerformanceTab,
  QueuesTab,
  SlaTab,
  StorageTab,
  UsersTab,
} from './ScalabilityDashboardView';
import { AutoScalingTab, CapacityTab, ResilienceTab } from './InfraTabs';
import { ForecastsTab, IncidentsTab } from './IncidentsForecastsTabs';
import {
  AlertRulesSection,
  CostsTab,
  LoadTestsTab,
} from './LoadTestsCostsAlertsTabs';
import { ReportsTab, SettingsTab } from './ReportsSettingsTabs';
import {
  EndpointHistoryChart,
  HourlyHistoryCharts,
  QueueHistoryChart,
  RecommendationsCard,
} from './HistoryCharts';
import { WhatIfPanel } from './WhatIfPanel';
import { RetentionStatusCard } from './RetentionStatusCard';

// O container (page.tsx) só renderiza os painéis depois do dashboard carregar,
// por isso aqui `data` existe; o `null` cobre só o intervalo de uma
// invalidação/refetch falhado.
function useDashboardData() {
  return useScalabilityDashboard().data ?? null;
}

export function OverviewPanel() {
  const dashboard = useDashboardData();
  const { data: charts = null } = useOverviewCharts();
  return dashboard && <OverviewTab data={dashboard} charts={charts} />;
}

export function PerformancePanel() {
  const dashboard = useDashboardData();
  const { data: perf = null } = usePerformanceMetrics();
  if (!dashboard) return null;
  return (
    <>
      <PerformanceTab data={dashboard} perf={perf} />
      <div className="mt-6">
        <EndpointHistoryChart />
      </div>
    </>
  );
}

export function IntegrationsPanel() {
  const dashboard = useDashboardData();
  const { data: integrations = [] } = useScalabilityIntegrations();
  const { data: metrics = null } = useIntegrationMetrics();
  const { syncIntegration } = useScalabilityActions();
  if (!dashboard) return null;
  return (
    <IntegrationsTab
      tenantId={dashboard.tenantInfo.id}
      integrations={integrations}
      metrics={metrics}
      onSync={syncIntegration}
    />
  );
}

export function AutomationsPanel() {
  const { data: rules = [] } = useScalabilityAutomations();
  const { executeRule } = useScalabilityActions();
  return <AutomationsTab rules={rules} onExecute={executeRule} />;
}

export function AlertsPanel() {
  const { data: alerts = [] } = useScalabilityAlerts();
  const { data: alertRules = null } = useAlertRules();
  const canEdit = useCanEditInfra();
  const { resolveAlert, evaluateAlerts, pending } = useScalabilityActions();
  return (
    <div className="flex flex-col gap-8">
      <AlertRulesSection
        data={alertRules}
        canEdit={canEdit}
        evaluating={pending.alertsEvaluating}
        onEvaluate={evaluateAlerts}
      />
      <AlertsTab alerts={alerts} onResolve={resolveAlert} />
    </div>
  );
}

export function SlaPanel() {
  const dashboard = useDashboardData();
  const { data: slaConfigs = [] } = useSlaConfigs();
  return dashboard && <SlaTab data={dashboard} slaConfigs={slaConfigs} />;
}

export function UsersPanel() {
  const dashboard = useDashboardData();
  const { data: load = null } = useUsersLoad();
  return dashboard && <UsersTab data={dashboard} load={load} />;
}

export function ApiPanel() {
  const { data: api = null } = useApiMetrics();
  return <ApiTab api={api} />;
}

export function DatabasePanel() {
  const { data: db = null } = useDatabaseMetrics();
  return <DatabaseTab db={db} />;
}

export function ContentPanel() {
  const dashboard = useDashboardData();
  const { data: config = null } = useContentDelivery();
  const { data: frontend = null } = useFrontendMetrics();
  if (!dashboard) return null;
  return (
    <ContentTab
      tenantId={dashboard.tenantInfo.id}
      config={config}
      frontend={frontend}
    />
  );
}

export function QueuesPanel() {
  const { data: queues = null } = useQueueMetrics();
  return (
    <>
      <QueuesTab queues={queues} />
      <div className="mt-6">
        <QueueHistoryChart />
      </div>
    </>
  );
}

export function StoragePanel() {
  const { data: storage = null } = useStorageMetrics();
  return <StorageTab storage={storage} />;
}

export function CapacityPanel() {
  const { data: capacity = null } = useCapacityMetrics();
  const canEdit = useCanEditInfra();
  const { saveCapacity, pending } = useScalabilityActions();
  return (
    <>
      <CapacityTab
        key={JSON.stringify(capacity?.limits)}
        capacity={capacity}
        canEdit={canEdit}
        saving={pending.infra}
        onSaveLimits={saveCapacity}
      />
      <div className="mt-6">
        <WhatIfPanel />
      </div>
      <div className="mt-6">
        <RecommendationsCard />
      </div>
      <div className="mt-6">
        <HourlyHistoryCharts />
      </div>
    </>
  );
}

export function AutoScalingPanel() {
  const { data = null } = useAutoScaling();
  const canEdit = useCanEditInfra();
  const { saveAutoScaling, pending } = useScalabilityActions();
  return (
    <AutoScalingTab
      key={data?.policy.updatedAt}
      data={data}
      canEdit={canEdit}
      saving={pending.infra}
      onSave={saveAutoScaling}
    />
  );
}

export function ResiliencePanel() {
  const { data = null } = useResilience();
  const canEdit = useCanEditInfra();
  const { saveResilience, pending } = useScalabilityActions();
  return (
    <ResilienceTab
      key={JSON.stringify(data?.indicators)}
      data={data}
      canEdit={canEdit}
      saving={pending.infra}
      onSave={saveResilience}
    />
  );
}

export function IncidentsPanel() {
  const { data = null } = useIncidents();
  const canEdit = useCanEditInfra();
  const { createIncident, updateIncident, pending } = useScalabilityActions();
  return (
    <IncidentsTab
      data={data}
      canEdit={canEdit}
      saving={pending.incident}
      onCreate={createIncident}
      onUpdate={updateIncident}
    />
  );
}

export function ForecastsPanel() {
  const { data = null } = useForecasts();
  const canEdit = useCanEditInfra();
  const { saveDbCapacity, pending } = useScalabilityActions();
  return (
    <ForecastsTab
      data={data}
      canEdit={canEdit}
      saving={pending.forecast}
      onSaveDbCapacity={saveDbCapacity}
    />
  );
}

export function LoadTestsPanel() {
  const { data = null } = useLoadTests();
  const canEdit = useCanEditInfra();
  const { createLoadTest, updateLoadTest, pending } = useScalabilityActions();
  return (
    <LoadTestsTab
      data={data}
      canEdit={canEdit}
      saving={pending.loadTest}
      onCreate={createLoadTest}
      onUpdate={updateLoadTest}
    />
  );
}

export function CostsPanel() {
  const { data = null } = useCosts();
  const canEdit = useCanEditInfra();
  const { saveCosts, pending } = useScalabilityActions();
  return (
    <CostsTab
      data={data}
      canEdit={canEdit}
      saving={pending.costs}
      onSave={saveCosts}
    />
  );
}

export function ReportsPanel() {
  const notify = useToast();
  // Estado só desta aba: relatório seleccionado e formato em exportação.
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ReportFormat | null>(null);
  const { data: catalog = null } = useReportCatalog();
  const { data: report = null, isFetching } = useReport(selected);

  const onExport = async (type: string, format: ReportFormat) => {
    setExporting(format);
    try {
      await downloadAuditFile(
        `/scalability/reports/${type}/export`,
        { format },
        `scalability-${type}.${format}`,
      );
      notify({ title: 'Relatório exportado', intent: 'success' });
    } catch (err) {
      reportError(err, { source: 'ScalabilityPage.exportReport' });
      notify({
        title: 'Não foi possível exportar o relatório',
        intent: 'danger',
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <ReportsTab
      catalog={catalog}
      report={selected ? report : null}
      selected={selected}
      loadingReport={isFetching}
      exporting={exporting}
      onSelect={setSelected}
      onExport={(type, format) => void onExport(type, format)}
    />
  );
}

export function SettingsPanel() {
  const { data = null } = useScalabilitySettings();
  const canEdit = useCanEditInfra();
  const { saveSettings, pending } = useScalabilityActions();
  return (
    <>
      <SettingsTab
        data={data}
        canEdit={canEdit}
        saving={pending.settings}
        onSave={saveSettings}
      />
      <div className="mt-6">
        <RetentionStatusCard />
      </div>
    </>
  );
}
