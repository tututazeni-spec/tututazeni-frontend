// components/leader/TalentPipelineTab.tsx
// Tab "Talentos": pipeline de talento por secção (high potentials,
// prontos para promoção, em desenvolvimento, em risco). Extraído de
// app/(platform)/leader/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TalentPipeline } from './types';

export function TalentPipelineTab() {
  const { data, isLoading: loading } = useApiQuery<TalentPipeline>(
    queryKeys.leader.pipeline(),
    '/leaders/my-talent-pipeline',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-28 rounded-card"
      />
    );

  const sections: Array<{
    key: keyof TalentPipeline;
    label: string;
    className: string;
  }> = [
    {
      key: 'hipos',
      label: 'Colaboradores de Alto Potencial',
      className: 'border-warning bg-warning-subtle',
    },
    {
      key: 'promotionReady',
      label: ' Prontos para Promoção',
      className: 'border-success bg-success-subtle',
    },
    {
      key: 'developing',
      label: ' Em Desenvolvimento',
      className: 'border-info bg-info-subtle',
    },
    {
      key: 'atRisk',
      label: 'Em Risco',
      className: 'border-danger bg-danger-subtle',
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((s) => {
        const items = data?.[s.key] ?? [];
        if (!items.length) return null;
        return (
          <div key={s.key} className={`rounded-card border p-4 ${s.className}`}>
            <h4 className="mb-3 font-display font-semibold text-ink">
              {s.label} ({items.length})
            </h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {items.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-control border border-surface bg-surface px-3 py-2.5"
                >
                  <Avatar name={u.user.fullName} url={u.user.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-medium text-ink">
                      {u.user.fullName}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {u.user.position?.name}
                    </p>
                  </div>
                  <div className="text-right font-body text-xs">
                    <p className="font-bold text-ink">
                      {u.score?.toFixed(1) ?? '–'}
                    </p>
                    <p className="text-ink-faint">score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {!(
        data?.hipos?.length ||
        data?.promotionReady?.length ||
        data?.atRisk?.length
      ) && (
        <EmptyState
          title="Sem dados de banco de talentos"
          description="Ainda não há dados de banco de talentos disponíveis para a tua equipa."
        />
      )}
    </div>
  );
}
