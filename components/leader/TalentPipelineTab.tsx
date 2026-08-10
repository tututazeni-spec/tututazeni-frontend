// components/leader/TalentPipelineTab.tsx
// Tab "Talentos": pipeline de talento por secção (high potentials,
// prontos para promoção, em desenvolvimento, em risco). Extraído de
// app/(platform)/leader/page.tsx.

'use client';

import { Award } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import type { TalentPipeline } from './types';

export function TalentPipelineTab() {
  const { data, isLoading: loading } = useApiQuery<TalentPipeline>(
    queryKeys.leader.pipeline(),
    '/leaders/my-talent-pipeline',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading) return <Skeleton />;

  const sections: Array<{
    key: keyof TalentPipeline;
    label: string;
    bg: string;
    border: string;
  }> = [
    {
      key: 'hipos',
      label: '🌟 High Potentials',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    {
      key: 'promotionReady',
      label: '🚀 Prontos para Promoção',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    {
      key: 'developing',
      label: '📈 Em Desenvolvimento',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    {
      key: 'atRisk',
      label: '⚠️ Em Risco',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((s) => {
        const items = data?.[s.key] ?? [];
        if (!items.length) return null;
        return (
          <div
            key={s.key}
            className={`${s.bg} border ${s.border} rounded-xl p-4`}
          >
            <h4 className="font-semibold text-slate-700 mb-3">
              {s.label} ({items.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white rounded-lg px-3 py-2.5 border border-white"
                >
                  <Avatar name={u.user.fullName} url={u.user.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {u.user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {u.user.position?.name}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-slate-700">
                      {u.score?.toFixed(1) ?? '–'}
                    </p>
                    <p className="text-slate-400">score</p>
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
        <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
          <Award size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem dados de talent pipeline disponíveis</p>
        </div>
      )}
    </div>
  );
}
