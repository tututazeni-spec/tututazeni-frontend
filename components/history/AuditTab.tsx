// components/history/AuditTab.tsx
// Tab "Auditoria": estatísticas de auditoria, top acções,
// aniversários de empresa e alertas de segurança recentes. Extraído
// de app/(platform)/history/page.tsx.

'use client';

import { Shield } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatAuditAction } from './constants';
import type { AuditStats, UpcomingData } from './types';

export function AuditTab() {
  const dataQ = useApiQuery<AuditStats>(
    queryKeys.history.auditStats(),
    '/history/audit/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const upcomingQ = useApiQuery<UpcomingData>(
    queryKeys.history.upcoming(),
    '/history/upcoming',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = dataQ.data ?? null;
  const upcoming = upcomingQ.data ?? null;
  const loading = dataQ.isLoading;

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  return (
    <div className="space-y-5">
      {/* Audit stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard
          label="Total de Eventos"
          value={data?.total ?? 0}
          intent="primary"
        />
        <KpiCard
          label="Top Acção"
          value={formatAuditAction(data?.byAction?.[0]?.action ?? '')}
          intent="primary"
        />
        <KpiCard
          label="Utilizadores"
          value={data?.topUsers?.length ?? 0}
          intent="primary"
        />
      </div>

      {/* Top actions */}
      {(data?.byAction ?? []).length > 0 && (
        <Card>
          <CardBody>
            <h4 className="font-display font-semibold text-ink mb-3">
              Top Acções
            </h4>
            <div className="space-y-1.5">
              {(data?.byAction ?? []).slice(0, 8).map((a, i) => {
                const max = data?.byAction?.[0]?.count ?? 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-ink-faint w-5 text-right">
                      #{i + 1}
                    </span>
                    <span className="text-xs font-data font-medium text-ink w-40 truncate">
                      {formatAuditAction(a.action)}
                    </span>
                    <div className="flex-1 h-1.5 bg-surface-sunken rounded-pill">
                      <div
                        className="h-1.5 bg-primary rounded-pill"
                        style={{ width: `${(a.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-ink-muted w-10 text-right">
                      {a.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Upcoming anniversaries */}
      {(upcoming?.anniversaries?.length ?? 0) > 0 && (
        <div className="bg-warning-subtle border border-warning rounded-card p-5">
          <h4 className="font-display font-semibold text-warning-ink mb-3">
            Aniversários de Empresa este Mês
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {(upcoming?.anniversaries ?? []).slice(0, 6).map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-surface rounded-control px-3 py-2"
              >
                <div className="w-7 h-7 rounded-full bg-warning-subtle flex items-center justify-center text-xs font-bold text-warning-ink shrink-0">
                  {u.fullName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink truncate">
                    {u.fullName}
                  </p>
                  <p className="text-[10px] text-warning-ink font-semibold">
                    {u.years} {u.years === 1 ? 'ano' : 'anos'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent alerts */}
      {(data?.recentAlerts ?? []).length > 0 && (
        <Card>
          <CardBody>
            <h4 className="font-display font-semibold text-ink mb-3 flex items-center gap-2">
              <Shield size={14} strokeWidth={1.75} className="text-danger" />
              Eventos de Segurança Recentes
            </h4>
            <div className="space-y-2">
              {(data?.recentAlerts ?? []).map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-ink-muted py-1.5 border-b border-border last:border-0"
                >
                  <span className="font-data text-danger shrink-0">
                    {a.action}
                  </span>
                  <span>·</span>
                  <span>{a.user?.fullName ?? `User ${a.userId}`}</span>
                  <span className="ml-auto text-ink-faint">
                    {new Date(a.timestamp).toLocaleDateString('pt')}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
