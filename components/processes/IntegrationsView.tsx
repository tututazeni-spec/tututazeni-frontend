// components/processes/IntegrationsView.tsx
// Matriz de integração do módulo Processes com os restantes módulos da INNOVA
// (docs/Modulo_Processes.md §15 e §16). O estado de cada módulo vem da
// actividade real (processos iniciados, modelos que o referenciam, eventos
// recebidos) — não de uma declaração. Mostra também os eventos recebidos, as
// falhas e permite repetir de forma controlada os que falharam.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Plug } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import { ATTEMPT_STATUS_MAP } from './audit-utils';
import { Skeleton } from './Skeleton';
import type {
  IntegrationModuleStatus,
  PaginatedIntegrationLogs,
  IntegrationOverview,
} from './types';

export interface IntegrationsViewProps {
  canRetry: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
const MODULE_STATUS_MAP: StatusBadgeMap<IntegrationModuleStatus> = {
  ACTIVE: { label: 'Activa', cls: 'bg-success-subtle text-success-ink' },
  CONFIGURED: { label: 'Modelos configurados', cls: 'bg-info-subtle text-info-ink' },
  NO_ACTIVITY: { label: 'Sem actividade', cls: 'bg-surface-sunken text-ink-faint' },
  ERRORS: { label: 'Com falhas', cls: 'bg-danger-subtle text-danger-ink' },
};

export function IntegrationsView({ canRetry, onOpenInstance }: IntegrationsViewProps) {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [logModule, setLogModule] = useState<string | undefined>();
  const [logStatus, setLogStatus] = useState(ALL);
  const [logPage, setLogPage] = useState(1);

  const overview = useApiQuery<IntegrationOverview>(
    queryKeys.processes.integrations(),
    '/processes/integrations',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const logParams = {
    page: String(logPage),
    limit: '10',
    ...(logModule ? { module: logModule } : {}),
    ...(logStatus !== ALL ? { status: logStatus } : {}),
  };
  const logs = useApiQuery<PaginatedIntegrationLogs>(
    queryKeys.processes.integrationLogs(logParams),
    '/processes/integrations/logs',
    { params: logParams, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const retry = useApiMutation((id: number) => apiClient.post(`/processes/integrations/logs/${id}/retry`, {}), {
    invalidateKeys: [queryKeys.processes.all],
    onSuccess: () => notify({ title: 'Evento repetido com sucesso', intent: 'success' }),
    onError: (e) => notify({ title: e.message, intent: 'danger' }),
  });

  const o = overview.data;
  const q = search.trim().toLowerCase();
  const modules = (o?.modules ?? []).filter(
    (m) =>
      (status === ALL || m.status === status) &&
      (!q || m.label.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-6">
      {overview.isLoading && <Skeleton rows={4} />}
      {overview.error && <div className="font-body text-sm text-danger">{overview.error.message}</div>}

      {o && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Módulos na matriz" value={o.summary.total} sub="integração prevista" intent="primary" />
            <KpiCard label="Activas" value={o.summary.active} sub="já iniciaram processos" intent="success" />
            <KpiCard label="Com falhas" value={o.summary.withErrors} sub="eventos por tratar" intent="danger" />
            <KpiCard
              label="Recepção de eventos"
              value={o.inboundEnabled ? 'Activa' : 'Desactivada'}
              sub={o.restrictedToModules ? 'restrita a módulos autorizados' : 'todos os módulos'}
              intent={o.inboundEnabled ? 'info' : 'warning'}
            />
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <Input
              placeholder="Procurar módulo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Select
              items={[
                { value: ALL, label: 'Todos os estados' },
                { value: 'ACTIVE', label: 'Activas' },
                { value: 'CONFIGURED', label: 'Modelos configurados' },
                { value: 'ERRORS', label: 'Com falhas' },
                { value: 'NO_ACTIVITY', label: 'Sem actividade' },
              ]}
              value={status}
              onValueChange={setStatus}
              className="w-56"
            />
          </div>

          {modules.length === 0 ? (
            <EmptyState icon={Plug} title="Nenhum módulo" description="Nenhum módulo corresponde aos filtros." className="mx-auto max-w-xl" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((m) => (
                <div key={m.key} className="rounded-card border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-body text-sm font-semibold text-ink">{m.label}</div>
                    <StatusBadge value={m.status} map={MODULE_STATUS_MAP} />
                  </div>
                  <p className="mt-1 font-body text-xs text-ink-muted">{m.description}</p>
                  {m.note && <p className="mt-1 font-body text-xs text-warning-ink">{m.note}</p>}
                  <dl className="mt-3 grid grid-cols-4 gap-2 font-body text-xs">
                    {[
                      ['Processos', m.instances],
                      ['Em curso', m.openInstances],
                      ['Modelos', m.templates],
                      ['Eventos', m.events],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-ink-faint">{k}</dt>
                        <dd className="font-medium text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-2 flex items-center justify-between font-body text-xs text-ink-faint">
                    <span>{m.lastActivityAt ? `Última actividade ${formatDateTime(m.lastActivityAt)}` : 'Sem actividade'}</span>
                    {m.failedEvents > 0 && (
                      <button
                        type="button"
                        className="text-danger-ink hover:underline"
                        onClick={() => {
                          setLogModule(m.key);
                          setLogStatus('FAILED');
                          setLogPage(1);
                        }}
                      >
                        {m.failedEvents} falha(s)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {o.unmappedModules.length > 0 && (
            <p className="font-body text-xs text-ink-muted">
              Origens ainda fora da matriz: {o.unmappedModules.join(', ')}.
            </p>
          )}
        </>
      )}

      {/* Eventos recebidos */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <div className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">Eventos recebidos</div>
          <Select
            items={[
              { value: ALL, label: 'Qualquer resultado' },
              { value: 'SUCCESS', label: 'Sucesso' },
              { value: 'FAILED', label: 'Falhas' },
              { value: 'DUPLICATE', label: 'Duplicados ignorados' },
              { value: 'REJECTED', label: 'Rejeitados' },
            ]}
            value={logStatus}
            onValueChange={(v) => {
              setLogStatus(v);
              setLogPage(1);
            }}
            className="w-52"
          />
          {logModule && (
            <button
              type="button"
              onClick={() => {
                setLogModule(undefined);
                setLogPage(1);
              }}
              className="font-body text-xs text-primary hover:underline"
            >
              Módulo: {logModule} ✕
            </button>
          )}
        </div>
        {logs.data && logs.data.data.length === 0 && (
          <p className="rounded-card border border-border p-4 font-body text-sm text-ink-faint">
            Nenhum evento de integração recebido ainda.
          </p>
        )}
        {logs.data && logs.data.data.length > 0 && (
          <div className="divide-y divide-border rounded-card border border-border">
            {logs.data.data.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div className="min-w-0 font-body text-sm text-ink">
                  <div className="font-medium">
                    {l.module} · {l.event}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatDateTime(l.createdAt)} · {l.processCode ?? '—'} · {l.attempts} tentativa(s)
                    {l.correlationId ? ` · correlação ${l.correlationId}` : ''}
                  </div>
                  {l.errorMessage && <div className="truncate text-xs text-danger-ink">{l.errorMessage}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={l.status} map={ATTEMPT_STATUS_MAP} />
                  {l.instanceId && (
                    <Button intent="ghost" size="sm" onClick={() => onOpenInstance(l.instanceId!)}>
                      Abrir processo
                    </Button>
                  )}
                  {canRetry && l.status === 'FAILED' && (
                    <Button intent="secondary" size="sm" onClick={() => retry.mutate(l.id)} loading={retry.isPending}>
                      Repetir
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {logs.data && <Pagination page={logs.data.page} totalPages={logs.data.totalPages} onPageChange={setLogPage} />}
      </div>
    </div>
  );
}
