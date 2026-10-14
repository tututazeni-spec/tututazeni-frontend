// components/automation/StatsTab.tsx

import { Activity, AlertTriangle, XCircle, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { CATEGORY_LABEL } from './constants';
import type { AutomationStats } from './types';

// Uma cor distinta por linha da lista "Por Categoria".
const ROW_COLORS = [
  '#1877F2',
  '#218653',
  '#E99A16',
  '#EF4657',
  '#8B5CF6',
  '#0EA5A4',
  '#EC4899',
  '#F2C230',
];

export function StatsTab() {
  const { data, isLoading: loading } = useApiQuery<AutomationStats>(
    queryKeys.automation.stats(),
    '/automation/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  const e = data?.executions ?? {};
  const r = data?.rules ?? {};
  const byCategory = data?.byCategory ?? [];
  const recentFails = data?.recentFails ?? [];
  const maxCount = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Zap}
          label="Regras Activas"
          value={r.active ?? 0}
          intent="success"
        />
        <KpiCard
          icon={Activity}
          label="Total Execuções"
          value={e.total ?? 0}
          intent="info"
        />
        <SpeedometerStatCard
          label="Taxa de sucesso"
          value={e.successRate ?? 0}
          bands={RATE_BANDS}
          display={`${Math.round(e.successRate ?? 0)}%`}
        />
        <KpiCard
          icon={XCircle}
          label="Falhas"
          value={e.failed ?? 0}
          intent="danger"
        />
      </div>

      {byCategory.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Por Categoria
          </div>
          <CardBody>
            {byCategory.map((c, i) => {
              const color = ROW_COLORS[i % ROW_COLORS.length];
              return (
                <div key={i} className="mb-3 last:mb-0">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-body font-semibold text-ink">
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {CATEGORY_LABEL[c.category] ?? c.category}
                    </span>
                    <span
                      className="font-body font-bold"
                      style={{ color }}
                    >
                      {c.count}
                    </span>
                  </div>
                  <ProgressBar
                    value={(c.count / maxCount) * 100}
                    color={color}
                  />
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {recentFails.length > 0 && (
        <div className="rounded-card border border-danger bg-danger-subtle p-4">
          <h4 className="mb-2 flex items-center gap-2 font-body font-semibold text-danger-ink">
            <AlertTriangle size={14} strokeWidth={1.75} />
            Falhas Recentes
          </h4>
          {recentFails.map((f, i) => (
            <div
              key={i}
              className="border-b border-danger/20 py-1 font-body text-xs text-danger-ink last:border-0"
            >
              Regra #{f.ruleId} —{f.error ?? 'Erro desconhecido'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
