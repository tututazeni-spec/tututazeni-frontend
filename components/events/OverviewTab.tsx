// components/events/OverviewTab.tsx
// Separador "Visão Geral" (docs/events.md ponto 1) — dashboard do módulo:
// KPIs, breakdown por estado/tipo/unidade/departamento e lista de
// próximos eventos. GET /events/stats (ADMIN/RH/GESTOR). Mesmo padrão de
// components/onboarding/OverviewTab.tsx (RankedList local + KpiCard +
// StatusBadge strip). Clicar num evento da lista abre o DetailView
// existente (join/leave/checkin/feedback) — não mexe no CreateEventModal.

'use client';

import { useState } from 'react';
import {
  Ban,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarX,
  ClipboardCheck,
  ClipboardList,
  FileEdit,
  Hourglass,
  Radio,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { type NavyStatTone } from '@/components/ui/NavyStatCard';
import { NavyStatGroupCard } from '@/components/ui/NavyStatGroupCard';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { DetailView } from './DetailView';
import type { EventDashboard, EventStatus, EventType } from './types';

const STATUS_CARD: Record<string, { icon: LucideIcon; tone: NavyStatTone }> = {
  DRAFT: { icon: FileEdit, tone: 'orange' },
  PUBLISHED: { icon: CalendarClock, tone: 'blue' },
  LIVE: { icon: Radio, tone: 'red' },
  ENDED: { icon: CalendarCheck, tone: 'green' },
  CANCELLED: { icon: Ban, tone: 'red' },
};

// Uma cor por linha (até 6, o máximo mostrado em RankedList)
const ROW_COLORS = [
  '#1877F2',
  '#218653',
  '#E99A16',
  '#EF4657',
  '#7C5CD6',
  '#14A3B8',
];

function RankedList({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, number]>;
}) {
  const sorted = [...rows].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(...sorted.map(([, n]) => n), 1);
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="bg-brand/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
        {title}
      </div>
      <div className="p-4">
        {sorted.length === 0 ? (
          <EmptyState variant="inline" title="Sem dados" />
        ) : (
          <div className="space-y-2">
            {sorted.map(([label, count], i) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="w-28 shrink-0 truncate font-body text-xs text-ink-muted"
                  title={label}
                >
                  {label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((count / max) * 100)}%`,
                      backgroundColor: ROW_COLORS[i % ROW_COLORS.length],
                    }}
                  />
                </div>
                <span className="w-6 text-right font-mono text-xs text-ink-faint">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function OverviewTab({
  onOpenStatus,
}: {
  /** Abre a lista de eventos já filtrada por este estado. */
  onOpenStatus?: (status: EventStatus) => void;
}) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data, isLoading, error, refetch } = useApiQuery<EventDashboard>(
    queryKeys.events.dashboard(),
    '/events/stats',
    {
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

  if (detailId !== null) {
    return <DetailView eventId={detailId} onBack={() => setDetailId(null)} />;
  }

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="h-24 bg-surface-sunken rounded-card"
      />
    );

  const byTypeLabeled: Array<[string, number]> = Object.entries(
    data.byType,
  ).map(([k, v]) => [TYPE_CFG[k as EventType]?.label ?? k, v]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          tab="events"
          icon={CalendarDays}
          label="Total de eventos"
          value={data.total}
        />
        <KpiCard
          icon={CalendarClock}
          label="Eventos próximos"
          iconIntent="caution"
          value={data.upcomingCount}
          intent="info"
        />
        <KpiCard
          icon={Radio}
          label="Eventos em curso"
          value={data.liveCount}
          intent={data.liveCount > 0 ? 'danger' : 'primary'}
        />
        <KpiCard
          icon={CalendarCheck}
          label="Eventos concluídos"
          iconIntent="success"
          value={data.endedCount}
        />
        <KpiCard
          icon={CalendarX}
          label="Eventos cancelados"
          iconIntent="danger"
          value={data.cancelledCount}
          intent={data.cancelledCount > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          tab="participants"
          icon={UserPlus}
          label="Participantes inscritos"
          value={data.registeredParticipants}
          intent="accent"
        />
        <KpiCard
          tab="participants"
          icon={UserCheck}
          label="Participantes confirmados"
          value={data.confirmedParticipants}
          intent="success"
        />
        <DonutStatCard
          label="Taxa de participação"
          value={data.participationRate}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          tab="participants"
          icon={Hourglass}
          label="Inscrições pendentes"
          iconIntent="caution"
          value={data.pendingRegistrations}
          intent={data.pendingRegistrations > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          tab="checkin-attendance"
          icon={ClipboardCheck}
          label="Check-ins realizados"
          value={data.checkinsDone}
          intent="success"
        />
        <KpiCard
          tab="evaluation"
          icon={ClipboardList}
          label="Avaliações pendentes"
          iconIntent="warning"
          value={data.pendingEvaluations}
          intent={data.pendingEvaluations > 0 ? 'warning' : 'primary'}
        />
      </div>

      {/* Status breakdown */}
      <NavyStatGroupCard
        title="Eventos por Estado"
        items={Object.entries(STATUS_CFG).map(([status, cfg]) => {
          const look = STATUS_CARD[status] ?? STATUS_CARD.DRAFT;
          return {
            key: status,
            icon: look.icon,
            tone: look.tone,
            label: cfg.label,
            value: data.byStatus[status] ?? 0,
            onClick: onOpenStatus
              ? () => onOpenStatus(status as EventStatus)
              : undefined,
          };
        })}
      />

      {/* Breakdowns */}
      <div className="grid grid-cols-3 gap-3">
        <RankedList title="Eventos por tipo" rows={byTypeLabeled} />
        <RankedList
          title="Eventos por unidade"
          rows={Object.entries(data.byUnit)}
        />
        <RankedList
          title="Eventos por departamento"
          rows={Object.entries(data.byDepartment)}
        />
      </div>

      {/* Próximos eventos */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border bg-brand/60 px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-white">
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
                <span
                  className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-body text-xs ${typeCfg.cls} !text-ink`}
                >
                  <TypeIcon
                    size={12}
                    strokeWidth={1.75}
                    className="text-ink"
                  />{' '}
                  {typeCfg.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {e.title}
                  </div>
                  <div className="truncate font-body text-xs text-ink-faint">
                    {e.location ?? (e.modalidade === 'ONLINE' ? 'Online' : '—')}
                  </div>
                </div>
                <div className="shrink-0 font-body text-xs text-ink-faint">
                  {fmtDateTime(e.startAt)}
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-xs text-ink-faint">
                  {e._count.participants} insc.
                </div>
                <StatusBadge
                  value={e.status as EventStatus}
                  map={STATUS_CFG}
                  className="!text-ink"
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
