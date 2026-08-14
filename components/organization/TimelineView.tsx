// components/organization/TimelineView.tsx
// Vista "Timeline": movimentações organizacionais (promoções,
// transferências, admissões, etc.). Extraído de
// app/(platform)/organization/page.tsx.

'use client';

import { Clock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CHANGE_CFG } from './constants';
import type { OrgChange } from './types';

export function TimelineView() {
  const { data = [], isLoading } = useApiQuery<OrgChange[]>(
    queryKeys.organization.timeline(),
    '/organization/timeline',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map((change) => {
        const cfg = CHANGE_CFG[change.changeType] ?? {
          label: change.changeType,
          cls: 'bg-surface-sunken text-ink-muted',
          icon: '📝',
        };
        return (
          <Card key={change.id} className="flex items-start gap-4 p-4">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-card text-xl ${cfg.cls}`}
            >
              {cfg.icon}
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Avatar
                  name={change.user.fullName}
                  url={change.user.avatarUrl ?? undefined}
                  size="sm"
                />
                <span className="font-body text-sm font-medium text-ink">
                  {change.user.fullName}
                </span>
                <span
                  className={`rounded-control px-2 py-0.5 font-body text-xs font-medium ${cfg.cls}`}
                >
                  {cfg.label}
                </span>
                <span className="ml-auto font-body text-xs text-ink-faint">
                  {fmtDate(change.effectiveDate)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 font-body text-xs text-ink-muted">
                {change.fromDepartment && change.toDepartment && (
                  <span>
                    {change.fromDepartment.name} → {change.toDepartment.name}
                  </span>
                )}
                {change.fromPosition && change.toPosition && (
                  <span>
                    {change.fromPosition.name} → {change.toPosition.name}
                  </span>
                )}
                {change.reason && (
                  <span className="italic">&quot;{change.reason}&quot;</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      {data.length === 0 && (
        <EmptyState
          icon={Clock}
          title="Sem movimentações registadas"
          description="Ainda não existem movimentações organizacionais registadas."
        />
      )}
    </div>
  );
}
