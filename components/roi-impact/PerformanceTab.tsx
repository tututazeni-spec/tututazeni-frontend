// components/roi-impact/PerformanceTab.tsx
// Tab "Performance": pontuação antes/depois, melhoria, benefício
// monetizado e distribuição de performers. Extraído de
// app/(platform)/roi-impact/page.tsx (originalmente definida como
// função aninhada dentro do componente principal — sem dependências
// do container, por isso extraída tal e qual para o mesmo padrão
// "self-contained view" das restantes tabs).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { CONFIDENCE_LABELS, fmt$, ptInsight } from './utils';
import type { PerformanceData } from './types';

export function PerformanceTab() {
  const { data, isLoading: loading } = useApiQuery<PerformanceData>(
    queryKeys.roiImpact.performance(),
    '/roi-impact/impact/performance',
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

  const liftPositive = (data?.lift ?? 0) >= 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Pontuação Antes" value={data?.before?.toFixed(1) ?? '–'} className="w-full" />
        <KpiCard
          label="Pontuação Depois"
          value={data?.after?.toFixed(1) ?? '–'}
          className="w-full"
        />
        <KpiCard
          label="Melhoria"
          value={data?.lift != null ? `${data.lift >= 0 ? '+' : ''}${data.lift}pts` : '–'}
          intent={liftPositive ? 'success' : 'danger'}
          className="w-full"
        />
        <KpiCard
          label="Benefício Estimado."
          value={fmt$(data?.monetised?.productivityBenefit ?? 0)}
          intent="success"
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          label="Colaboradores de alto desempenho"
          value={data?.highPerformers ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          label="Em Risco"
          value={data?.atRisk ?? 0}
          intent="danger"
          className="w-full"
        />
      </div>
      {(data?.insights ?? []).length > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {(data?.insights ?? []).map((ins, i) => (
            <p key={i} className="font-body text-xs text-ink">
              {ptInsight(ins)}
            </p>
          ))}
        </div>
      )}
      {data?.confidence && CONFIDENCE_LABELS[data.confidence] && (
        <div className="text-center">
          <Badge intent="neutral" dot={false} className="text-ink">
            {CONFIDENCE_LABELS[data.confidence]}
          </Badge>
        </div>
      )}
    </div>
  );
}
