'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Cog,
  Flame,
  Gauge,
  HeartPulse,
  History,
  LayoutDashboard,
  Plug,
  Lock,
  Workflow,
  Zap,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ModulesTab,
  OverviewTab,
  ProcessesTab,
} from '@/components/monitoring/PlatformMonitoringView';
import {
  AutomationsTab,
  IntegrationsTab,
  PerformanceTab,
} from '@/components/monitoring/CoreMonitoringView';
import {
  AlertsTab,
  HealthTab,
  IncidentsTab,
  type AlertCommand,
  type AlertsFilters,
} from '@/components/monitoring/AlertsIncidentsHealthView';
import {
  HistoryTab,
  JobsTab,
  SlaTab,
} from '@/components/monitoring/OperationsMonitoringView';
import type {
  AlertsData,
  AutomationsData,
  CreateIncidentPayload,
  HealthData,
  IncidentDetail,
  IncidentRow,
  IncidentsData,
  IntegrationsData,
  PerformanceData,
  UpdateIncidentPayload,
} from '@/components/monitoring/coreMonitoringTypes';
import type {
  HistoryData,
  HistoryKind,
  JobsData,
  SlaData,
} from '@/components/monitoring/slaJobsHistoryTypes';
import type {
  ModulesData,
  OverviewData,
  ProcessesData,
} from '@/components/monitoring/platformTypes';

// Mesmos papéis do @Roles() de monitoring.controller.ts (backend).
const ALLOWED = ['ADMIN', 'AUDITOR', 'RH', 'DIRECTOR', 'GESTOR'];
// As acções sobre alertas e incidentes são só ADMIN no backend.
const CAN_ACT = ['ADMIN'];
const REFRESH_MS = 60_000;

function Body<T>({
  query,
  children,
}: {
  query: { data?: T; isLoading: boolean; isError: boolean };
  children: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) return <Skeleton rows={4} />;
  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="Não foi possível carregar"
        description="Tenta novamente dentro de instantes."
      />
    );
  }
  return <>{children(query.data)}</>;
}

const TABS: PillTabItem[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Estado da plataforma',
    icon: LayoutDashboard,
  },
  { id: 'modules', label: 'Módulos', hint: 'Saúde por módulo', icon: Activity },
  {
    id: 'processes',
    label: 'Processos',
    hint: 'Fluxos em curso',
    icon: Workflow,
  },
  {
    id: 'automations',
    label: 'Automações',
    hint: 'Regras e execuções',
    icon: Zap,
  },
  {
    id: 'integrations',
    label: 'Integrações',
    hint: 'Sistemas externos',
    icon: Plug,
  },
  {
    id: 'performance',
    label: 'Performance',
    hint: 'Latência e carga',
    icon: Gauge,
  },
  {
    id: 'alerts',
    label: 'Alertas',
    hint: 'Avisos activos',
    icon: AlertTriangle,
  },
  {
    id: 'incidents',
    label: 'Incidentes',
    hint: 'Ocorrências abertas',
    icon: Flame,
  },
  {
    id: 'health',
    label: 'Health Check',
    hint: 'Verificações',
    icon: HeartPulse,
  },
  { id: 'jobs', label: 'Jobs', hint: 'Tarefas em fila', icon: Cog },
  { id: 'sla', label: 'SLA', hint: 'Cumprimento de prazos', icon: Clock },
  {
    id: 'history',
    label: 'Histórico',
    hint: 'Eventos passados',
    icon: History,
  },
];

