// components/engagement/AnalyticsTab.tsx
// Separador "Analytics" — índice de engajamento, histórico de surveys e
// heatmap por departamento. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/engagement/page.tsx.
//
// O ProgressBar da fundação é mono-cor (usa sempre bg-accent) — onde o
// design original recolorava a barra para comunicar sentido (score do
// histórico, células do heatmap), essa informação passa para o texto/
// preenchimento adjacente via scoreTextClass/heatmapCellClass.

'use client';

import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { LEVEL_CONFIG } from './constants';
import type { EngagementIndex, HeatmapRow } from './types';

const METRICS = [
  { id: 'score', label: 'Score' },
  { id: 'participation', label: 'Participação' },
  { id: 'mood', label: 'Humor' },
] as const;

function scoreTextClass(avgScore: number): string {
  if (avgScore >= 4) return 'text-success';
  if (avgScore >= 3) return 'text-info';
  if (avgScore >= 2) return 'text-warning';
  return 'text-danger';
}

function heatmapCellClass(pct: number | null): string {
  if (pct === null) return 'bg-surface-sunken';
  if (pct >= 75) return 'bg-success';
  if (pct >= 50) return 'bg-info';
  if (pct >= 30) return 'bg-warning';
  return 'bg-danger';
}

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

  if (indexQuery.isLoading || heatmapQuery.isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  return (
    <div className="space-y-6">
      {/* Engagement index card */}
      {index && (
        <div
          className={`rounded-card border p-5 ${LEVEL_CONFIG[index.level]?.bg ?? 'bg-surface-sunken'}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="mb-1 font-body text-xs text-ink-muted">
                Índice de Engajamento
              </p>
              <p
                className={`font-display text-4xl font-black ${LEVEL_CONFIG[index.level]?.color ?? 'text-ink'}`}
              >
                {index.currentIndex}%
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 font-body text-xs ${index.trend >= 0 ? 'text-success' : 'text-danger'}`}
                >
                  {index.trend >= 0 ? (
                    <TrendingUp size={14} strokeWidth={1.75} />
                  ) : (
                    <TrendingDown size={14} strokeWidth={1.75} />
                  )}
                  {Math.abs(index.trend).toFixed(1)} pts vs. anterior
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-body text-xs text-ink-muted">Participação</p>
              <p className="font-display text-2xl font-bold text-ink">
                {index.latestParticipation}%
              </p>
              <p className="font-body text-xs text-ink-faint">
                {index.totalUsers} colaboradores
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {(index?.history.length ?? 0) > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-4 font-display font-semibold text-ink">
              Histórico de Surveys
            </h3>
            <div className="space-y-3">
              {index!.history.map((h, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-xs font-medium text-ink">
                      {h.title}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {h.responses} respostas ·{' '}
                      {new Date(h.date).toLocaleDateString('pt')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="w-24">
                      <ProgressBar value={h.avgScore * 20} />
                    </div>
                    <span
                      className={`w-8 text-right font-display text-sm font-bold ${scoreTextClass(h.avgScore)}`}
                    >
                      {h.avgScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Heatmap */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink">
              Heatmap por Departamento
            </h3>
            <div className="flex gap-1">
              {METRICS.map((m) => (
                <Button
                  key={m.id}
                  size="sm"
                  intent={metric === m.id ? 'primary' : 'ghost'}
                  onClick={() => setMetric(m.id)}
                >
                  {m.label}
                </Button>
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

              return (
                <div key={i} className="flex items-center gap-3">
                  <p className="w-32 truncate font-body text-xs text-ink-muted">
                    {row.department}
                  </p>
                  <div className="h-5 flex-1 rounded-control bg-surface-sunken">
                    {pct !== null && (
                      <div
                        className={`flex h-5 items-center rounded-control px-2 font-body text-[10px] text-canvas ${heatmapCellClass(pct)}`}
                        style={{ width: `${pct}%` }}
                      >
                        {v?.toFixed ? v.toFixed(1) : (v ?? '–')}
                      </div>
                    )}
                  </div>
                  {pct === null && (
                    <span className="font-body text-xs text-ink-faint">
                      Sem dados
                    </span>
                  )}
                </div>
              );
            })}

            {heatmap.length === 0 && (
              <p className="py-8 text-center font-body text-sm text-ink-faint">
                Sem dados disponíveis
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
