// components/history/StatsTab.tsx
// Tab "Actividade": KPIs, heatmap de 12 semanas e distribuição por
// categoria. Extraído de app/(platform)/history/page.tsx.
//
// O heatmap de intensidade de actividade usa um único token (primary)
// com opacidade crescente em vez de forçar 4 tons distintos de indigo —
// é uma escala sequencial de "quanto", não uma codificação de sentido
// bom/mau, por isso não se mapeia para os tokens success/warning/danger
// (ver nota "gráficos" da Task 0 do plano de rollout).

'use client';

import { CalendarCheck, Flame, Trophy, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_COLOR, CATEGORY_LABEL } from './constants';
import type { HistoryStats } from './types';

const HEATMAP_LEGEND = [
  'bg-surface-sunken',
  'bg-primary/30',
  'bg-primary/60',
  'bg-primary',
];

export function StatsTab({ userId }: { userId?: number }) {
  const { data, isLoading: loading } = useApiQuery<HistoryStats>(
    userId ? queryKeys.history.statsByUser(userId) : queryKeys.history.stats(),
    userId ? `/history/stats/user/${userId}` : '/history/stats/me',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  // Heatmap (last 12 weeks)
  const today = new Date();
  const days12w = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group flex min-h-[155px] flex-col items-center justify-center rounded-panel border border-brand-line bg-surface px-3 py-4 text-center shadow-[0_4px_14px_rgba(21,47,89,0.08)]">
          <Flame
            aria-hidden
            className="h-20 w-20 fill-[#F59E0B] text-[#E85D04] drop-shadow-[0_4px_10px_rgba(232,93,4,0.45)] transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            strokeWidth={1.5}
          />
          <p className="mt-1 font-display text-[28px] font-bold leading-none text-[#E85D04]">
            {data?.streak ?? 0} dias
          </p>
          <p className="mt-1.5 font-body text-xs font-semibold text-ink-faint">
            Sequência
          </p>
        </div>
        <KpiCard
          icon={CalendarCheck}
          label="Dias Activos"
          value={data?.activeDays ?? 0}
          intent="primary"
        />
        <KpiCard
          icon={Trophy}
          label="Conclusões"
          value={data?.completions ?? 0}
          intent="success"
        />
        <KpiCard
          icon={Zap}
          label="Pontos de Experiência Total"
          value={data?.xpPoints ?? 0}
          intent="accent"
        />
      </div>

      {/* Activity heatmap */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Actividade — Últimas 12 Semanas
        </div>
        <CardBody>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(84, 1fr)' }}
          >
            {days12w.map((day) => {
              const count = data?.heatmap?.[day] ?? 0;
              const intensity =
                count === 0
                  ? HEATMAP_LEGEND[0]
                  : count <= 2
                    ? HEATMAP_LEGEND[1]
                    : count <= 5
                      ? HEATMAP_LEGEND[2]
                      : HEATMAP_LEGEND[3];
              return (
                <div
                  key={day}
                  title={`${day}: ${count} eventos`}
                  className={`aspect-square rounded-[2px] ${intensity}`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-micro text-ink-faint">
            <span>Menos</span>
            {HEATMAP_LEGEND.map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
            ))}
            <span>Mais</span>
          </div>
        </CardBody>
      </Card>

      {/* By category */}
      {data?.byCategory && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
            Actividade por Categoria
          </div>
          <CardBody>
            <div className="space-y-2">
              {Object.entries(data.byCategory as Record<string, number>)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const total = Object.values(
                    data.byCategory as Record<string, number>,
                  ).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const conf = CATEGORY_COLOR[cat] ?? CATEGORY_COLOR.SYSTEM;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className={`${conf.color} font-medium`}>
                          {CATEGORY_LABEL[cat] ?? cat}
                        </span>
                        <span className="text-ink font-semibold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-sunken rounded-pill">
                        <div
                          className={`h-1.5 rounded-pill ${conf.fill}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
