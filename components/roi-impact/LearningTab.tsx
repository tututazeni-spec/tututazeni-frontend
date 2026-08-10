// components/roi-impact/LearningTab.tsx
// Tab "Aprendizagem": volume, financeiro e cursos com mais impacto.
// Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { BookOpen, DollarSign, Target, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KPICard, Skeleton } from './atoms';
import { fmt$ } from './utils';
import type { LearningData } from './types';

export function LearningTab() {
  const { data, isLoading: loading } = useApiQuery<LearningData>(
    queryKeys.roiImpact.learning(),
    '/roi-impact/impact/learning',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  const v = data?.volume ?? {},
    f = data?.financial ?? {};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={BookOpen}
          label="Conclusões"
          value={v.completed ?? 0}
          color="text-teal-600"
          bg="bg-teal-50"
        />
        <KPICard
          icon={Target}
          label="Taxa de Conclusão"
          value={`${v.completionRate ?? 0}%`}
        />
        <KPICard
          icon={DollarSign}
          label="ROI Estimado"
          value={`${f.roi ?? 0}%`}
          color={(f.roi ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}
          bg={(f.roi ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
        />
        <KPICard
          icon={Zap}
          label="Horas de Formação"
          value={`${f.hoursEstimated ?? 0}h`}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      {/* Financial */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h4 className="font-semibold text-slate-700 mb-4">
          Análise Financeira
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Custo Total',
              value: fmt$(f.costEstimated ?? 0),
              color: 'text-red-600',
            },
            {
              label: 'Benefício Est.',
              value: fmt$(f.benefitEstimated ?? 0),
              color: 'text-emerald-600',
            },
            {
              label: 'Benefício Líq.',
              value: fmt$((f.benefitEstimated ?? 0) - (f.costEstimated ?? 0)),
              color:
                (f.benefitEstimated ?? 0) - (f.costEstimated ?? 0) >= 0
                  ? 'text-emerald-600'
                  : 'text-red-500',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center p-3 rounded-xl bg-slate-50"
            >
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">
            Cursos com Mais Impacto
          </h4>
          <div className="space-y-2">
            {(data?.topCourses ?? []).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold w-4">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {c.course?.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {c.course?.category}
                  </p>
                </div>
                <span className="text-xs font-bold text-teal-600">
                  {c.completions} conclusões
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
