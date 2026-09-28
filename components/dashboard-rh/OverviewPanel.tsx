// components/dashboard-rh/OverviewPanel.tsx
// Painel "Visão Geral" — KPIs agregados + distribuição por departamento.
// Dados próprios (useApiQuery) + apresentação, mesmo padrão auto-contido
// usado em components/payslips/page.tsx. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import type { LucideIcon } from 'lucide-react';
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
import { AlertStrip } from './AlertStrip';
import type { Alert, OverviewData } from './types';

// Cartão "tipo B" — inspirado em Udemy/MasterClass: ícone num badge
// circular colorido, número grande em destaque, label por baixo, sem
// fundo totalmente colorido (accent fica só no badge e na sombra ao
// hover). Substitui o antigo KpiCard (fundo sólido por intent).
type CardIntent = 'primary' | 'danger' | 'success' | 'warning' | 'info' | 'accent';

const INTENT_STYLES: Record<
  CardIntent,
  { badgeBg: string; badgeText: string; ring: string }
> = {
  primary: { badgeBg: 'bg-primary/10', badgeText: 'text-primary', ring: 'hover:ring-primary/20' },
  danger: { badgeBg: 'bg-danger/10', badgeText: 'text-danger', ring: 'hover:ring-danger/20' },
  success: { badgeBg: 'bg-success/10', badgeText: 'text-success', ring: 'hover:ring-success/20' },
  warning: { badgeBg: 'bg-warning/10', badgeText: 'text-warning', ring: 'hover:ring-warning/20' },
  info: { badgeBg: 'bg-info/10', badgeText: 'text-info', ring: 'hover:ring-info/20' },
  accent: { badgeBg: 'bg-accent/10', badgeText: 'text-accent', ring: 'hover:ring-accent/20' },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  intent: CardIntent;
}

function StatCard({ icon: Icon, label, value, sub, trend, intent }: StatCardProps) {
  const s = INTENT_STYLES[intent];
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-resting transition-shadow hover:shadow-lg hover:ring-4 ${s.ring}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${s.badgeBg} ${s.badgeText}`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-ink">{value}</p>
        <p className="mt-0.5 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {(sub || trend) && (
          <p className="mt-1 font-body text-xs text-ink-faint">
            {trend ? trend : sub}
          </p>
        )}
      </div>
    </div>
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
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );
  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <AlertStrip alerts={alerts} />

      {/* Top KPIs — cartão "tipo B" (Udemy/MasterClass): ícone em badge
          circular, número grande, label e sub/trend por baixo. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Colaboradores Activos"
          value={k.headcount?.total ?? 0}
          sub={k.headcount?.status}
          intent="primary"
        />
        <StatCard
          icon={TrendingDown}
          label="Taxa de Rotatividade"
          value={`${k.turnover?.rate ?? 0}%`}
          sub={k.turnover?.status}
          intent="danger"
        />
        <StatCard
          icon={UserPlus}
          label="Novas Admissões (mês)"
          value={k.newHires?.count ?? 0}
          trend={k.newHires?.trend}
          intent="success"
        />
        <StatCard
          icon={Star}
          label="Performance Média"
          value={k.performance?.avg?.toFixed(1) ?? '–'}
          intent="warning"
        />
        <StatCard
          icon={Target}
          label="Cobertura PDI"
          value={`${k.pdpCoverage?.pct ?? 0}%`}
          sub={k.pdpCoverage?.status}
          intent="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Conclusões (mês)"
          value={k.completions?.count ?? 0}
          intent="info"
        />
        <StatCard
          icon={MessageSquare}
          label="Respostas às Pesquisas"
          value={k.engagement?.surveyResponses ?? 0}
          intent="accent"
        />
        <StatCard
          icon={ShieldCheck}
          label="Formações Obrigatórias"
          value={k.mandatoryCompliance ?? 0}
          intent="danger"
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