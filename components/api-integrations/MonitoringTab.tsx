// components/api-integrations/MonitoringTab.tsx

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Activity, PlugZap, Timer } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import {
  INVERSE_RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { MonitoringStats } from './types';

const HEALTH_INTENT: Record<string, NonNullable<BadgeProps['intent']>> = {
  OK: 'success',
  ERROR: 'danger',
  DEGRADED: 'warning',
  STALE: 'neutral',
  INACTIVE: 'neutral',
  UNKNOWN: 'neutral',
};

export function MonitoringTab() {
  const { data, isLoading: loading } = useApiQuery<MonitoringStats>(
    queryKeys.apiIntegrations.stats(),
    '/api-integrations/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading)
    return (
      <Skeleton
        wrapperClassName="space-y-3"
        itemClassName="bg-surface-sunken rounded-card h-16"
      />
    );
  const s = data?.summary ?? {};
  const errorRate = Math.min(100, Math.max(0, s.errorRate24h ?? 0));

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          tab="integrations"
          icon={PlugZap}
          label="Integrações Activas"
          value={s.activeIntegrations ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={Activity}
          label="Chamadas (24h)"
          value={s.totalLogs24h ?? 0}
          intent="warning"
          className="w-full"
        />
        {/* Verde no início da escala (mais baixo é melhor) */}
        <SpeedometerStatCard
          label="Taxa de Erro"
          value={errorRate}
          bands={INVERSE_RATE_BANDS}
          display={`${s.errorRate24h ?? 0}%`}
        />
        <KpiCard
          icon={Timer}
          label="Latência Média"
          value={s.avgLatencyMs ? `${s.avgLatencyMs}ms` : '–'}
          intent="primary"
          iconIntent="caution"
          className="w-full"
        />
      </div>

      {/* Integration health grid */}
      {(data?.integrationHealth ?? []).length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
            Saúde das Integrações
          </div>
          <CardBody>
            <div className="grid gap-2">
              {(data?.integrationHealth ?? []).map((i, idx) => {
                const intent = HEALTH_INTENT[i.health] ?? 'neutral';
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="flex-1 font-body text-sm text-ink">
                      {i.name}
                    </span>
                    <span className="font-body text-xs text-ink-faint">
                      {i.logs7d} calls/7d
                    </span>
                    <span
                      className={`font-body text-xs font-bold ${i.errorRate > 5 ? 'text-danger' : 'text-success'}`}
                    >
                      {i.errorRate}% err
                    </span>
                    <Badge intent={intent}>{i.health}</Badge>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="text-right font-body text-xs text-ink-faint">
        Actualizado:{' '}
        {new Date(data?.generatedAt ?? Date.now()).toLocaleString('pt')}
      </div>
    </div>
  );
}
