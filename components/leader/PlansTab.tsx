// components/leader/PlansTab.tsx
// Tab "PDIs": lista de planos de desenvolvimento da equipa com
// aprovação rápida. Extraído de app/(platform)/leader/page.tsx.

'use client';

import { Target } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TeamPlanEntry } from './types';

function progressTextClass(progress: number): string {
  if (progress >= 75) return 'text-success';
  if (progress >= 40) return 'text-warning';
  return 'text-danger';
}

export function PlansTab() {
  const { data = [], isLoading: loading } = useApiQuery<TeamPlanEntry[]>(
    queryKeys.leader.plans(),
    '/leaders/my-team-plans',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div className="space-y-3">
      {data.map((p, i) => (
        <Card key={i} className="flex items-center gap-4 p-4">
          <Avatar name={p.user?.fullName ?? '?'} url={p.user?.avatarUrl} />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <p className="truncate font-body text-sm font-semibold text-ink">
                {p.user?.fullName}
              </p>
              <span className="shrink-0 text-base">{p.health}</span>
            </div>
            <p className="truncate font-body text-xs text-ink-muted">{p.name}</p>
            <div className="mb-0.5 mt-1 flex justify-between font-body text-[10px]">
              <span className="text-ink-faint">
                {p.actCompleted}/{p.totalActions} acções
              </span>
              <span className={`font-bold ${progressTextClass(p.progress)}`}>
                {p.progress}%
              </span>
            </div>
            <ProgressBar value={p.progress} />
          </div>
          <Button
            size="sm"
            intent="secondary"
            className="shrink-0"
            onClick={() => {
              void apiClient
                .patch(`/leaders/plans/${p.id}/approve`, {})
                .catch(() => {});
            }}
          >
            Aprovar
          </Button>
        </Card>
      ))}
      {data.length === 0 && (
        <EmptyState
          icon={Target}
          title="Sem PDIs activos"
          description="A equipa não tem planos de desenvolvimento activos de momento."
        />
      )}
    </div>
  );
}
