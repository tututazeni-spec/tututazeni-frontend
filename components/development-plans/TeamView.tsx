// components/development-plans/TeamView.tsx
// Vista "Equipa": lista de PDIs activos dos colaboradores da equipa.
// Extraído de app/(platform)/development-plans/page.tsx.

'use client';

import { TriangleAlert, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { progressTextClass } from './utils';
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

  if (isLoading) return <Skeleton rows={3} />;

  return (
    <div>
      <div className="mb-4 font-body text-xs text-ink-faint">
        {plans.length} planos activos na equipa
      </div>
      {plans.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sem PDIs activos na equipa"
          description="Ainda não há planos de desenvolvimento activos para os teus colaboradores."
        />
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <Card
              key={p.id}
              onClick={() => onSelect(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(p.id);
                }
              }}
              className="flex cursor-pointer items-center gap-4 p-4 transition-shadow duration-150 hover:shadow-hover"
            >
              <Avatar
                name={p.user.fullName}
                url={p.user.avatarUrl ?? undefined}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {p.name}
                </div>
                <div className="font-body text-xs text-ink-faint">
                  {p.user.fullName} · {p.user.position?.name ?? '—'}
                </div>
                <div className="mt-1">
                  <ProgressBar value={p.progress} />
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div
                  className={cn(
                    'font-data text-sm font-bold',
                    progressTextClass(p.progress),
                  )}
                >
                  {p.progress}%
                </div>
                {(p.overdueActions ?? 0) > 0 && (
                  <div className="flex items-center gap-1 font-body text-xs text-danger">
                    <TriangleAlert size={14} strokeWidth={1.75} />
                    {p.overdueActions} atrasadas
                  </div>
                )}
                {p.pendingApproval && (
                  <div className="font-body text-xs font-medium text-warning-ink">
                    Ag. aprovação
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
