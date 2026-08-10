// components/roi-impact/RetentionTab.tsx
// Tab "Retenção": headcount, turnover, economia gerada e evolução do
// turnover. Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { CheckCircle, DollarSign, TrendingDown, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KPICard, Skeleton } from './atoms';
import { fmt$ } from './utils';
import type { RetentionData } from './types';

export function RetentionTab() {
  const { data, isLoading: loading } = useApiQuery<RetentionData>(
    queryKeys.roiImpact.retention(),
    '/roi-impact/impact/retention',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Activos"
          value={data?.headcount?.active ?? 0}
        />
        <KPICard
          icon={TrendingDown}
          label="Turnover"
          value={`${data?.turnoverRate ?? 0}%`}
          trend={data?.turnoverTrend}
          color="text-red-500"
          bg="bg-red-50"
        />
        <KPICard
          icon={CheckCircle}
          label="Retenção"
          value={`${data?.retentionRate ?? 0}%`}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={DollarSign}
          label="Economia Gerada"
          value={fmt$(data?.savedValue ?? 0)}
          sub={`${data?.saved ?? 0} saídas evitadas`}
          color="text-teal-600"
          bg="bg-teal-50"
        />
      </div>

      {/* Turnover comparison */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4">
          Evolução do Turnover
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Período Anterior', value: data?.prevTurnoverRate ?? 0 },
            { label: 'Período Actual', value: data?.turnoverRate ?? 0 },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center p-4 rounded-xl bg-slate-50"
            >
              <p
                className={`text-3xl font-bold ${item.value <= 10 ? 'text-emerald-600' : item.value <= 15 ? 'text-amber-600' : 'text-red-500'}`}
              >
                {item.value}%
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        {data?.turnoverTrend !== undefined && (
          <div className="mt-3 text-center">
            <span
              className={`text-sm font-bold ${data.turnoverTrend < 0 ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {data.turnoverTrend < 0 ? '↓' : '↑'}{' '}
              {Math.abs(data.turnoverTrend).toFixed(1)}pts
            </span>
            <span className="text-xs text-slate-400 ml-2">
              vs. período anterior
            </span>
          </div>
        )}
      </div>

      {(data?.insights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          {(data?.insights ?? []).map((ins, i) => (
            <p key={i} className="text-xs text-violet-800">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
