// components/automation/StatsTab.tsx

import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton, CATEGORY_COLOR } from './atoms';
import type { AutomationStats } from './types';

export function StatsTab() {
  const { data, isLoading: loading } = useApiQuery<AutomationStats>(
    queryKeys.automation.stats(),
    '/automation/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading) return <Skeleton />;
  const e = data?.executions ?? {};
  const r = data?.rules ?? {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Regras Activas',
            value: r.active ?? 0,
            color: 'text-indigo-600',
          },
          {
            label: 'Total Execuções',
            value: e.total ?? 0,
            color: 'text-slate-800',
          },
          {
            label: 'Taxa de Sucesso',
            value: `${e.successRate ?? 0}%`,
            color:
              (e.successRate ?? 0) >= 90
                ? 'text-emerald-600'
                : 'text-amber-600',
          },
          {
            label: 'Falhas',
            value: e.failed ?? 0,
            color: (e.failed ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      {(data?.byCategory ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Por Categoria</h4>
          {(data?.byCategory ?? []).map((c, i) => {
            const max = Math.max(
              ...(data?.byCategory ?? []).map((x) => x.count),
            );
            return (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${CATEGORY_COLOR[c.category] ?? CATEGORY_COLOR.CUSTOM}`}
                  >
                    {c.category}
                  </span>
                  <span className="font-bold text-slate-700">{c.count}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full">
                  <div
                    className="h-1.5 bg-indigo-400 rounded-full"
                    style={{ width: `${(c.count / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(data?.recentFails ?? []).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle size={14} />
            Falhas Recentes
          </h4>
          {(data?.recentFails ?? []).map((f, i) => (
            <div
              key={i}
              className="text-xs text-red-700 py-1 border-b border-red-100 last:border-0"
            >
              Rule #{f.ruleId} — {f.error ?? 'Erro desconhecido'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
