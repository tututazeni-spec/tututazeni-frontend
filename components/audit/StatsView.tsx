// components/audit/StatsView.tsx
// Vista "Estatísticas": KPIs, distribuição por acção/entidade e
// eventos críticos recentes. Extraído de
// app/(platform)/audit/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ACTION_LABELS, entityLabel } from './constants';
import { fmtTs } from './utils';
import type { AuditStats } from './types';

export function StatsView() {
  const { data, isLoading: loading } = useApiQuery<AuditStats>(
    queryKeys.audit.stats(),
    '/audit/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="Total de eventos"
          value={data.totals.total}
          intent="primary"
        />
        <KpiCard label="Hoje" value={data.totals.today} intent="accent" />
        <KpiCard
          label="Críticos"
          value={data.totals.critical}
          intent={data.totals.critical > 0 ? 'danger' : 'primary'}
        />
        <KpiCard
          label="Logins falhados hoje"
          value={data.totals.failedLoginsToday}
          intent={data.totals.failedLoginsToday > 0 ? 'warning' : 'primary'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Por acção */}
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Por acção
            </div>
            {data.byAction.map((a) => (
              <div
                key={a.action}
                className="flex items-center gap-2 border-b border-border py-1.5 last:border-0"
              >
                <span className="flex-1 font-body text-xs text-ink-muted">
                  {ACTION_LABELS[a.action] ?? a.action}
                </span>
                <span className="font-data text-xs font-bold text-ink">
                  {a.count}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Por entidade */}
        <Card>
          <CardBody>
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Por entidade
            </div>
            {data.byEntity.map((e) => (
              <div
                key={e.entity}
                className="flex items-center gap-2 border-b border-border py-1.5 last:border-0"
              >
                <span className="flex-1 font-body text-xs text-ink-muted">
                  {entityLabel(e.entity)}
                </span>
                <span className="font-data text-xs font-bold text-ink">
                  {e.count}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* Eventos críticos recentes */}
      {data.recentCritical.length > 0 && (
        <div className="overflow-hidden rounded-card border border-danger bg-danger-subtle">
          <div className="border-b border-danger/30 px-4 py-3 font-body text-xs font-semibold text-danger-ink">
            Eventos críticos recentes
          </div>
          {data.recentCritical.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 border-b border-danger/30 px-4 py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <span className="font-body text-xs font-medium text-ink">
                  {ACTION_LABELS[log.action] ?? log.action}
                </span>
                <span className="font-body text-xs text-ink-muted">
                  {' '}
                  em {entityLabel(log.entity)}
                </span>
                {log.user && (
                  <span className="font-body text-xs text-ink-faint">
                    {' '}
                    por {log.user.fullName}
                  </span>
                )}
              </div>
              <span className="flex-shrink-0 font-body text-xs text-ink-faint">
                {fmtTs(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
