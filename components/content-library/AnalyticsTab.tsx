// components/content-library/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, distribuição por formato, mais vistos e
// adicionados recentemente. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/content-library/page.tsx.

'use client';

import { Award, BookOpen, CheckCircle, Eye } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import { FORMAT_COLOR } from './constants';
import type { ContentAnalytics } from './types';

export function AnalyticsTab() {
  const { data, isLoading } = useApiQuery<ContentAnalytics>(
    queryKeys.contentLibrary.analytics(),
    '/content-library/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton count={4} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Conteúdos',
            value: data?.kpis.totalContent,
            icon: BookOpen,
            color: 'text-indigo-600',
          },
          {
            label: 'Activos',
            value: data?.kpis.activeContent,
            icon: CheckCircle,
            color: 'text-emerald-600',
          },
          {
            label: 'Visualizações',
            value: data?.kpis.totalViews,
            icon: Eye,
            color: 'text-blue-600',
          },
          {
            label: 'Conclusões',
            value: data?.kpis.totalCompletions,
            icon: Award,
            color: 'text-amber-600',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <k.icon size={16} className={k.color} />
              <p className="text-xs text-slate-500">{k.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-800">{k.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Format breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            Distribuição por Formato
          </h3>
          <div className="space-y-2">
            {(data?.formatBreakdown ?? []).map((f) => {
              const total = (data?.formatBreakdown ?? []).reduce(
                (s, x) => s + x.count,
                0,
              );
              const pct = total > 0 ? Math.round((f.count / total) * 100) : 0;
              return (
                <div key={f.format} className="flex items-center gap-3">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded w-24 text-center font-medium
                    ${FORMAT_COLOR[f.format] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {f.format}
                  </span>
                  <div className="flex-1">
                    <ProgressBar value={pct} height="h-2" />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-8 text-right">
                    {f.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most viewed */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            Mais Vistos (30 dias)
          </h3>
          <div className="space-y-3">
            {(data?.mostViewed ?? []).map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {v.content?.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {v.content?.type}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0">
                  {v.weeklyViews} views
                </span>
              </div>
            ))}
            {(data?.mostViewed ?? []).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">
                Sem dados ainda
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recently added */}
      {(data?.recentlyAdded?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">
            Adicionados Recentemente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(data?.recentlyAdded ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
              >
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium w-20 text-center
                  ${FORMAT_COLOR[c.type] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {c.type}
                </span>
                <p className="text-sm font-medium text-slate-700 flex-1 truncate">
                  {c.title}
                </p>
                <p className="text-[10px] text-slate-400 shrink-0">
                  {new Date(c.createdAt).toLocaleDateString('pt')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
