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
      </Tabs>
    </div>
  );
}
