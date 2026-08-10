// components/reports/InsightsTab.tsx
// Tab "Insights IA": alertas inteligentes gerados automaticamente.
// Extraído de app/(platform)/reports/page.tsx.

'use client';

import { AlertTriangle, Brain, CheckCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { defaultRange } from './utils';
import type { InsightsData } from './types';

export function InsightsTab() {
  const range = defaultRange(1);
  const { data, isLoading: loading } = useApiQuery<InsightsData>(
    queryKeys.reports.insights({ from: range.from, to: range.to }),
    '/reports/insights',
    {
      params: { from: range.from, to: range.to },
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

  const SEV_CONFIG: Record<
    string,
    { color: string; bg: string; icon: LucideIcon }
  > = {
    HIGH: {
      color: 'text-red-700',
      bg: 'bg-red-50 border-red-200',
      icon: AlertTriangle,
    },
    MEDIUM: {
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      icon: Clock,
    },
    LOW: {
      color: 'text-teal-700',
      bg: 'bg-teal-50 border-teal-100',
      icon: CheckCircle,
    },
  };

  if (loading) return <Skeleton count={4} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
          <Brain size={16} className="text-violet-500" />
          Insights Inteligentes
        </h3>
        <span className="text-xs bg-violet-100 text-violet-700 px-3 py-1 rounded-full font-medium">
          {data?.count ?? 0} insights identificados
        </span>
      </div>

      {(data?.insights ?? []).length === 0 && (
        <div className="py-16 text-center bg-emerald-50 rounded-xl border border-emerald-100">
          <CheckCircle size={36} className="mx-auto mb-2 text-emerald-500" />
          <p className="font-medium text-emerald-700">Organização saudável!</p>
          <p className="text-sm text-emerald-600">
            Sem alertas críticos identificados
          </p>
        </div>
      )}

      {(data?.insights ?? []).map((ins, i) => {
        const conf = SEV_CONFIG[ins.severity] ?? SEV_CONFIG.LOW;
        const Icon = conf.icon;
        return (
          <div key={i} className={`border rounded-xl p-4 ${conf.bg}`}>
            <div className="flex items-start gap-3">
              <Icon size={16} className={`${conf.color} shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold ${conf.color} uppercase tracking-wide`}
                  >
                    {ins.type}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${conf.color} ${conf.bg} border`}
                  >
                    {ins.severity}
                  </span>
                </div>
                <p className={`text-sm font-medium ${conf.color} mb-1`}>
                  {ins.message}
                </p>
                {ins.recommendation && (
                  <p className="text-xs text-slate-600 bg-white/60 rounded-lg px-3 py-1.5 border border-white">
                    💡 <span className="font-medium">Recomendação:</span>{' '}
                    {ins.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
