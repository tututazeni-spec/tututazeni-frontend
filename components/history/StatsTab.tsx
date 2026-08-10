// components/history/StatsTab.tsx
// Tab "Actividade": KPIs, heatmap de 12 semanas e distribuição por
// categoria. Extraído de app/(platform)/history/page.tsx.

'use client';

import { Activity, BookOpen, Flame, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { CATEGORY_COLOR } from './constants';
import type { HistoryStats } from './types';

export function StatsTab() {
  const { data, isLoading: loading } = useApiQuery<HistoryStats>(
    queryKeys.history.stats(),
    '/history/stats/me',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;

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
        {[
          {
            icon: Flame,
            label: 'Streak',
            value: `${data?.streak ?? 0} dias`,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
          {
            icon: Activity,
            label: 'Dias Activos',
            value: data?.activeDays ?? 0,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
          },
          {
            icon: BookOpen,
            label: 'Conclusões',
            value: data?.completions ?? 0,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
          },
          {
            icon: Zap,
            label: 'XP Total',
            value: data?.xpPoints ?? 0,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className={`p-2 rounded-lg ${item.bg} w-fit mb-2`}>
              <item.icon size={16} className={item.color} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Activity heatmap */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4">
          Actividade — Últimas 12 Semanas
        </h4>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(84, 1fr)' }}
        >
          {days12w.map((day) => {
            const count = data?.heatmap?.[day] ?? 0;
            const intensity =
              count === 0
                ? 'bg-slate-100'
                : count <= 2
                  ? 'bg-indigo-200'
                  : count <= 5
                    ? 'bg-indigo-400'
                    : 'bg-indigo-600';
            return (
              <div
                key={day}
                title={`${day}: ${count} eventos`}
                className={`aspect-square rounded-[2px] ${intensity}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
          <span>Menos</span>
          {[
            'bg-slate-100',
            'bg-indigo-200',
            'bg-indigo-400',
            'bg-indigo-600',
          ].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-[2px] ${c}`} />
          ))}
          <span>Mais</span>
        </div>
      </div>

      {/* By category */}
      {data?.byCategory && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            Actividade por Categoria
          </h4>
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
                      <span className={`${conf.color} font-medium`}>{cat}</span>
                      <span className="text-slate-700 font-semibold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${conf.bg.replace('bg-', 'bg-').replace('-100', '-400')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