export default function MonitoringPage() {
  const role = useCurrentRole();
  const notify = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [slaDays, setSlaDays] = useState(30);
  const [historyDays, setHistoryDays] = useState(7);
  const [historyKind, setHistoryKind] = useState<HistoryKind | null>(null);
  const [alertFilters, setAlertFilters] = useState<AlertsFilters>({
    area: null,
    state: null,
  });
  const [incidentGroup, setIncidentGroup] = useState<
    'ACTIVE' | 'RESOLVED' | null
  >(null);
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRow | null>(
    null,
  );
  // `role` undefined (arranque pós-login) passa — evita piscar o bloqueio.
  const blocked = !!role && !ALLOWED.includes(role);
  const canAct = !!role && CAN_ACT.includes(role);

  const opts = { staleTime: STALE_TIME.DYNAMIC, refetchInterval: REFRESH_MS };
  const on = (t: string) => ({ ...opts, enabled: !blocked && tab === t });

  const overview = useApiQuery<OverviewData>(
    queryKeys.monitoring.overview(),
    '/monitoring/overview',
    on('overview'),
  );
  const modules = useApiQuery<ModulesData>(
    queryKeys.monitoring.modules(),
    '/monitoring/modules',
    on('modules'),
  );
  const processes = useApiQuery<ProcessesData>(
    queryKeys.monitoring.processes(),
    '/monitoring/processes',
    on('processes'),
  );
  const automations = useApiQuery<AutomationsData>(
    queryKeys.monitoring.automations(),
    '/monitoring/automations',
    on('automations'),
  );
  const integrations = useApiQuery<IntegrationsData>(
    queryKeys.monitoring.integrations(),
    '/monitoring/integrations',
    on('integrations'),
  );
  const performance = useApiQuery<PerformanceData>(
    queryKeys.monitoring.performance(),
    '/monitoring/performance',
    on('performance'),
  );
  const alerts = useApiQuery<AlertsData>(
    queryKeys.monitoring.alerts(alertFilters.area, alertFilters.state),
    '/monitoring/alerts',
    {
      ...on('alerts'),
      params: {
        area: alertFilters.area,
        state: alertFilters.state,
        limit: 100,
      },
    },
  );
  const incidents = useApiQuery<IncidentsData>(
    queryKeys.monitoring.incidents(incidentGroup),
    '/monitoring/incidents',
    { ...on('incidents'), params: { group: incidentGroup } },
  );
  const incidentDetail = useApiQuery<IncidentDetail>(
    queryKeys.monitoring.incident(
      selectedIncident?.kind ?? '',
      selectedIncident?.id ?? '',
    ),
    `/monitoring/incidents/${selectedIncident?.kind}/${selectedIncident?.id}`,
    {
      staleTime: STALE_TIME.DYNAMIC,
      enabled: !blocked && !!selectedIncident,
    },
  );
  const health = useApiQuery<HealthData>(
    queryKeys.monitoring.health(),
    '/monitoring/health',
    on('health'),
  );
  const jobs = useApiQuery<JobsData>(
    queryKeys.monitoring.jobs(),
    '/monitoring/jobs',
    on('jobs'),
  );
  const sla = useApiQuery<SlaData>(
    queryKeys.monitoring.sla(slaDays),
    '/monitoring/sla',
    { ...on('sla'), params: { days: slaDays } },
  );
  const history = useApiQuery<HistoryData>(
    queryKeys.monitoring.history(historyDays, historyKind),
    '/monitoring/history',
    {
      ...on('history'),
      params: { days: historyDays, kind: historyKind },
    },
  );

  const fail = (source: string, title: string) => (err: Error) => {
    reportError(err, { source });
    notify({ title, intent: 'danger' });
  };

  const alertMutation = useApiMutation<unknown, AlertCommand>(
    (c) => {
      const base = `/monitoring/alerts/${c.id}`;
      switch (c.kind) {
        case 'acknowledge':
          return apiClient.patch(`${base}/acknowledge`);
        case 'note':
          return apiClient.post(`${base}/actions`, { note: c.note });
        case 'resolve':
          return apiClient.patch(`${base}/resolve`, { note: c.note });
        case 'incident':
          return apiClient.post(`${base}/incident`);
      }
    },
    {
      invalidateKeys: [
        [...queryKeys.monitoring.all, 'alerts'],
        [...queryKeys.monitoring.all, 'incidents'],
      ],
      onSuccess: (_d, c) =>
        notify({
          title:
            c.kind === 'incident'
              ? 'Incidente aberto a partir do alerta'
              : 'Alerta actualizado',
          intent: 'success',
        }),
      onError: fail(
        'MonitoringPage.alert',
        'Não foi possível actualizar o alerta',
      ),
    },
  );

  const createIncident = useApiMutation<unknown, CreateIncidentPayload>(
    (p) => apiClient.post('/monitoring/incidents', p),
    {
      invalidateKeys: [[...queryKeys.monitoring.all, 'incidents']],
      onSuccess: () => {
        setCreatingIncident(false);
        notify({ title: 'Incidente criado', intent: 'success' });
      },
      onError: fail(
        'MonitoringPage.createIncident',
        'Não foi possível criar o incidente',
      ),
    },
  );

  const updateIncident = useApiMutation<unknown, UpdateIncidentPayload>(
    (p) => apiClient.patch(`/monitoring/incidents/${selectedIncident?.id}`, p),
    {
      invalidateKeys: [
        [...queryKeys.monitoring.all, 'incidents'],
        [...queryKeys.monitoring.all, 'incident'],
      ],
      onSuccess: () =>
        notify({ title: 'Incidente actualizado', intent: 'success' }),
      onError: fail(
        'MonitoringPage.updateIncident',
        'Não foi possível actualizar o incidente',
      ),
    },
  );

  const refreshHealth = useApiMutation<HealthData, void>(
    () =>
      apiClient.get<HealthData>('/monitoring/health', {
        params: { fresh: 'true' },
      }),
    {
      onSuccess: (d) => qc.setQueryData(queryKeys.monitoring.health(), d),
      onError: fail(
        'MonitoringPage.health',
        'Não foi possível verificar agora',
      ),
    },
  );

  if (blocked) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Lock}
          title="Sem acesso"
          description="Esta secção não está disponível para o teu papel."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Monitorização
        </h1>
        <p className="font-body text-sm text-ink-muted">
          O que está a acontecer agora e o que está em risco.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <PillTabsList items={TABS} className="mb-4" />
        <TabsContent value="overview" className="mt-4">
          <Body query={overview}>{(d) => <OverviewTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="modules" className="mt-4">
          <Body query={modules}>{(d) => <ModulesTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="processes" className="mt-4">
          <Body query={processes}>{(d) => <ProcessesTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="automations" className="mt-4">
          <Body query={automations}>{(d) => <AutomationsTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <Body query={integrations}>
            {(d) => <IntegrationsTab data={d} />}
          </Body>
        </TabsContent>
        <TabsContent value="performance" className="mt-4">
          <Body query={performance}>{(d) => <PerformanceTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="alerts" className="mt-4">
          <Body query={alerts}>
            {(d) => (
              <AlertsTab
                data={d}
                filters={alertFilters}
                onFiltersChange={setAlertFilters}
                canAct={canAct}
                busy={alertMutation.isPending}
                onCommand={(c) => alertMutation.mutate(c)}
              />
            )}
          </Body>
        </TabsContent>
        <TabsContent value="incidents" className="mt-4">
          <Body query={incidents}>
            {(d) => (
              <IncidentsTab
                data={d}
                group={incidentGroup}
                onGroupChange={setIncidentGroup}
                canAct={canAct}
                busy={createIncident.isPending || updateIncident.isPending}
                creating={creatingIncident}
                onCreateClick={() => setCreatingIncident(true)}
                onCreate={(p) => createIncident.mutate(p)}
                onCloseCreate={() => setCreatingIncident(false)}
                selected={selectedIncident}
                detail={incidentDetail.data}
                detailLoading={incidentDetail.isLoading}
                onSelect={setSelectedIncident}
                onUpdate={(p) => updateIncident.mutate(p)}
              />
            )}
          </Body>
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <Body query={health}>
            {(d) => (
              <HealthTab
                data={d}
                refreshing={refreshHealth.isPending}
                onRefresh={() => refreshHealth.mutate()}
              />
            )}
          </Body>
        </TabsContent>
        <TabsContent value="jobs" className="mt-4">
          <Body query={jobs}>{(d) => <JobsTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="sla" className="mt-4">
          <Body query={sla}>
            {(d) => (
              <SlaTab data={d} days={slaDays} onDaysChange={setSlaDays} />
            )}
          </Body>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Body query={history}>
            {(d) => (
              <HistoryTab
                data={d}
                days={historyDays}
                kind={historyKind}
                onDaysChange={setHistoryDays}
                onKindChange={setHistoryKind}
              />
            )}
          </Body>
        </TabsContent>
      </Tabs>
    </div>
  );
}
