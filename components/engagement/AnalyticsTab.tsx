// components/engagement/AnalyticsTab.tsx
// Separador "Analytics" — índice de engajamento, histórico de surveys e
// heatmap por departamento. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import { LEVEL_CONFIG } from './constants';
import type { EngagementIndex, HeatmapRow } from './types';

export function AnalyticsTab() {
  const [metric, setMetric] = useState<'score' | 'participation' | 'mood'>(
    'score',
  );

  const indexQuery = useApiQuery<EngagementIndex>(
    queryKeys.engagement.index(),
    '/engagement/index',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const heatmapQuery = useApiQuery<HeatmapRow[]>(
    queryKeys.engagement.heatmap(metric),
    '/engagement/heatmap',
    { params: { metric }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const index = indexQuery.data ?? null;
  const heatmap = heatmapQuery.data ?? [];

  if (indexQuery.isLoading || heatmapQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Engagement index card */}
      {index && (
        <div
          className={`rounded-xl border p-5 ${LEVEL_CONFIG[index.level]?.bg ?? 'bg-slate-50'}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">
                Índice de Engajamento
              </p>
              <p
                className={`text-4xl font-black ${LEVEL_CONFIG[index.level]?.color ?? ''}`}
              >
                {index.currentIndex}%
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs flex items-center gap-1 ${index.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {index.trend >= 0 ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  {Math.abs(index.trend).toFixed(1)} pts vs. anterior
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Participação</p>
              <p className="text-2xl font-bold text-slate-700">
                {index.latestParticipation}%
              </p>
              <p className="text-xs text-slate-400">
                {index.totalUsers} colaboradores
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {(index?.history.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            Histórico de Surveys
          </h3>
          <div className="space-y-3">
            {index!.history.map((h, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {h.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {h.responses} respostas ·{' '}
                    {new Date(h.date).toLocaleDateString('pt')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24">
                    <ProgressBar
                      value={h.avgScore * 20}
                      color={
                        h.avgScore >= 4
                          ? 'bg-emerald-500'
                          : h.avgScore >= 3
                            ? 'bg-teal-500'
                            : h.avgScore >= 2
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                      }
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">
                    {h.avgScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">
            Heatmap por Departamento
          </h3>
          <div className="flex gap-1">
            {(['score', 'participation', 'mood'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  metric === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {m === 'score'
                  ? 'Score'
                  : m === 'participation'
                    ? 'Participação'
                    : 'Humor'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {heatmap.map((row, i) => {
            const v = row.value;
            const pct =
              metric === 'score'
                ? v !== null
                  ? (v / 5) * 100
                  : null
                : metric === 'mood'
                  ? v !== null
                    ? (v / 5) * 100
                    : null
                  : v;
            const color =
              pct === null
                ? 'bg-slate-100'
                : pct >= 75
                  ? 'bg-emerald-500'
                  : pct >= 50
                    ? 'bg-teal-400'
                    : pct >= 30
                      ? 'bg-amber-400'
                      : 'bg-red-400';

            return (
              <div key={i} className="flex items-center gap-3">
                <p className="text-xs text-slate-600 w-32 truncate">
                  {row.department}
                </p>
                <div className="flex-1 h-5 bg-slate-100 rounded">
                  {pct !== null && (
                    <div
                      className={`h-5 ${color} rounded text-[10px] text-white flex items-center px-2`}
                      style={{ width: `${pct}%` }}
                    >
                      {v?.toFixed ? v.toFixed(1) : (v ?? '–')}
                    </div>
                  )}
                </div>
                {pct === null && (
                  <span className="text-xs text-slate-400">Sem dados</span>
                )}
              </div>
            );
          })}

          {heatmap.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">
              Sem dados disponíveis
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
