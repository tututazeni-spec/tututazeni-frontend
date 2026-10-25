// components/dashboard-rh/OverviewPanel.tsx
// Painel "Visão Geral" — KPIs agregados + distribuição por departamento.
// Dados próprios (useApiQuery) + apresentação, mesmo padrão auto-contido
// usado em components/payslips/page.tsx. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import {
  Users,
  UserPlus,
  Star,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  SpeedometerStatCard,
  TURNOVER_BANDS,
  TURNOVER_MAX,
} from '@/components/ui/charts/SpeedometerStatCard';
import { AlertStrip } from './AlertStrip';
import type { Alert, OverviewData, PdiCoverageTrendPoint } from './types';

// Cobertura PDI com evolução mensal, em Card próprio (fora do NavyStatCard).
function PdiCoverageCard({ pct, status }: { pct: number; status?: string }) {
  const trendQ = useApiQuery<PdiCoverageTrendPoint[]>(
    queryKeys.dashboardRh.pdiCoverageTrend(),
    '/dashboard-rh/pdi-coverage-trend',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const trend = trendQ.data ?? [];
  return (
    <Card className="col-span-2 flex min-h-[232px] flex-col gap-2 p-5 transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Cobertura PDI
        </h3>
        <span className="font-display text-3xl font-bold text-ink">{pct}%</span>
      </div>
      {trend.length > 1 ? (
        <AreaLineChart
          height={190}
          yFormat={(v) => `${v}%`}
          series={[
            {
              label: 'Cobertura PDI',
              points: trend.map((t, i) => ({
                x: i,
                y: t.coverage,
                xLabel: t.month,
              })),
            },
          ]}
        />
      ) : (
        <p className="font-body text-xs text-ink-faint">
          Sem dados suficientes.
        </p>
      )}
      {status && (
        <p className="font-body text-[11px] text-ink-muted">{status}</p>
      )}
    </Card>
  );
}

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
        itemClassName="h-[155px] rounded-panel bg-surface-sunken"
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
          tab="headcount"
          label="Colaboradores Activos"
          value={k.headcount?.total ?? 0}
          tone="blue"
          icon={Users}
        />
        <SpeedometerStatCard
          label="Taxa de Rotatividade"
          value={k.turnover?.rate ?? 0}
          max={TURNOVER_MAX}
          bands={TURNOVER_BANDS}
          display={`${Math.round(k.turnover?.rate ?? 0)}%`}
          caption={k.turnover?.status}
        />
        <NavyStatCard
          tab="headcount"
          label="Novas Admissões (mês)"
          value={k.newHires?.count ?? 0}
          tone="green"
          icon={UserPlus}
        />
        <NavyStatCard
          tab="performance"
          label="Performance Média"
          value={k.performance?.avg?.toFixed(1) ?? '–'}
          tone="orange"
          icon={Star}
        />
        <PdiCoverageCard
          pct={k.pdpCoverage?.pct ?? 0}
          status={k.pdpCoverage?.status}
        />
        <NavyStatCard
          tab="training"
          label="Conclusões (mês)"
          value={k.completions?.count ?? 0}
          tone="blue"
          icon={CheckCircle2}
        />
        <NavyStatCard
          tab="engagement"
          label="Respostas às Pesquisas"
          value={k.engagement?.surveyResponses ?? 0}
          tone="orange"
          icon={MessageSquare}
        />
        <NavyStatCard
          tab="training"
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
