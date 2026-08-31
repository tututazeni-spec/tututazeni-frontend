// components/dashboard/ManagerDashboard.tsx
// Separador "Gestor" — dados próprios (useApiQuery) + apresentação, mesmo
// padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.
//
// O ProgressBar da fundação é mono-cor — a cor que comunicava "PDI em bom
// ritmo" (progresso ≥ 80%) passa para o texto de percentagem adjacente.

'use client';

import { Target, Star, Shield } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertBanner } from './AlertBanner';
import { ALERTS_POLL_MS, type Alert, type ManagerDashboardData } from './types';

export function ManagerDashboard() {
  const { data, isLoading } = useApiQuery<ManagerDashboardData>(
    queryKeys.dashboard.manager(),
    '/dashboard/manager',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  // Mesma key de alerts → reutiliza a cache partilhada (não há novo pedido).
  const { data: alerts = [] } = useApiQuery<Alert[]>(
    queryKeys.dashboard.alerts(),
    '/dashboard/alerts',
    { refetchInterval: ALERTS_POLL_MS },
  );

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const kpis = data?.kpis ?? {};
  const mandatoryOk = (kpis.mandatoryRate ?? 0) >= 80;

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Equipa" value={data?.teamSize ?? 0} />
        <KpiCard
          label="PDIs Activos"
          value={kpis.activePlans ?? 0}
          sub={`Cobertura: ${kpis.pdpCoverage ?? 0}%`}
        />
        <KpiCard
          label="Pontuação Média"
          value={kpis.avgScore?.toFixed(1) ?? '–'}
          trend={kpis.scoreTrend}
          intent="warning"
        />
        <KpiCard
          label="Formação Obrigatória"
          value={`${kpis.mandatoryRate ?? 0}%`}
          intent={mandatoryOk ? 'success' : 'danger'}
        />
      </div>

      {/* Team table */}
      <div className="rounded-card border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-body font-semibold text-ink-muted">Equipa</h3>
          <span className="font-body text-xs text-ink-faint">
            {data?.teamSize ?? 0} colaboradores
          </span>
        </div>
        <div className="max-h-80 divide-y divide-border overflow-y-auto">
          {(data?.team ?? []).map((u) => (
            <div
              key={u.user.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-surface-sunken"
            >
              <Avatar name={u.user.fullName} url={u.user.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-medium text-ink">
                  {u.user.fullName}
                </p>
                <p className="font-body text-[10px] text-ink-faint">
                  {u.user.position?.name}
                </p>
              </div>
              {u.plan && (
                <div className="w-20">
                  <ProgressBar value={u.plan.progress} />
                  <p className="mt-0.5 text-center font-body text-[9px] text-ink-faint">
                    {u.plan.progress}% PDI
                  </p>
                </div>
              )}
              {u.lastScore && (
                <span
                  className={`font-body text-sm font-bold ${
                    u.lastScore >= 4
                      ? 'text-success'
                      : u.lastScore >= 2.5
                        ? 'text-warning-ink'
                        : 'text-danger'
                  }`}
                >
                  {u.lastScore.toFixed(1)}
                </span>
              )}
              {u.alert && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-danger"
                  title="Em risco"
                />
              )}
            </div>
          ))}
          {(data?.team?.length ?? 0) === 0 && (
            <div className="py-8 text-center font-body text-sm text-ink-faint">
              Sem equipa directa
            </div>
          )}
        </div>
      </div>

      {/* Manager alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-3 font-body font-semibold text-ink-muted">
            ⚠️ Alertas da Equipa
          </h3>
          <div className="space-y-2">
            {(data?.alerts ?? []).map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${a.priority === 'URGENT' ? 'bg-danger' : 'bg-warning'}`}
                />
                <p className="font-body text-sm text-ink">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
