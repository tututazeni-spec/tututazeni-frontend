// components/leader/PlansTab.tsx
// Tab "PDIs": lista de planos de desenvolvimento da equipa com
// aprovação rápida. Extraído de app/(platform)/leader/page.tsx.

'use client';

import { Target } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import type { TeamPlanEntry } from './types';

export function PlansTab() {
  const { data = [], isLoading: loading } = useApiQuery<TeamPlanEntry[]>(
    queryKeys.leader.plans(),
    '/leaders/my-team-plans',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-3">
      {data.map((p, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4"
        >
          <Avatar name={p.user?.fullName ?? '?'} url={p.user?.avatarUrl} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {p.user?.fullName}
              </p>
              <span className="text-base shrink-0">{p.health}</span>
            </div>
            <p className="text-xs text-slate-500 truncate">{p.name}</p>
            <div className="flex justify-between text-[10px] mt-1 mb-0.5">
              <span className="text-slate-400">
                {p.actCompleted}/{p.totalActions} acções
              </span>
              <span className="font-bold text-slate-600">{p.progress}%</span>
            </div>
            <ProgressBar
              value={p.progress}
              color={
                p.progress >= 75
                  ? 'bg-emerald-500'
                  : p.progress >= 40
                    ? 'bg-amber-400'
                    : 'bg-red-400'
              }
            />
          </div>
          <button
            onClick={() => {
              void apiClient
                .patch(`/leaders/plans/${p.id}/approve`, {})
                .catch(() => {});
            }}
            className="shrink-0 text-xs px-3 py-1.5 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50"
          >
            Aprovar
          </button>
        </div>
      ))}
      {data.length === 0 && (
        <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-100">
          <Target size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sem PDIs activos na equipa</p>
        </div>
      )}
    </div>
  );
}
