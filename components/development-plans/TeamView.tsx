// components/development-plans/TeamView.tsx
// Vista "Equipa": lista de PDIs activos dos colaboradores da equipa.
// Extraído de app/(platform)/development-plans/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import type { TeamPlanSummary } from './types';

interface TeamViewProps {
  onSelect: (id: number) => void;
}

export function TeamView({ onSelect }: TeamViewProps) {
  const { data: plans = [], isLoading } = useApiQuery<TeamPlanSummary[]>(
    queryKeys.developmentPlans.teamDashboard(),
    '/development-plans/team/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="text-xs text-gray-400 mb-4">
        {plans.length} planos activos na equipa
      </div>
      <div className="space-y-3">
        {plans.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm"
          >
            <Avatar
              name={p.user.fullName}
              avatarUrl={p.user.avatarUrl}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {p.name}
              </div>
              <div className="text-xs text-gray-400">
                {p.user.fullName} · {p.user.position?.name ?? '—'}
              </div>
              <div className="mt-1">
                <ProgressBar pct={p.progress} />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-bold font-mono text-blue-700">
                {p.progress}%
              </div>
              {(p.overdueActions ?? 0) > 0 && (
                <div className="text-xs text-red-600">
                  ⚠ {p.overdueActions} atrasadas
                </div>
              )}
              {p.pendingApproval && (
                <div className="text-xs text-amber-600 font-medium">
                  Ag. aprovação
                </div>
              )}
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem PDIs activos na equipa
          </div>
        )}
      </div>
    </div>
  );
}
