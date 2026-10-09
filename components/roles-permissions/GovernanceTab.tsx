// components/roles-permissions/GovernanceTab.tsx
// Tab "Governança": KPIs, alertas, distribuição de utilizadores por
// role e roles sem utilizadores. Extraído de
// app/(platform)/roles-permissions/page.tsx.

'use client';

import {
  AlertTriangle,
  KeyRound,
  Shield,
  ShieldAlert,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import {
  NavyStatCard,
  type NavyStatTone,
} from '@/components/ui/NavyStatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { GovernanceData } from './types';

// Uma cor por função (cicla se houver mais funções que cores).
const ROLE_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#84CC16',
  '#06B6D4',
  '#A855F7',
];

const ALERT_STYLES: Record<string, { box: string; icon: string }> = {
  ALERT: { box: 'bg-danger-subtle border-danger', icon: 'text-danger' },
  WARNING: { box: 'bg-warning-subtle border-warning', icon: 'text-warning' },
  INFO: { box: 'bg-info-subtle border-info', icon: 'text-info' },
};

export function GovernanceTab() {
  const {
    data,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useApiQuery<GovernanceData>(
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

  // Sem este ramo, uma falha do GET /governance-stats mostrava todos os KPIs
  // a zero — parecia dados reais ("0 acessos negados"), não uma falha.
  if (isError)
    return <QueryError error={error} onRetry={() => void refetch()} />;

  const kpis: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    tone: NavyStatTone;
  }> = [
    {
      label: 'Funções',
      value: data?.totalRoles ?? 0,
      icon: Shield,
      tone: 'blue',
    },
    {
      label: 'Permissões',
      value: data?.totalPermissions ?? 0,
      icon: KeyRound,
      tone: 'blue',
    },
    {
      label: 'Sem Função',
      value: data?.usersWithoutRole ?? 0,
      icon: UserX,
      tone: (data?.usersWithoutRole ?? 0) > 0 ? 'red' : 'green',
    },
    {
      label: 'Acessos Negados',
      value: data?.deniedAccesses ?? 0,
      icon: ShieldAlert,
      tone: (data?.deniedAccesses ?? 0) > 50 ? 'red' : 'orange',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <NavyStatCard
            key={k.label}
            icon={k.icon}
            label={k.label}
            value={k.value}
            tone={k.tone}
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
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Utilizadores por Função
          </div>
          <CardBody>
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
                  <ProgressBar
                    value={(r.count / max) * 100}
                    color={ROLE_COLORS[i % ROLE_COLORS.length]}
                  />
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
            <AlertTriangle
              size={14}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            Roles sem Utilizadores
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
