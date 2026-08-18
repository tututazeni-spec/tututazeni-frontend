// components/dashboard-rh/OverviewPanel.tsx
// Painel "Visão Geral" — KPIs agregados + distribuição por departamento.
// Dados próprios (useApiQuery) + apresentação, mesmo padrão auto-contido
// usado em components/payslips/page.tsx. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import {
  Activity,
  BookOpen,
  Shield,
  Star,
  Target,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertStrip } from './AlertStrip';
import type { Alert, OverviewData } from './types';

export function OverviewPanel() {
  const dataQ = useApiQuery<OverviewData>(
    queryKeys.dashboardRh.overview(),
    '/dashboard-rh',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const alertsQ = useApiQuery<Alert[]>(
    queryKeys.dashboardRh.alerts(),
    '/dashboard-rh/alerts',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const data = dataQ.data ?? null;
  const alerts = alertsQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );
  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <AlertStrip alerts={alerts} />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Colaboradores Activos"
          value={k.headcount?.total ?? 0}
          sub={k.headcount?.status}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          icon={UserMinus}
          label="Taxa de Rotatividade"
          value={`${k.turnover?.rate ?? 0}%`}
          sub={k.turnover?.status}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          icon={UserPlus}
          label="Novas Admissões (mês)"
          value={k.newHires?.count ?? 0}
          trend={k.newHires?.trend}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={Star}
          label="Performance Média"
          value={k.performance?.avg?.toFixed(1) ?? '–'}
          intent="warning"
          className="w-full"
        />
        <KpiCard
          icon={Target}
          label="Cobertura PDI"
          value={`${k.pdpCoverage?.pct ?? 0}%`}
          sub={k.pdpCoverage?.status}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          icon={BookOpen}
          label="Conclusões (mês)"
          value={k.completions?.count ?? 0}
          intent="info"
          className="w-full"
        />
        <KpiCard
          icon={Activity}
          label="Respostas às Pesquisas"
          value={k.engagement?.surveyResponses ?? 0}
          intent="accent"
          className="w-full"
        />
        <KpiCard
          icon={Shield}
          label="Formações Obrigatórias"
          value={k.mandatoryCompliance ?? 0}
          intent="danger"
          className="w-full"
        />
      </div>

      {/* Dept distribution */}
      {(data?.distribution?.byDepartment?.length ?? 0) > 0 && (
        <div className="mt-[1cm]! rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Distribuição por Departamento
          </h3>
          <div className="space-y-2">
            {(data?.distribution?.byDepartment ?? [])
              .slice(0, 8)
              .map((d, i) => {
                const maxCount = Math.max(
                  ...(data?.distribution?.byDepartment ?? []).map(
                    (x) => x.count,
                  ),
                );
                return (
                  <div key={i}>
                    <div className="mb-0.5 flex justify-between font-body text-xs">
                      <span className="truncate text-ink-muted">
                        {d.name ?? `Dept ${d.id}`}
                      </span>
                      <span className="font-semibold text-ink">{d.count}</span>
                    </div>
                    <ProgressBar value={(d.count / maxCount) * 100} />
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
