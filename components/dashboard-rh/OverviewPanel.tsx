// components/dashboard-rh/OverviewPanel.tsx
// Painel "Visão Geral" — KPIs agregados + distribuição por departamento.
// Dados próprios (useApiQuery) + apresentação, mesmo padrão auto-contido
// usado em components/payslips/page.tsx. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import {
  Users,
  TrendingDown,
  UserPlus,
  Star,
  Target,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
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
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );
  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <AlertStrip alerts={alerts} />

      {/* Top KPIs — cartão "tipo B" (Udemy/MasterClass): ícone em badge
          circular, número grande, label e sub/trend por baixo. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="Colaboradores Activos"
          value={k.headcount?.total ?? 0}
          tone="blue"
          icon={Users}
        />
        <NavyStatCard
          icon={TrendingDown}
          label="Taxa de Rotatividade"
          value={`${k.turnover?.rate ?? 0}%`}
          sub={k.turnover?.status}
          tone="red"
        />
        <NavyStatCard
          label="Novas Admissões (mês)"
          value={k.newHires?.count ?? 0}
          tone="green"
          icon={UserPlus}
        />
        <NavyStatCard
          label="Performance Média"
          value={k.performance?.avg?.toFixed(1) ?? '–'}
          tone="orange"
          icon={Star}
        />
        <NavyStatCard
          icon={Target}
          label="Cobertura PDI"
          value={`${k.pdpCoverage?.pct ?? 0}%`}
          sub={k.pdpCoverage?.status}
          tone="blue"
        />
        <NavyStatCard
          label="Conclusões (mês)"
          value={k.completions?.count ?? 0}
          tone="blue"
          icon={CheckCircle2}
        />
        <NavyStatCard
          label="Respostas às Pesquisas"
          value={k.engagement?.surveyResponses ?? 0}
          tone="orange"
          icon={MessageSquare}
        />
        <NavyStatCard
          label="Formações Obrigatórias"
          value={k.mandatoryCompliance ?? 0}
          tone="red"
          icon={ShieldCheck}
        />
      </div>

      {/* Dept distribution */}
      {(data?.distribution?.byDepartment?.length ?? 0) > 0 && (
        <div className="mt-[1cm]! rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Distribuição por Departamento
          </h3>
          <DonutChart
            centerLabel="Colaboradores"
            data={(data?.distribution?.byDepartment ?? []).map((d, i) => ({
              label: d.name ?? `Dept ${d.id ?? i}`,
              value: d.count,
            }))}
          />
        </div>
      )}
    </div>
  );
}
