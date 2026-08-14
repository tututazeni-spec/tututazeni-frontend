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
      <div className="overflow-hidden rounded-card border border-border">
        <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-3 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
          <div>Colaborador</div>
          <div>Total</div>
          <div>Concluídos</div>
          <div>Atrasados</div>
          <div>Compliance</div>
        </div>
        {data.team.map((member) => {
          const compliance =
            member.stats.total > 0
              ? Math.round((member.stats.completed / member.stats.total) * 100)
              : 100;
          return (
            <div
              key={member.id}
              className="grid grid-cols-[1fr_80px_80px_80px_100px] items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="flex items-center gap-3">
                <Avatar name={member.fullName} url={member.avatarUrl ?? undefined} size="sm" />
                <div>
                  <div className="text-sm font-medium text-ink">
                    {member.fullName}
                  </div>
                  <div className="text-xs text-ink-faint">{member.email}</div>
                </div>
              </div>
              <div className="font-mono text-sm text-ink-muted">
                {member.stats.total}
              </div>
              <div className="font-mono text-sm text-success-ink">
                {member.stats.completed}
              </div>
              <div
                className={`font-mono text-sm ${member.stats.overdue > 0 ? 'font-semibold text-danger-ink' : 'text-ink-faint'}`}
              >
                {member.stats.overdue}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ProgressBar value={compliance} />
                  </div>
                  <span className="w-8 font-mono text-xs text-ink-muted">
                    {compliance}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
