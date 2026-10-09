// components/enrollments/TeamView.tsx
// Separador "Equipa" — progresso/compliance dos subordinados directos.
// Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import {
  AlertTriangle,
  CircleCheck,
  ListChecks,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { NavyCard } from '@/components/courses/NavyCard';
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
            <NavyCard
              key={member.id}
              title={member.fullName}
              avatar={{ name: member.fullName, url: member.avatarUrl }}
              subtitle={member.email}
              subtitleIcon={Mail}
              infos={[
                {
                  icon: ListChecks,
                  value: String(member.stats.total),
                  label: 'Total',
                },
                {
                  icon: CircleCheck,
                  value: String(member.stats.completed),
                  label: 'Concluídos',
                },
                {
                  icon: AlertTriangle,
                  value: String(member.stats.overdue),
                  label: 'Atrasados',
                  danger: member.stats.overdue > 0,
                },
                {
                  icon: TrendingUp,
                  value: `${compliance}%`,
                  label: 'Conformidade',
                },
              ]}
            />
          );
        })}
      </div>
    </div>
  );
}
