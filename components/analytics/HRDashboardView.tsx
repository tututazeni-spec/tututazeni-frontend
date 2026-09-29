// components/analytics/HRDashboardView.tsx
// Separador "RH" — people/learning/PDI analytics e headcount por
// departamento. Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: cada grupo de métricas usa o padrão de "tile" plano de
// components/micro-learning/DashboardView.tsx (evita aninhar
// components/ui/KpiCard, com o seu próprio border/shadow, dentro de
// outro Card). Por pedido do cliente, todos os números e percentagens
// são apresentados a preto — sem cor de estado por métrica.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  UserPlus,
  UserMinus,
  BookOpen,
  CheckCircle2,
  XCircle,
  Target,
  Clock,
  Award,
  TrendingDown,
  BarChart3,
  Filter,
} from 'lucide-react';
import type { HRDashboard } from './types';

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string; stroke: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]', stroke: '#2B6CC4' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]', stroke: '#2E8B3E' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]', stroke: '#C9A227' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]', stroke: '#C0453F' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-4 pt-5">
        <Icon size={20} strokeWidth={1.75} className={t.text} />
        <p className={`mt-2 font-data text-2xl font-bold ${t.text}`}>{value}</p>
        <p className="mt-1 font-body text-xs font-medium text-ink-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

// TODO: substituir por dados reais quando soubermos o campo da API
// (ex.: data.people.turnoverTrend) com o histórico mensal da rotatividade.
const MOCK_TURNOVER_TREND = [5.1, 5.6, 4.9, 6.2, 5.8, 6.5];

function TrendKpiCard({
  icon: Icon,
  label,
  value,
  trendData,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trendData: number[];
  tone: Tone;
}) {
  const t = TONES[tone];
  const width = 100;
  const height = 28;
  const max = Math.max(...trendData, 1);
  const min = Math.min(...trendData, 0);
  const range = max - min || 1;
  const points = trendData
    .map((v, i) => {
      const x = (i / Math.max(trendData.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-4 pt-5">
        <Icon size={20} strokeWidth={1.75} className={t.text} />
        <p className={`mt-2 font-data text-2xl font-bold ${t.text}`}>{value}</p>
        <p className="mt-1 font-body text-xs font-medium text-ink-muted">
          {label}
        </p>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-2 h-7 w-full"
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke={t.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function HorizontalBarKpiCard({
  icon: Icon,
  label,
  value,
  percent,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  percent: number;
  tone: Tone;
}) {
  const t = TONES[tone];
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-4 pt-5">
        <Icon size={20} strokeWidth={1.75} className={t.text} />
        <p className={`mt-2 font-data text-2xl font-bold ${t.text}`}>{value}</p>
        <p className="mt-1 font-body text-xs font-medium text-ink-muted">
          {label}
        </p>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#E3E8EF]">
          <div
            className={`h-full rounded-full ${t.bar} transition-all`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// TODO: substituir por dados reais quando soubermos o campo da API com as
// etapas do funil de adopção de PDI (ex.: data.pdi.funnel). Enquanto isso,
// as duas primeiras etapas são estimadas a partir de adoptionRate.
function funnelStagesFromAdoption(adoptionRate: number) {
  const rate = Math.max(0, Math.min(100, adoptionRate));
  return [
    { label: 'Elegíveis', pct: 100 },
    { label: 'Iniciaram PDI', pct: Math.min(100, rate + 20) },
    { label: 'Adoptaram', pct: rate },
  ];
}

function FunnelKpiCard({
  icon: Icon,
  label,
  value,
  adoptionRate,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  adoptionRate: number;
  tone: Tone;
}) {
  const t = TONES[tone];
  const stages = funnelStagesFromAdoption(adoptionRate);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-4 pt-5">
        <Icon size={20} strokeWidth={1.75} className={t.text} />
        <p className={`mt-2 font-data text-2xl font-bold ${t.text}`}>{value}</p>
        <p className="mt-1 font-body text-xs font-medium text-ink-muted">
          {label}
        </p>
        <div className="mt-2 space-y-1">
          {stages.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E3E8EF]">
                <div
                  className={`h-full rounded-full ${t.bar}`}
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-body text-[10px] text-ink-faint">
                {Math.round(s.pct)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HRDashboardView() {
  const { data, isLoading } = useApiQuery<HRDashboard>(
    queryKeys.analyticsPage.hr(),
    '/analytics/hr',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-5">
      {/* People */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Análise de Dados de Pessoas
          </div>
          <div className="grid grid-cols-4 gap-3">
            <TopBarKpiCard
              icon={Users}
              label="Activos"
              value={data.people.total}
              tone="blue"
            />
            <TopBarKpiCard
              icon={UserPlus}
              label="Admitidos"
              value={data.people.hired}
              tone="green"
            />
            <TopBarKpiCard
              icon={UserMinus}
              label="Saídas"
              value={data.people.terminated}
              tone="red"
            />
            <TrendKpiCard
              icon={TrendingDown}
              label="Taxa de Rotatividade"
              value={`${data.people.turnoverRate}%`}
              trendData={MOCK_TURNOVER_TREND}
              tone="red"
            />
          </div>
        </CardBody>
      </Card>

      {/* Learning */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Análise da Aprendizagem
          </div>
          <div className="grid grid-cols-4 gap-3">
            <TopBarKpiCard
              icon={BookOpen}
              label="Matrículas"
              value={data.learning.enrollments}
              tone="blue"
            />
            <TopBarKpiCard
              icon={CheckCircle2}
              label="Concluídas"
              value={data.learning.completed}
              tone="green"
            />
            <HorizontalBarKpiCard
              icon={BarChart3}
              label="Taxa conclusão"
              value={`${data.learning.completionRate}%`}
              percent={data.learning.completionRate}
              tone="green"
            />
            <TopBarKpiCard
              icon={XCircle}
              label="Abandonadas"
              value={data.learning.abandoned}
              tone="red"
            />
          </div>
        </CardBody>
      </Card>

      {/* PDI */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Análise dos Planos de Desenvolvimento Individual
          </div>
          <div className="grid grid-cols-4 gap-3">
            <TopBarKpiCard
              icon={Target}
              label="PDIs activos"
              value={data.pdi.active}
              tone="blue"
            />
            <FunnelKpiCard
              icon={Filter}
              label="Adopção"
              value={`${data.pdi.adoptionRate}%`}
              adoptionRate={data.pdi.adoptionRate}
              tone="gold"
            />
            <TopBarKpiCard
              icon={Clock}
              label="Aguardando Aprovação"
              value={data.pdi.pendingApproval}
              tone="gold"
            />
            <TopBarKpiCard
              icon={Award}
              label="Concluídos (mês)"
              value={data.pdi.completed}
              tone="green"
            />
          </div>
        </CardBody>
      </Card>

      {/* Headcount por departamento */}
      {(data.headcountByDept?.length ?? 0) > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Colaboradores por Departamento
          </div>
          {(data.headcountByDept ?? []).map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0"
            >
              <div className="text-sm font-medium text-ink w-48 truncate">
                {d.name}
              </div>
              <div className="flex-1">
                <ProgressBar
                  value={Math.round((d.count / data.people.total) * 100)}
                />
              </div>
              <div className="text-sm font-data font-bold text-black w-8 text-right">
                {d.count}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
