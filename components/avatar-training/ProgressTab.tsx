// components/avatar-training/ProgressTab.tsx
// Progresso dos Formandos (docs/Avatar_Training.md §2). O âmbito (próprio /
// equipa / todos) é decidido pelo backend — o frontend só mostra o que recebe.

'use client';

import { useState } from 'react';
import { Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ASSIGNMENT_STATUS } from './constants';
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
      <Skeleton
        rows={4}
        itemClassName="h-12 rounded-card bg-surface-sunken animate-pulse"
      />
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
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full text-left font-body text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-4 py-2">Formando</th>
              <th className="px-4 py-2">Sessão</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Prazo</th>
              <th className="px-4 py-2 text-right">Tentativas</th>
              <th className="px-4 py-2 text-right">Melhor nota</th>
              <th className="px-4 py-2 text-right">Evolução</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 text-ink">{r.user?.fullName ?? '—'}</td>
                <td className="px-4 py-2 text-ink-muted">
                  {r.session?.title ?? '—'}
                </td>
                <td className="px-4 py-2">
                  <StatusBadge
                    value={r.status}
                    map={ASSIGNMENT_STATUS}
                    variant="dot"
                  />
                </td>
                <td className="px-4 py-2 text-ink-muted">
                  {r.dueDate ? formatDate(r.dueDate) : '—'}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {r.attemptsCount}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {r.bestScore ?? '—'}
                </td>
                <td className="px-4 py-2 text-right font-mono">
                  {r.evolution === null
                    ? '—'
                    : `${r.evolution > 0 ? '+' : ''}${r.evolution}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
