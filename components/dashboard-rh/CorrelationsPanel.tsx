// components/dashboard-rh/CorrelationsPanel.tsx
// Painel "People Analytics" — correlações formação×performance e
// engagement×performance. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/dashboard-rh/page.tsx.

'use client';

import { Brain } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import type { CorrelationsData } from './types';

export function CorrelationsPanel() {
  const { data, isLoading: loading } = useApiQuery<CorrelationsData>(
    queryKeys.dashboardRh.correlations(),
    '/dashboard-rh/correlations',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton count={2} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Brain size={18} className="text-violet-600" />
        <h3 className="font-semibold text-slate-700">
          People Analytics — Correlações
        </h3>
        <span className="text-xs text-slate-400">
          Base: {data?.sampleSize ?? 0} colaboradores
        </span>
      </div>

      {data?.trainingVsPerformance && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-1">
            📚 Formação × Performance
          </h4>
          <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2 mb-4">
            💡 {data.trainingVsPerformance.insight}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Alto treino (3+ cursos)',
                value: data.trainingVsPerformance.highTrainingAvgPerf,
                color: 'bg-emerald-500',
              },
              {
                label: 'Baixo treino',
                value: data.trainingVsPerformance.lowTrainingAvgPerf,
                color: 'bg-red-400',
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p
                  className={`text-3xl font-black ${(item.value ?? 0) >= 3.5 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {item.value?.toFixed(1) ?? '–'}
                </p>
                <p className="text-xs text-slate-500">{item.label}</p>
                <ProgressBar
                  value={((item.value ?? 0) / 5) * 100}
                  color={item.color}
                  height="h-2"
                />
              </div>
            ))}
          </div>
          {(data.trainingVsPerformance.lift ?? 0) > 0 && (
            <div className="mt-3 text-center">
              <span className="text-sm font-bold text-emerald-600">
                +{data.trainingVsPerformance.lift} pts lift
              </span>
              <span className="text-xs text-slate-400 ml-2">
                por alto consumo de formação
              </span>
            </div>
          )}
        </div>
      )}

      {data?.engagementVsPerformance && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-1">
            💬 Engagement × Performance
          </h4>
          <p className="text-xs text-violet-700 bg-violet-50 rounded-lg px-3 py-2 mb-4">
            💡 {data.engagementVsPerformance.insight}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Alto engagement',
                value: data.engagementVsPerformance.highEngAvgPerf,
                color: 'bg-emerald-500',
              },
              {
                label: 'Baixo engagement',
                value: data.engagementVsPerformance.lowEngAvgPerf,
                color: 'bg-red-400',
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p
                  className={`text-3xl font-black ${(item.value ?? 0) >= 3.5 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {item.value?.toFixed(1) ?? '–'}
                </p>
                <p className="text-xs text-slate-500">{item.label}</p>
                <ProgressBar
                  value={((item.value ?? 0) / 5) * 100}
                  color={item.color}
                  height="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
