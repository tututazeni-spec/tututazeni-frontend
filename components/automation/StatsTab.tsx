// components/automation/StatsTab.tsx

import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_INTENT } from './constants';
import type { AutomationStats } from './types';

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
          label="Regras Activas"
          value={r.active ?? 0}
          intent="primary"
        />
        <KpiCard label="Total Execuções" value={e.total ?? 0} intent="info" />
        <KpiCard
          label="Taxa de Sucesso"
          value={`${e.successRate ?? 0}%`}
          intent={(e.successRate ?? 0) >= 90 ? 'success' : 'warning'}
        />
        <KpiCard
          label="Falhas"
          value={e.failed ?? 0}
          intent={(e.failed ?? 0) > 0 ? 'danger' : 'success'}
        />
      </div>

      {byCategory.length > 0 && (
        <Card>
          <CardBody>
            <h4 className="mb-4 font-display font-semibold text-ink">
              Por Categoria
            </h4>
            {byCategory.map((c, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <Badge intent={CATEGORY_INTENT[c.category] ?? 'neutral'}>
                    {c.category}
                  </Badge>
                  <span className="font-body font-bold text-ink">
                    {c.count}
                  </span>
                </div>
                <ProgressBar value={(c.count / maxCount) * 100} />
              </div>
            ))}
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
              Rule #{f.ruleId} — {f.error ?? 'Erro desconhecido'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
