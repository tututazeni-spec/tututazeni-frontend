// components/events/OrganizerView.tsx
// Separador "Organizador" — KPIs e lista dos meus eventos com
// ocupação. Dados próprios + apresentação. Extraído de
// app/(platform)/events/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from './atoms';
import { STATUS_CFG } from './constants';
import type { EventStatus, OrganizerDashboard } from './types';

export function OrganizerView() {
  const { data, isLoading } = useApiQuery<OrganizerDashboard>(
    queryKeys.events.organizerDashboard(),
    '/events/organizer/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de eventos', value: data.metrics.totalEvents },
          {
            label: 'Próximos',
            value: data.metrics.upcomingEvents,
            color: 'text-blue-600',
          },
          {
            label: 'Total participantes',
            value: data.metrics.totalParticipants,
            color: 'text-emerald-600',
          },
          {
            label: 'NPS médio',
            value: data.metrics.avgNps ? `${data.metrics.avgNps}/10` : '—',
            color: 'text-amber-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Eventos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Os meus eventos
        </div>
        {data.events.map((e) => {
          return (
            <div
              key={e.id}
              className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {e.title}
                  </span>
                  <StatusBadge
                    value={e.status as EventStatus}
                    map={STATUS_CFG}
                    fallback={STATUS_CFG.PUBLISHED}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  {fmtDate(e.startAt)}
                </div>
                {e.maxCapacity > 0 && (
                  <div className="mt-1 w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${(e.occupancyRate ?? 0) >= 90 ? 'bg-red-400' : 'bg-blue-400'}`}
                      style={{
                        width: `${Math.min(e.occupancyRate ?? 0, 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-gray-900">
                  {e.participants}/{e.maxCapacity}
                </div>
                <div className="text-xs text-gray-400">
                  {e.occupancyRate ?? 0}% ocupação
                </div>
                {e.avgNps && (
                  <div className="text-xs text-amber-600">
                    NPS {e.avgNps}/10
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {data.events.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Sem eventos criados
          </div>
        )}
      </div>
    </div>
  );
}
