// components/organization/TimelineView.tsx
// Vista "Timeline": movimentações organizacionais (promoções,
// transferências, admissões, etc.). Extraído de
// app/(platform)/organization/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar, Skeleton } from './atoms';
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
          cls: 'bg-gray-100',
          icon: '📝',
        };
        return (
          <div
            key={change.id}
            className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-4"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${cfg.cls}`}
            >
              {cfg.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Avatar
                  name={change.user.fullName}
                  avatarUrl={change.user.avatarUrl}
                  size="sm"
                />
                <span className="text-sm font-medium text-gray-900">
                  {change.user.fullName}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.cls}`}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {fmtDate(change.effectiveDate)}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap gap-2">
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
          </div>
        );
      })}
      {data.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem movimentações registadas
        </div>
      )}
    </div>
  );
}
