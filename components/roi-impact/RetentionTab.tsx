// components/roi-impact/RetentionTab.tsx
// Tab "Retenção": headcount, rotatividade, economia gerada e evolução da
// rotatividade. Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { CheckCircle, DollarSign, TrendingDown, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { fmt$, ptInsight } from './utils';
import type { RetentionData } from './types';

export function RetentionTab() {
  const { data, isLoading: loading } = useApiQuery<RetentionData>(
    queryKeys.roiImpact.retention(),
    '/roi-impact/impact/retention',
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

  const turnoverColor = (val: number) =>
    val <= 10 ? 'text-success-ink' : val <= 15 ? 'text-warning-ink' : 'text-danger-ink';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={Users} label="Activos" value={data?.headcount?.active ?? 0} className="w-full" />
        <KpiCard
          icon={TrendingDown}
          label="Rotatividade"
          value={`${data?.turnoverRate ?? 0}%`}
          trend={data?.turnoverTrend}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          icon={CheckCircle}
          label="Retenção"
          value={`${data?.retentionRate ?? 0}%`}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={DollarSign}
          label="Economia Gerada"
          value={fmt$(data?.savedValue ?? 0)}
          sub={`${data?.saved ?? 0} saídas evitadas`}
          intent="success"
          className="w-full"
        />
      </div>

      {/* Turnover comparison */}
      <Card>
        <CardBody className="p-5">
          <h4 className="mb-4 font-display font-semibold text-ink">Evolução da Rotatividade</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Período Anterior', value: data?.prevTurnoverRate ?? 0 },
              { label: 'Período Actual', value: data?.turnoverRate ?? 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-card bg-surface-sunken p-4 text-center">
                <p className={cn('font-display text-3xl font-bold', turnoverColor(item.value))}>
                  {item.value}%
                </p>
                <p className="mt-0.5 font-body text-xs text-ink-muted">{item.label}</p>
              </div>
            ))}
          </div>
          {data?.turnoverTrend !== undefined && (
            <div className="mt-3 text-center">
              <span
                className={cn(
                  'font-body text-sm font-bold',
                  data.turnoverTrend < 0 ? 'text-success-ink' : 'text-danger-ink',
                )}
              >
                {data.turnoverTrend < 0 ? '↓' : '↑'} {Math.abs(data.turnoverTrend).toFixed(1)}pts
              </span>
              <span className="ml-2 font-body text-xs text-ink-faint">vs. período anterior</span>
            </div>
          )}
        </CardBody>
      </Card>

      {(data?.insights ?? []).length > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {(data?.insights ?? []).map((ins, i) => (
            <p key={i} className="font-body text-xs text-ink">
              {ptInsight(ins)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
