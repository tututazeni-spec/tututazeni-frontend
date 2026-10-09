// components/enrollments/TeamView.tsx
// Separador "Equipa" — progresso/compliance dos subordinados directos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TeamProgress } from './types';

export function TeamView() {
  const { data, isLoading } = useApiQuery<TeamProgress>(
    queryKeys.enrollments.team(),
    '/enrollments/team',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-16 rounded-card bg-surface-sunken"
      />
    );

  if (data.team.length === 0)
    return (
      <div className="rounded-card border border-dashed border-border py-12 text-center text-sm text-ink-faint">
        Sem subordinados directos
      </div>
    );

  return (
    <div>
      <div className="mb-4 text-xs text-ink-faint">
        {data.total} membros na equipa
      </div>
      <div className="space-y-3">
        {data.team.map((member) => {
          const compliance =
            member.stats.total > 0
              ? Math.round((member.stats.completed / member.stats.total) * 100)
              : 100;
          return (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/60 p-4 shadow-sm hover:bg-surface sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar
                  name={member.fullName}
                  url={member.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="break-words text-sm font-medium text-ink">
                    {member.fullName}
                  </div>
                  <div className="break-all text-xs text-ink-faint">
                    {member.email}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-mono text-sm text-ink-muted">
                    {member.stats.total}
                  </div>
                  <div className="text-xs text-ink-faint">Total</div>
                </div>
                <div>
                  <div className="font-mono text-sm text-success-ink">
                    {member.stats.completed}
                  </div>
                  <div className="text-xs text-ink-faint">Concluídos</div>
                </div>
                <div>
                  <div
                    className={`font-mono text-sm ${member.stats.overdue > 0 ? 'font-semibold text-danger-ink' : 'text-ink-faint'}`}
                  >
                    {member.stats.overdue}
                  </div>
                  <div className="text-xs text-ink-faint">Atrasados</div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:w-44">
                <div className="flex-1">
                  <ProgressBar value={compliance} />
                </div>
                <span className="w-10 text-right font-mono text-xs text-ink-muted">
                  {compliance}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
