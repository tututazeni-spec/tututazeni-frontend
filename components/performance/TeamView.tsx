// components/performance/TeamView.tsx
// Separador "A minha equipa" — tabela de performance dos liderados.
// Dados próprios + apresentação. Extraído de
// app/(platform)/performance/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { PERF_CATEGORY_MAP, REVIEW_STATUS_MAP } from './constants';
import type { Cycle, ReviewStatus, TeamMember } from './types';

export function TeamView() {
  const dataQ = useApiQuery<{ team: TeamMember[]; total: number }>(
    queryKeys.performance.team(),
    '/performance/team',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const cycleQ = useApiQuery<Cycle | null>(
    queryKeys.performance.currentCycle(),
    '/performance/cycles/current',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  const data = dataQ.data ?? null;
  const cycle = cycleQ.data ?? null;
  const loading = dataQ.isLoading;

  if (loading) return <Skeleton />;
  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-gray-500">
          {data.total} membros na equipa
        </div>
        {cycle && (
          <div className="text-xs text-gray-400">Ciclo: {cycle.name}</div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_100px_120px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          <div>Colaborador</div>
          <div>Goals (%)</div>
          <div>Score</div>
          <div>Estado</div>
          <div>Pendências</div>
        </div>

        {data.team.map((member) => (
          <div
            key={member.user.id}
            className="grid grid-cols-[1fr_120px_120px_100px_120px] gap-3 items-center px-4 py-3.5 border-b border-gray-100 last:border-0 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={member.user.fullName}
                avatarUrl={member.user.avatarUrl}
                size="sm"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {member.user.fullName}
                </div>
                <div className="text-xs text-gray-400">
                  {member.user.position?.name ?? '—'}
                </div>
              </div>
            </div>
            <div>
              <ProgressBar
                pct={member.avgGoalProgress}
                color={
                  member.avgGoalProgress >= 75
                    ? 'bg-emerald-500'
                    : member.avgGoalProgress >= 40
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }
              />
            </div>
            <div className="text-sm font-mono font-medium text-gray-900">
              {member.latestReview?.score !== null &&
              member.latestReview?.score !== undefined
                ? member.latestReview.score
                : '—'}
              {member.latestReview?.category && (
                <StatusBadge
                  value={member.latestReview.category}
                  map={PERF_CATEGORY_MAP}
                />
              )}
            </div>
            <div>
              <StatusBadge
                value={(member.latestReview?.status ?? 'DRAFT') as ReviewStatus}
                map={REVIEW_STATUS_MAP}
                variant="dot"
              />
            </div>
            <div>
              {member.pendingSelfReview && (
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                  ⏳ Self pendente
                </span>
              )}
              {!member.pendingSelfReview && member.status === 'NOT_STARTED' && (
                <span className="text-xs text-gray-400">Não iniciado</span>
              )}
            </div>
          </div>
        ))}

        {data.team.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            Sem membros de equipa
          </div>
        )}
      </div>
    </div>
  );
}
