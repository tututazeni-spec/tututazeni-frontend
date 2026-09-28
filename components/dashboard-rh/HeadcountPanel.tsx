// components/dashboard-rh/HeadcountPanel.tsx
// Painel "Headcount" — KPIs, tempo de casa, evolução mensal e aniversários.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import { Trophy } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import type {
  AnniversaryUser,
  EmployeesHeadcountData,
  HeadcountData,
  HeadcountTrendPoint,
} from './types';

export function HeadcountPanel() {
  const dataQ = useApiQuery<HeadcountData>(
    queryKeys.dashboardRh.headcount(),
    '/dashboard-rh/headcount',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const trendQ = useApiQuery<HeadcountTrendPoint[]>(
    queryKeys.dashboardRh.headcountTrend(),
    '/dashboard-rh/headcount-trend',
    { params: { months: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = dataQ.data ?? null;
  const trend = trendQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
<<<<<<< Updated upstream
        <KpiCard
          label="Total"
          value={data?.total ?? 0}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Activos"
          value={data?.active ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          label="Taxa de Rotatividade"
          value={`${data?.turnoverRate ?? 0}%`}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          label="Tempo Médio de Serviço"
          value={`${data?.avgTenureMonths ?? 0}m`}
          sub={`≈ ${((data?.avgTenureMonths ?? 0) / 12).toFixed(1)} anos`}
          intent="primary"
          className="w-full"
=======
        <TopBarKpiCard
          icon={Users}
          label="Total"
          value={data?.total ?? 0}
          tone="blue"
        />
        <TopBarKpiCard
          icon={UserCheck}
          label="Activos"
          value={data?.active ?? 0}
          tone="green"
        />
        <TrendKpiCard
          icon={TrendingDown}
          label="Taxa de Rotatividade"
          value={`${data?.turnoverRate ?? 0}%`}
          trendData={MOCK_TURNOVER_TREND}
          tone="red"
        />
        <TopBarKpiCard
          icon={Clock}
          label="Tempo Médio de Serviço"
          value={`${data?.avgTenureMonths ?? 0}m`}
          sub={`≈ ${((data?.avgTenureMonths ?? 0) / 12).toFixed(1)} anos`}
          tone="blue"
>>>>>>> Stashed changes
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tenure buckets */}
        {data?.byTenure && (
          <div className="rounded-card border border-border bg-surface p-5">
            <h4 className="mb-4 font-body font-semibold text-ink-muted">
              Distribuição por Tempo de Casa
            </h4>
            <BarChart
              categories={Object.keys(data.byTenure)}
              series={[
                {
                  label: 'Colaboradores',
                  values: Object.values(data.byTenure),
                },
              ]}
            />
          </div>
        )}

        {/* Monthly trend */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Evolução Mensal
          </h4>
          {trend.length > 0 ? (
            <AreaLineChart
              series={[
                {
                  label: 'Colaboradores',
                  points: trend.map((t, i) => ({
                    x: i,
                    y: t.count,
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
        </div>
      </div>

      {/* Anniversaries */}
      <AnniversariesWidget />

      {/* Segmentação real de contratos — módulo employees/ (ficha de
          colaborador), complementar ao headcount por departamento/cargo
          acima (modelo User). */}
      <EmploymentSegmentationWidget />
    </div>
  );
}

<<<<<<< Updated upstream
=======
// Cartão estilo Udemy/MasterClass: badge de ícone colorido, número grande
// em destaque, etiqueta discreta por baixo, elevação subtil ao hover.
// Local a este painel — não substitui o KpiCard partilhado.
type StatIntent = 'primary' | 'success' | 'danger';

const STAT_INTENT_STYLES: Record<StatIntent, { badge: string }> = {
  primary: { badge: 'bg-primary/10 text-primary' },
  success: { badge: 'bg-success/10 text-success' },
  danger: { badge: 'bg-danger/10 text-danger' },
};

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </div>
    </div>
  );
}

// TODO: substituir por dados reais quando soubermos o campo da API
// (ex.: data.turnoverTrend) com o histórico mensal da rotatividade.
const MOCK_TURNOVER_TREND = [6.2, 5.8, 6.5, 7.1, 6.4, 5.9];

function TrendKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trendData,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trendData: number[];
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-shadow hover:shadow-lg">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
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

>>>>>>> Stashed changes
function SegmentBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <div>
      <h5 className="mb-2 font-body text-xs font-semibold text-ink-muted">
        {title}
      </h5>
      {rows.map((r, i) => (
        <div key={i} className="mb-2">
          <div className="mb-0.5 flex justify-between font-body text-xs">
            <span className="truncate text-ink-muted">{r.label}</span>
            <span className="font-semibold text-ink">{r.count}</span>
          </div>
          <ProgressBar value={max > 0 ? (r.count / max) * 100 : 0} />
        </div>
      ))}
    </div>
  );
}

// FIX: dashboard-rh só segmentava headcount por departamento/cargo (modelo
// User). O módulo employees/ mantém a ficha completa do colaborador
// (senioridade, tipo de contrato, modo de trabalho) — dado real e usado em
// components/employees/CreateEmployeeModal.tsx, mas até agora invisível
// neste dashboard. `retry: false` + esconder se vazio: tabela Employee só
// é populada à medida que RH cria fichas, pode estar vazia nalguns
// ambientes.
function EmploymentSegmentationWidget() {
  const { data } = useApiQuery<EmployeesHeadcountData>(
    queryKeys.dashboardRh.employeesHeadcount(),
    '/employees/headcount',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  if (!data?.total) return null;

  const toRows = (
    arr: { [key: string]: unknown; _count: number }[] | undefined,
    field: string,
  ) =>
    (arr ?? [])
      .map((r) => ({
        label: String(r[field] ?? 'Não definido'),
        count: r._count,
      }))
      .sort((a, b) => b.count - a.count);

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h4 className="mb-4 font-body font-semibold text-ink-muted">
        Segmentação de Contratos ({data.total} fichas de colaborador)
      </h4>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <SegmentBreakdown
          title="Por Senioridade"
          rows={toRows(data.bySeniority, 'seniority')}
        />
        <SegmentBreakdown
          title="Por Tipo de Contrato"
          rows={toRows(data.byContractType, 'contractType')}
        />
        <SegmentBreakdown
          title="Por Modo de Trabalho"
          rows={toRows(data.byWorkMode, 'workMode')}
        />
      </div>
    </div>
  );
}

function AnniversariesWidget() {
  const { data = [] } = useApiQuery<AnniversaryUser[]>(
    queryKeys.dashboardRh.anniversaries(),
    '/dashboard-rh/anniversaries',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  if (!data.length) return null;
  return (
    <div className="rounded-card border border-warning-subtle bg-warning-subtle p-4">
      <h4 className="mb-3 flex items-center gap-2 font-body font-semibold text-warning-ink">
        Aniversários de Empresa este Mês
      </h4>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {data.slice(0, 6).map((u, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-control bg-surface px-3 py-2"
          >
            <Avatar name={u.fullName} url={u.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-body text-xs font-medium text-ink">
                {u.fullName}
              </p>
              <p className="font-body text-[10px] font-semibold text-warning-ink">
                {u.years} {u.years === 1 ? 'ano' : 'anos'}{' '}
                <Trophy
                  size={12}
                  strokeWidth={1.75}
                  className="inline align-[-2px]"
                />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
