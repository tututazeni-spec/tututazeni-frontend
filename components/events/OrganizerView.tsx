// components/events/OrganizerView.tsx
// Separador "Organizador" — KPIs e lista dos meus eventos com
// ocupação. Dados próprios + apresentação. Extraído de
// app/(platform)/events/page.tsx. Migrado para a fundação de design:
// KpiCard da fundação substitui os cartões bespoke; ProgressBar
// (mono-cor) substitui a barra recolorida por limiar — o tier passa
// para um ponto de estado junto à % de ocupação, mesmo padrão do
// EventCard.

'use client';

import { Calendar, TrendingUp, Trophy, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { occupancyDotCls, STATUS_CFG } from './constants';
import type { EventStatus, OrganizerDashboard } from './types';

export function OrganizerView() {
  const { data, isLoading } = useApiQuery<OrganizerDashboard>(
    queryKeys.events.organizerDashboard(),
    '/events/organizer/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          icon={Calendar}
          label="Total de eventos"
          value={data.metrics.totalEvents}
          intent="primary"
        />
        <KpiCard
          icon={Calendar}
          label="Próximos"
          value={data.metrics.upcomingEvents}
          intent="info"
        />
        <KpiCard
          icon={Users}
          label="Total participantes"
          value={data.metrics.totalParticipants}
          intent="success"
        />
        <KpiCard
          icon={TrendingUp}
          label="NPS médio"
          value={data.metrics.avgNps ? `${data.metrics.avgNps}/10` : '—'}
          intent="warning"
        />
      </div>

      {/* Eventos */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Os meus eventos
        </div>
        {data.events.map((e) => {
          const occupancyRate = e.occupancyRate ?? 0;
          return (
            <div
              key={e.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="truncate font-body text-sm font-medium text-ink">
                    {e.title}
                  </span>
                  <StatusBadge
                    value={e.status as EventStatus}
                    map={STATUS_CFG}
                    fallback={STATUS_CFG.PUBLISHED}
                  />
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {fmtDate(e.startAt)}
                </div>
                {e.maxCapacity > 0 && (
                  <div className="mt-1 w-40">
                    <ProgressBar value={Math.min(occupancyRate, 100)} />
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-body text-sm font-bold text-ink">
                  {e.participants}/{e.maxCapacity}
                </div>
                <div className="flex items-center justify-end gap-1.5 font-body text-xs text-ink-faint">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      occupancyDotCls(e.occupancyRate),
                    )}
                  />
                  {occupancyRate}% ocupação
                </div>
                {e.avgNps && (
                  <div className="font-body text-xs text-warning-ink">
                    NPS {e.avgNps}/10
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {data.events.length === 0 && (
          <EmptyState
            icon={Trophy}
            title="Sem eventos criados"
            description="Os eventos que organizares aparecem aqui com as suas métricas."
          />
        )}
      </Card>
    </div>
  );
}
