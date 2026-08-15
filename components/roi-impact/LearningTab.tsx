// components/roi-impact/LearningTab.tsx
// Tab "Aprendizagem": volume, financeiro e cursos com mais impacto.
// Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { BookOpen, DollarSign, Target, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { fmt$ } from './utils';
import type { LearningData } from './types';

export function LearningTab() {
  const { data, isLoading: loading } = useApiQuery<LearningData>(
    queryKeys.roiImpact.learning(),
    '/roi-impact/impact/learning',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const v = data?.volume ?? {},
    f = data?.financial ?? {};
  const roiPositive = (f.roi ?? 0) >= 0;
  const netBenefit = (f.benefitEstimated ?? 0) - (f.costEstimated ?? 0);

  const financials: { label: string; value: string; positive: boolean }[] = [
    { label: 'Custo Total', value: fmt$(f.costEstimated ?? 0), positive: false },
    { label: 'Benefício Est.', value: fmt$(f.benefitEstimated ?? 0), positive: true },
    { label: 'Benefício Líq.', value: fmt$(netBenefit), positive: netBenefit >= 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={BookOpen}
          label="Conclusões"
          value={v.completed ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={Target}
          label="Taxa de Conclusão"
          value={`${v.completionRate ?? 0}%`}
          className="w-full"
        />
        <KpiCard
          icon={DollarSign}
          label="ROI Estimado"
          value={`${f.roi ?? 0}%`}
          intent={roiPositive ? 'success' : 'danger'}
          className="w-full"
        />
        <KpiCard
          icon={Zap}
          label="Horas de Formação"
          value={`${f.hoursEstimated ?? 0}h`}
          intent="accent"
          className="w-full"
        />
      </div>

      {/* Financial */}
      <Card>
        <CardBody className="p-5">
          <h4 className="mb-4 font-display font-semibold text-ink">Análise Financeira</h4>
          <div className="grid grid-cols-3 gap-4">
            {financials.map((item) => (
              <div key={item.label} className="rounded-card bg-surface-sunken p-3 text-center">
                <p
                  className={cn(
                    'font-display text-2xl font-bold',
                    item.positive ? 'text-success-ink' : 'text-danger-ink',
                  )}
                >
                  {item.value}
                </p>
                <p className="mt-0.5 font-body text-xs text-ink-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <Card>
          <CardBody className="p-5">
            <h4 className="mb-3 font-display font-semibold text-ink">Cursos com Mais Impacto</h4>
            <div className="space-y-2">
              {(data?.topCourses ?? []).map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-4 font-body text-xs font-bold text-ink-faint">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-xs font-medium text-ink">{c.course?.title}</p>
                    <p className="font-body text-[10px] text-ink-faint">{c.course?.category}</p>
                  </div>
                  <span className="font-body text-xs font-bold text-success-ink">
                    {c.completions} conclusões
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {(data?.insights ?? []).length > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {(data?.insights ?? []).map((ins, i) => (
            <p key={i} className="font-body text-xs text-accent">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
