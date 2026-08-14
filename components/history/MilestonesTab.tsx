// components/history/MilestonesTab.tsx
// Tab "Marcos": lista de marcos de carreira do colaborador. Extraído
// de app/(platform)/history/page.tsx.

'use client';

import { Award } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Milestone } from './types';

export function MilestonesTab() {
  const { data = [], isLoading: loading } = useApiQuery<Milestone[]>(
    queryKeys.history.milestones(),
    '/history/milestones/me',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  if (data.length === 0)
    return (
      <EmptyState
        icon={Award}
        title="Sem marcos de carreira registados ainda"
        description="Os teus marcos aparecem aqui à medida que os vais alcançando"
      />
    );

  return (
    <div className="space-y-3">
      {data.map((m, i) => (
        <div
          key={i}
          className="rounded-card border border-warning bg-warning-subtle p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-2xl shrink-0">
            {m.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink">{m.title}</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {new Date(m.date).toLocaleDateString('pt', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span
              className={`text-xs px-2 py-0.5 rounded-pill font-semibold ${
                m.impactScore >= 80
                  ? 'bg-success-subtle text-success-ink'
                  : 'bg-warning-subtle text-warning-ink'
              }`}
            >
              {m.impactScore} pts
            </span>
            <p className="text-[10px] text-ink-faint mt-1">{m.type}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
