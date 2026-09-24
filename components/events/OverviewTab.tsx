// components/events/OverviewTab.tsx
// Separador "Visão Geral" (docs/events.md ponto 1) — dashboard do módulo:
// KPIs, breakdown por estado/tipo/unidade/departamento e lista de
// próximos eventos. GET /events/stats (ADMIN/RH/GESTOR). Mesmo padrão de
// components/onboarding/OverviewTab.tsx (RankedList local + KpiCard +
// StatusBadge strip). Clicar num evento da lista abre o DetailView
// existente (join/leave/checkin/feedback) — não mexe no CreateEventModal.

'use client';

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { DetailView } from './DetailView';
import type { EventDashboard, EventStatus, EventType } from './types';

function RankedList({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const sorted = [...rows].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...sorted.map(([, n]) => n), 1);
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {sorted.length === 0 ? (
        <p className="py-4 text-center font-body text-sm text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(([label, count]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate font-body text-xs text-ink-muted" title={label}>
                {label}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round((count / max) * 100)}%` }}
                />
              </div>
              <span className="w-6 text-right font-mono text-xs text-ink-faint">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OverviewTab() {
  const [detailId, setDetailId] = useState<number | null>(null);
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useApiQuery<EventDashboard>(queryKeys.events.dashboard(), '/events/stats', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (detailId !== null) {
    return <DetailView eventId={detailId} onBack={() => setDetailId(null)} />;
  }

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="h-24 bg-surface-sunken rounded-card animate-pulse"
      />
    );

  const byTypeLabeled: Array<[string, number]> = Object.entries(data.byType).map(([k, v]) => [
    TYPE_CFG[k as EventType]?.label ?? k,
    v,
  ]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total de eventos" value={data.total} />
        <KpiCard label="Eventos próximos" value={data.upcomingCount} intent="info" />
        <KpiCard label="Eventos em curso" value={data.liveCount} intent={data.liveCount > 0 ? 'danger' : 'primary'} />
        <KpiCard label="Eventos concluídos" value={data.endedCount} />
        <KpiCard label="Eventos cancelados" value={data.cancelledCount} intent={data.cancelledCount > 0 ? 'warning' : 'primary'} />
        <KpiCard label="Participantes inscritos" value={data.registeredParticipants} intent="accent" />
        <KpiCard label="Participantes confirmados" value={data.confirmedParticipants} intent="success" />
        <KpiCard
          label="Taxa de participação"
          value={`${data.participationRate}%`}
          intent={data.participationRate >= 70 ? 'success' : 'warning'}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Inscrições pendentes" value={data.pendingRegistrations} intent={data.pendingRegistrations > 0 ? 'warning' : 'primary'} />
        <KpiCard label="Check-ins realizados" value={data.checkinsDone} intent="success" />
        <KpiCard label="Avaliações pendentes" value={data.pendingEvaluations} intent={data.pendingEvaluations > 0 ? 'warning' : 'primary'} />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(STATUS_CFG).map(([status, cfg]) => (
          <div key={status} className={`rounded-card px-3 py-2 text-center ${cfg.cls}`}>
            <div className="text-lg font-bold font-mono">{data.byStatus[status] ?? 0}</div>
            <div className="text-xs font-medium">{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-3 gap-3">
        <RankedList title="Eventos por tipo" rows={byTypeLabeled} />
        <RankedList title="Eventos por unidade" rows={Object.entries(data.byUnit)} />
        <RankedList title="Eventos por departamento" rows={Object.entries(data.byDepartment)} />
      </div>

      {/* Próximos eventos */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Próximos eventos
        </div>
        {data.upcomingEvents.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Sem eventos agendados"
            description="Não há eventos publicados com data futura."
            className="rounded-none border-0"
          />
        ) : (
          data.upcomingEvents.map((e) => {
            const typeCfg = TYPE_CFG[e.type] ?? TYPE_CFG.CORPORATE;
            const TypeIcon = typeCfg.icon;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => setDetailId(e.id)}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
              >
                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-body text-xs ${typeCfg.cls}`}>
                  <TypeIcon size={12} strokeWidth={1.75} /> {typeCfg.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-medium text-ink">{e.title}</div>
                  <div className="truncate font-body text-xs text-ink-faint">
                    {e.location ?? (e.modalidade === 'ONLINE' ? 'Online' : '—')}
                  </div>
                </div>
                <div className="shrink-0 font-body text-xs text-ink-faint">{fmtDateTime(e.startAt)}</div>
                <div className="w-16 shrink-0 text-right font-mono text-xs text-ink-faint">
                  {e._count.participants} insc.
                </div>
                <StatusBadge value={e.status as EventStatus} map={STATUS_CFG} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
