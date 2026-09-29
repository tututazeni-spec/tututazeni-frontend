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
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { TopBarCard, type TopBarTone } from '@/components/ui/TopBarCard';
import { AlertStrip } from './AlertStrip';
import type { Alert, OverviewData } from './types';

// Cartão "tipo B" — inspirado em Udemy/MasterClass: ícone num badge
// circular colorido, número grande em destaque, label por baixo, sem
// fundo totalmente colorido (accent fica só no badge e na sombra ao
// hover). O KPI simples usa o componente partilhado TopBarCard; os
// cartões com gráfico de tendência ou barra de progresso ficam locais.
type Tone = TopBarTone;

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

// TODO: substituir por dados reais quando soubermos o campo da API
// (ex.: k.turnover.trend) com o histórico mensal da rotatividade.
const MOCK_TURNOVER_TREND = [6.2, 5.8, 6.5, 7.1, 6.4, 5.9];

interface TrendKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trendData: number[];
  tone: Tone;
}

function TrendKpiCard({ icon: Icon, label, value, sub, trendData, tone }: TrendKpiCardProps) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>{value}</p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">{label}</p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
        <div className="mt-3 h-14">
          <AreaLineChart
            series={[
              {
                label,
                points: trendData.map((v, i) => ({ x: i, y: v, xLabel: '' })),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

interface ProgressKpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  coveredPct: number;
  tone: Tone;
}

function ProgressKpiCard({ icon: Icon, label, value, sub, coveredPct, tone }: ProgressKpiCardProps) {
  const t = TONES[tone];
  const clamped = Math.max(0, Math.min(100, coveredPct));
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>{value}</p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">{label}</p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E3E8EF]">
          <div
            className={`h-full rounded-full ${t.bar} transition-all`}
            style={{ width: `${clamped}%` }}
          />
        </div>
        <p className="mt-1.5 font-body text-xs text-ink-faint">{Math.round(clamped)}% com PDI activo</p>
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
        <TopBarCard
          label="Colaboradores Activos"
          value={k.headcount?.total ?? 0}
          tone="blue"
          icon={<Users size={22} strokeWidth={1.75} />}
        />
        <TrendKpiCard
          icon={TrendingDown}
          label="Taxa de Rotatividade"
          value={`${k.turnover?.rate ?? 0}%`}
          sub={k.turnover?.status}
          trendData={MOCK_TURNOVER_TREND}
          tone="red"
        />
        <TopBarCard
          label="Novas Admissões (mês)"
          value={k.newHires?.count ?? 0}
          tone="green"
          icon={<UserPlus size={22} strokeWidth={1.75} />}
        />
        <TopBarCard
          label="Performance Média"
          value={k.performance?.avg?.toFixed(1) ?? '–'}
          tone="gold"
          icon={<Star size={22} strokeWidth={1.75} />}
        />
        <ProgressKpiCard
          icon={Target}
          label="Cobertura PDI"
          value={`${k.pdpCoverage?.pct ?? 0}%`}
          sub={k.pdpCoverage?.status}
          coveredPct={k.pdpCoverage?.pct ?? 0}
          tone="blue"
        />
        <TopBarCard
          label="Conclusões (mês)"
          value={k.completions?.count ?? 0}
          tone="blue"
          icon={<CheckCircle2 size={22} strokeWidth={1.75} />}
        />
        <TopBarCard
          label="Respostas às Pesquisas"
          value={k.engagement?.surveyResponses ?? 0}
          tone="gold"
          icon={<MessageSquare size={22} strokeWidth={1.75} />}
        />
        <TopBarCard
          label="Formações Obrigatórias"
          value={k.mandatoryCompliance ?? 0}
          tone="red"
          icon={<ShieldCheck size={22} strokeWidth={1.75} />}
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