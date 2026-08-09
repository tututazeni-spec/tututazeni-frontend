// components/avatar-training/HistoryTab.tsx
// Separador "Histórico" — resumo + lista de sessões passadas. Dados
// próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/avatar-training/page.tsx.

'use client';

import { Play } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { CATEGORY_CONFIG, SCORE_COLOR } from './constants';
import type { MyHistory } from './types';

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  ABANDONED: 'bg-slate-100 text-slate-500',
};

export function HistoryTab() {
  const { data, isLoading } = useApiQuery<MyHistory>(
    queryKeys.avatarTraining.myHistory(30),
    '/avatar-training/my-history',
    { params: { limit: 30 }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data?.stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: data.stats.total },
            { label: 'Concluídas', value: data.stats.completed },
            { label: 'Score Médio', value: data.stats.avgScore ?? '–' },
            { label: 'XP Total', value: data.stats.totalXP },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-100 p-3 text-center"
            >
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50">
          {(data?.sessions ?? []).map((s) => {
            const cat =
              CATEGORY_CONFIG[s.scenario?.category ?? ''] ??
              CATEGORY_CONFIG.SOFT_SKILLS;
            const Icon = cat.icon;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <div className={`p-2 rounded-lg ${cat.bg} shrink-0`}>
                  <Icon size={14} className={cat.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {s.scenario?.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(s.startedAt).toLocaleDateString('pt')}
                    {s.scenario?.competency &&
                      ` · ${s.scenario.competency.name}`}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}
                >
                  {s.status}
                </span>
                {s.score !== null && s.score !== undefined && (
                  <span
                    className={`text-sm font-bold ${SCORE_COLOR(s.score)} w-10 text-right`}
                  >
                    {s.score}
                  </span>
                )}
              </div>
            );
          })}
          {(data?.sessions?.length ?? 0) === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Play size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem sessões ainda — começa um cenário!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
