// components/roles-permissions/GovernanceTab.tsx
// Tab "Governança": KPIs, alertas, distribuição de utilizadores por
// role e roles sem utilizadores. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard, type KpiCardProps } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { GovernanceData } from './types';

const ALERT_STYLES: Record<string, { box: string; icon: string }> = {
  ALERT: { box: 'bg-danger-subtle border-danger', icon: 'text-danger' },
  WARNING: { box: 'bg-warning-subtle border-warning', icon: 'text-warning' },
  INFO: { box: 'bg-info-subtle border-info', icon: 'text-info' },
};

export function GovernanceTab() {
  const { data, isLoading: loading } = useApiQuery<GovernanceData>(
    queryKeys.rolesPermissions.governance(),
    '/roles-permissions/governance-stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading)
    return (
      <Skeleton
        wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  const kpis: Array<{
    label: string;
    value: number;
    intent: KpiCardProps['intent'];
  }> = [
    {
      label: 'Funções',
      value: data?.totalRoles ?? 0,
      intent: 'primary',
    },
    {
      label: 'Permissões',
      value: data?.totalPermissions ?? 0,
      intent: 'info',
    },
    {
      label: 'Sem Função',
      value: data?.usersWithoutRole ?? 0,
      intent: (data?.usersWithoutRole ?? 0) > 0 ? 'danger' : 'success',
    },
    {
      label: 'Acessos Negados',
      value: data?.deniedAccesses ?? 0,
      intent: (data?.deniedAccesses ?? 0) > 50 ? 'danger' : 'info',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            intent={k.intent}
            className="w-full"
          />
        ))}
      </div>

      {/* Alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(data?.alerts ?? []).map((a, i) => {
            const style = ALERT_STYLES[a.type] ?? ALERT_STYLES.INFO;
            return (
              <div
                key={i}
                className={`border rounded-card px-4 py-3 flex items-center gap-3 ${style.box}`}
              >
                <AlertTriangle
                  size={14}
                  strokeWidth={1.75}
                  className={style.icon}
                />
                <p className="text-sm text-ink">{a.message}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Role distribution */}
      {(data?.usersPerRole ?? []).length > 0 && (
        <Card>
          <CardBody>
            <h4 className="font-semibold text-ink mb-4">
              Utilizadores por Função
            </h4>
            {(data?.usersPerRole ?? []).map((r, i) => {
              const max = (data?.usersPerRole ?? [])[0].count;
              return (
                <div key={i} className="mb-2">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-ink-muted">
                      {r.role?.name ?? 'N/A'}
                    </span>
                    <span className="font-bold text-ink">{r.count}</span>
                  </div>
                  <ProgressBar value={(r.count / max) * 100} />
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}

      {/* Unused roles */}
      {(data?.unusedRoles ?? []).length > 0 && (
        <div className="bg-warning-subtle border border-warning rounded-card p-4">
          <h4 className="font-semibold text-warning-ink mb-2">
            ⚠️ Roles sem Utilizadores
          </h4>
          <div className="flex flex-wrap gap-2">
            {(data?.unusedRoles ?? []).map((r, i) => (
              <span
                key={i}
                className="text-xs font-data bg-warning-subtle text-warning-ink px-2 py-0.5 rounded-control border border-warning"
              >
                {r.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
