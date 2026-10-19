// components/enrollments/TeamView.tsx
// Separador "Equipa" — progresso/compliance dos subordinados directos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import { AlertTriangle, CircleCheck, ListChecks, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressCard } from './ProgressCard';
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
      <div className="space-y-5">
        {data.team.map((member) => {
          const compliance =
            member.stats.total > 0
              ? Math.round((member.stats.completed / member.stats.total) * 100)
              : 100;
          return (
            <ProgressCard
              key={member.id}
              seed={member.id}
              tag="Equipa"
              icon={Users}
              title={member.fullName}
              subtitle={member.email}
              avatar={{ name: member.fullName, url: member.avatarUrl }}
              infos={[
                { icon: ListChecks, text: `Total: ${member.stats.total}` },
                {
                  icon: CircleCheck,
                  text: `Concluídos: ${member.stats.completed}`,
                },
                {
                  icon: AlertTriangle,
                  text: `Atrasados: ${member.stats.overdue}`,
                  danger: member.stats.overdue > 0,
                },
              ]}
              progress={{ value: compliance, label: 'Conformidade' }}
            />
          );
        })}
      </div>
    </div>
  );
}
