// components/roi-impact/PerformanceTab.tsx
// Tab "Performance": scores antes/depois, lift, benefício monetizado
// e distribuição de performers. Extraído de
// app/(platform)/roi-impact/page.tsx (originalmente definida como
// função aninhada dentro do componente principal — sem dependências
// do container, por isso extraída tal e qual para o mesmo padrão
// "self-contained view" das restantes tabs).

'use client';

import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ConfidenceBadge, KPICard, Skeleton } from './atoms';
import { fmt$ } from './utils';
import type { PerformanceData } from './types';

export function PerformanceTab() {
  const { data, isLoading: loading } = useApiQuery<PerformanceData>(
    queryKeys.roiImpact.performance(),
    '/roi-impact/impact/performance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Star}
          label="Score Antes"
          value={data?.before?.toFixed(1) ?? '–'}
        />
        <KPICard
          icon={TrendingUp}
          label="Score Depois"
          value={data?.after?.toFixed(1) ?? '–'}
        />
        <KPICard
          icon={Zap}
          label="Lift"
          value={
            data?.lift != null
              ? `${data.lift >= 0 ? '+' : ''}${data.lift}pts`
              : '–'
          }
          color={(data?.lift ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}
          bg={(data?.lift ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}
        />
        <KPICard
          icon={DollarSign}
          label="Benefício Est."
          value={fmt$(data?.monetised?.productivityBenefit ?? 0)}
          color="text-teal-600"
          bg="bg-teal-50"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <KPICard
          icon={CheckCircle}
          label="Top Performers"
          value={data?.highPerformers ?? 0}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={AlertTriangle}
          label="Em Risco"
          value={data?.atRisk ?? 0}
          color="text-red-500"
          bg="bg-red-50"
        />
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
      <div className="text-center">
        <ConfidenceBadge level={data?.confidence} />
      </div>
    </div>
  );
}
