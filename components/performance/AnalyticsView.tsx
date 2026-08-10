// components/performance/AnalyticsView.tsx
// Separador "Analytics" — KPIs, distribuição por categoria, top
// performers e divergências. Dados próprios + apresentação. Extraído
// de app/(platform)/performance/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, Skeleton } from './atoms';
import { PERF_CATEGORY_MAP } from './constants';
import type { Analytics } from './types';

export function AnalyticsView() {
  const { data, isLoading: loading } = useApiQuery<Analytics>(
    queryKeys.performance.analytics(),
    '/performance/analytics',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  const categoryColors: Record<string, string> = {
    HIGH: 'bg-emerald-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-red-500',
  };

  const total = data.byCategory.reduce((s, c) => s + c._count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de reviews', value: data.totalReviews },
          {
            label: 'Score médio',
            value: data.avgScore,
            color: 'text-blue-600',
          },
          { label: 'Score mínimo', value: data.minScore ?? '—' },
          {
            label: 'Score máximo',
            value: data.maxScore ?? '—',
            color: 'text-emerald-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Distribuição por categoria */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-sm font-semibold text-gray-900 mb-4">
          Distribuição de desempenho
        </div>
        {data.byCategory.map((cat) => {
          const pct = Math.round((cat._count / total) * 100);
          return (
            <div
              key={cat.category}
              className="flex items-center gap-3 mb-3 last:mb-0"
            >
              <div className="w-20 text-xs text-gray-600 font-medium">
                {cat.category === 'HIGH'
                  ? 'Alto'
                  : cat.category === 'MEDIUM'
                    ? 'Médio'
                    : 'Baixo'}
              </div>
              <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${categoryColors[cat.category] ?? 'bg-gray-400'} rounded-lg flex items-center pl-2`}
                  style={{ width: `${pct}%` }}
                >
                  {pct > 15 && (
                    <span className="text-xs text-white font-medium">
                      {pct}%
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs font-mono text-gray-500 w-16 text-right">
                {cat._count} pessoas
              </div>
            </div>
          );
        })}
      </div>

      {/* Top performers */}
      {data.topPerformers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Top performers
          </div>
          {data.topPerformers.map((r, idx) => (
            <div
              key={r.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">
                {idx + 1}
              </span>
              <Avatar name={r.user.fullName} avatarUrl={undefined} size="sm" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {r.user.fullName}
                </div>
                <div className="text-xs text-gray-400">
                  {r.user.position?.name ?? '—'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-blue-700">
                  {r.score}
                </div>
                {r.category && (
                  <StatusBadge value={r.category} map={PERF_CATEGORY_MAP} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Divergências */}
      {data.highDivergences.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-3">
            ⚠ Divergências self vs gestor ≥ 1 ponto (
            {data.highDivergences.length} casos)
          </div>
          {data.highDivergences.map((d) => (
            <div
              key={d.userId}
              className="flex justify-between py-1.5 border-b border-amber-100 last:border-0 text-xs"
            >
              <span className="text-amber-800">User #{d.userId}</span>
              <span className="font-mono font-bold text-amber-700">
                {d.divergence} pontos
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
