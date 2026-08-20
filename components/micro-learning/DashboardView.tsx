// components/micro-learning/DashboardView.tsx
// Vista "O meu progresso": streak, stats e actividade recente.
// Extraído de app/(platform)/micro-learning/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TYPE_CFG } from './constants';
import type { ContentType, MyDashboard } from './types';

const STAT_TILES: Array<{
  key: 'completed' | 'totalMinutes' | 'totalXp' | 'avgQuizScore';
  label: string;
  color?: string;
  suffix?: string;
}> = [
  { key: 'completed', label: 'Concluídos', color: 'text-success' },
  { key: 'totalMinutes', label: 'Minutos', color: 'text-info' },
  { key: 'totalXp', label: 'Pontos de Experiência ganho', color: 'text-accent' },
  { key: 'avgQuizScore', label: 'Quiz médio', suffix: '%' },
];

export function DashboardView() {
  const { data, isLoading } = useApiQuery<MyDashboard>(
    queryKeys.microLearning.dashboard(),
    '/micro-learning/dashboard/me',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { streak, stats } = data;

  return (
    <div className="space-y-6">
      {/* Streak */}
      <div className="flex items-center justify-between rounded-card bg-gradient-to-r from-accent to-accent-hover p-6 text-canvas">
        <div>
          <div className="mb-1 font-body text-sm text-canvas/80">
            Sequência actual
          </div>
          <div className="font-display text-5xl font-bold">
            {streak.current}
          </div>
          <div className="mt-1 font-body text-sm text-canvas/80">
            Dias consecutivos 
          </div>
        </div>
        <div className="text-right">
          <div className="font-body text-sm text-canvas/80">Recorde</div>
          <div className="font-display text-3xl font-bold">
            {streak.longest}
          </div>
          <div className="mt-1 font-body text-sm text-canvas/80">dias</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {STAT_TILES.map(({ key, label, color, suffix }) => (
          <div key={key} className="rounded-card bg-surface-sunken p-4">
            <div className="mb-1 font-body text-xs text-ink-faint">
              {label}
            </div>
            <div
              className={`font-data text-2xl font-bold ${color ?? 'text-ink'}`}
            >
              {stats[key]}
              {suffix ?? ''}
            </div>
          </div>
        ))}
      </div>

      {/* Actividade recente */}
      {data.recentActivity.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Actividade recente
          </div>
          {data.recentActivity.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control text-lg ${TYPE_CFG[a.microLearning?.contentType as ContentType]?.cls ?? 'bg-surface-sunken text-ink-muted'}`}
              >
                {TYPE_CFG[a.microLearning?.contentType as ContentType]?.icon ??
                  '📄'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {a.microLearning?.title}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="font-data text-xs font-bold text-info">
                  {a.progress}%
                </div>
                {a.completedAt && (
                  <div className="font-body text-xs text-success">
                    ✓ Concluído
                  </div>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
