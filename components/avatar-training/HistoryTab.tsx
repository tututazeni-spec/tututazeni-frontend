// components/avatar-training/HistoryTab.tsx
// Histórico (docs/Avatar_Training.md §2): tentativas anteriores e resultados.
// GET /avatar-training/history (próprio; outros utilizadores só com permissão).

'use client';

import { History } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ATTEMPT_STATUS } from './constants';
import type { HistoryRow } from './types';

export function HistoryTab() {
  const { data, isLoading, error, refetch } = useApiQuery<HistoryRow[]>(
    queryKeys.avatarTraining.history(),
    '/avatar-training/history',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        itemClassName="h-14 rounded-card bg-surface-sunken animate-pulse"
      />
    );
  if (data.length === 0)
    return (
      <EmptyState
        icon={History}
        title="Sem histórico"
        description="As sessões que realizar ficam registadas aqui, com os respectivos resultados."
      />
    );

  return (
    <div className="space-y-2">
      {data.map((h) => (
        <div
          key={h.id}
          className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-3"
        >
          <div className="min-w-0">
            <div className="truncate font-display text-sm font-semibold text-ink">
              {h.assignment.session.title}
            </div>
            <div className="font-body text-xs text-ink-muted">
              {h.assignment.session.program.title} · tentativa{' '}
              {h.attemptNumber} · {formatDateTime(h.startedAt)}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {h.score !== null && (
              <span className="font-mono text-xs text-ink-muted">
                {h.score}
              </span>
            )}
            <StatusBadge value={h.status} map={ATTEMPT_STATUS} variant="dot" />
          </div>
        </div>
      ))}
    </div>
  );
}
