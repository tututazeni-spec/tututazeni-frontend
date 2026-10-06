'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ModulesTab,
  OverviewTab,
  ProcessesTab,
} from '@/components/monitoring/PlatformMonitoringView';
import {
  HistoryTab,
  JobsTab,
  SlaTab,
} from '@/components/monitoring/OperationsMonitoringView';
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

export default function MonitoringPage() {
  const role = useCurrentRole();
  const [tab, setTab] = useState('overview');
  const [slaDays, setSlaDays] = useState(30);
  const [historyDays, setHistoryDays] = useState(7);
  const [historyKind, setHistoryKind] = useState<HistoryKind | null>(null);
  // `role` undefined (arranque pós-login) passa — evita piscar o bloqueio.
  const blocked = !!role && !ALLOWED.includes(role);

  const opts = { staleTime: STALE_TIME.DYNAMIC, refetchInterval: REFRESH_MS };
  const overview = useApiQuery<OverviewData>(
    queryKeys.monitoring.overview(),
    '/monitoring/overview',
    { ...opts, enabled: !blocked && tab === 'overview' },
  );
  const modules = useApiQuery<ModulesData>(
    queryKeys.monitoring.modules(),
    '/monitoring/modules',
    { ...opts, enabled: !blocked && tab === 'modules' },
  );
  const processes = useApiQuery<ProcessesData>(
    queryKeys.monitoring.processes(),
    '/monitoring/processes',
    { ...opts, enabled: !blocked && tab === 'processes' },
  );
  const jobs = useApiQuery<JobsData>(queryKeys.monitoring.jobs(), '/monitoring/jobs', {
    ...opts,
    enabled: !blocked && tab === 'jobs',
  });
  const sla = useApiQuery<SlaData>(
    queryKeys.monitoring.sla(slaDays),
    `/monitoring/sla?days=${slaDays}`,
    { ...opts, enabled: !blocked && tab === 'sla' },
  );
  const history = useApiQuery<HistoryData>(
    queryKeys.monitoring.history(historyDays, historyKind),
    `/monitoring/history?days=${historyDays}${historyKind ? `&kind=${historyKind}` : ''}`,
    { ...opts, enabled: !blocked && tab === 'history' },
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
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="processes">Processos</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <Body query={overview}>{(d) => <OverviewTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="modules" className="mt-4">
          <Body query={modules}>{(d) => <ModulesTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="processes" className="mt-4">
          <Body query={processes}>{(d) => <ProcessesTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="jobs" className="mt-4">
          <Body query={jobs}>{(d) => <JobsTab data={d} />}</Body>
        </TabsContent>
        <TabsContent value="sla" className="mt-4">
          <Body query={sla}>
            {(d) => <SlaTab data={d} days={slaDays} onDaysChange={setSlaDays} />}
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
