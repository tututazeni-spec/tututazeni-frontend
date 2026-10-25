// components/avatar-training/ProgressTab.tsx
// Progresso dos Formandos (docs/Avatar_Training.md §2). O âmbito (próprio /
// equipa / todos) é decidido pelo backend — o frontend só mostra o que recebe.

'use client';

import { useState } from 'react';
import { CalendarDays, Repeat, Star, TrendingUp, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyBadge, NavyCard } from '@/components/courses/NavyCard';
import { ASSIGNMENT_STATUS } from './constants';
import { ASSIGNMENT_TONE, CardGrid } from './cards';
import type { Paginated, ProgressRow } from './types';

const LIMIT = 20;

export function ProgressTab() {
  const [page, setPage] = useState(1);
  const params = { page, limit: LIMIT };
  const { data, isLoading, error, refetch } = useApiQuery<
    Paginated<ProgressRow>
  >(queryKeys.avatarTraining.progress(params), '/avatar-training/progress', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
  });

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton rows={4} itemClassName="h-12 rounded-card bg-surface-sunken" />
    );
  if (data.data.length === 0)
    return (
      <EmptyState
        icon={Users}
        title="Sem progresso para mostrar"
        description="Ainda não existem atribuições no seu âmbito."
      />
    );

  const pages = Math.max(1, Math.ceil(data.total / LIMIT));
  return (
    <div className="space-y-3">
      <CardGrid>
        {data.data.map((r) => (
          <NavyCard
            key={r.id}
            seed={r.session?.id ?? r.id}
            kicker={r.user?.fullName ?? '—'}
            kickerIcon={Users}
            title={r.session?.title ?? '—'}
            badge={
              <NavyBadge tone={ASSIGNMENT_TONE[r.status]}>
                {ASSIGNMENT_STATUS[r.status].label}
              </NavyBadge>
            }
            infos={[
              {
                icon: CalendarDays,
                value: r.dueDate ? formatDate(r.dueDate) : '—',
                label: 'Prazo',
              },
              {
                icon: Repeat,
                value: String(r.attemptsCount),
                label: 'Tentativas',
              },
              {
                icon: Star,
                value: String(r.bestScore ?? '—'),
                label: 'Melhor nota',
              },
              {
                icon: TrendingUp,
                value:
                  r.evolution === null
                    ? '—'
                    : `${r.evolution > 0 ? '+' : ''}${r.evolution}`,
                label: 'Evolução',
              },
            ]}
          />
        ))}
      </CardGrid>
      <div className="flex items-center justify-between font-body text-xs text-ink-muted">
        <span>
          {data.total} registo(s) · página {page} de {pages}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            intent="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            intent="ghost"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </Button>
        </div>
      </div>
    </div>
  );
}
