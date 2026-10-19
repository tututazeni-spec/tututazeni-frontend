// components/scalability/ScalabilityDashboardView.tsx
// Vista apresentacional do módulo de Escalabilidade — sem estado próprio,
// sem fetch, sem efeitos. Recebe todos os dados e callbacks via props do
// container (app/(platform)/scalability/page.tsx).
//
// Migrado para a fundação de design light-theme (tokens canvas/surface/ink,
// componentes partilhados em components/ui/). Antes era um dashboard em tema
// escuro auto-contido (#080d19, header próprio, ícones glífo, cores neon) —
// documentado como exceção; essa exceção foi agora fechada. Cor reduzida ao
// mínimo semântico (estado danger/warning/success), números a preto. Os
// separadores levam um ícone lucide (padrão de components/evaluation360).

'use client';

import { PeriodPills } from '@/components/ui/Pills';
import { useId, useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { ThermometerStatCard } from '@/components/ui/charts/ThermometerStatCard';
import {
  INVERSE_RATE_BANDS,
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import {
  Activity,
  Bell,
  Boxes,
  Database,
  FileText,
  Gauge,
  Globe,
  HardDrive,
  ListChecks,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Siren,
  FlaskConical,
  Wallet,
  Info,
  Pencil,
  Clock,
  Timer,
  CalendarDays,
  BarChart3,
  TrendingUp,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
  Plug,
  Scaling,
  Server,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { CreateRuleModal } from '@/components/automation/CreateRuleModal';
import { ImportUsersModal } from './ImportUsersModal';
import { NewIntegrationModal } from './NewIntegrationModal';
import { LoadTestModal } from './LoadTestModal';
import {
  AutoScalingTab,
  CapacityTab,
  CardTitleBar,
  ResilienceTab,
} from './InfraTabs';
import { ForecastsTab, IncidentsTab } from './IncidentsForecastsTabs';
import {
  AlertRulesSection,
  CostsTab,
  LoadTestsTab,
} from './LoadTestsCostsAlertsTabs';
import { ReportsTab, SettingsTab } from './ReportsSettingsTabs';
import {
  EndpointHistoryChart,
  HourlyHistoryCharts,
  QueueHistoryChart,
  RecommendationsCard,
} from './HistoryCharts';
import { WhatIfPanel } from './WhatIfPanel';
import { RetentionStatusCard } from './RetentionStatusCard';
import { RenameTenantModal } from './RenameTenantModal';
import { SlaConfigModal } from './SlaConfigModal';
import { ContentDeliveryConfigModal } from './ContentDeliveryConfigModal';
import type {
  AlertSeverity,
  IntegrationStatus,
  DashboardData,
  OverviewChartsData,
  UsersLoadData,
  UsersLoadSegmentRow,
  ApiMetricsData,
  DatabaseMetricsData,
  FrontendMetricsData,
  QueueMetricsData,
  StorageMetricsData,
  IntegrationMetricsData,
  PerformanceMetricsData,
  CapacityMetricsData,
  AutoScalingData,
  AutoScalingUpdate,
  ResilienceData,
  ResilienceUpdate,
  IncidentsData,
  IncidentCreate,
  IncidentUpdate,
  ForecastsData,
  LoadTestsData,
  LoadTestCreate,
  LoadTestUpdate,
  CostsData,
  CostsSave,
  AlertRulesData,
  ReportCatalogData,
  ReportData,
  ReportFormat,
  SettingsData,
  SettingsUpdate,
  PerfClass,
  PageStatus,
  Alert,
  Integration,
  AutomationRule,
  SlaConfig,
  ContentDeliveryConfig,
} from './types';

// ─── UTILITY FUNCTIONS ─────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function formatPercent(v: number, decimals = 1): string {
  return v.toFixed(decimals) + '%';
}

type StateIntent = 'danger' | 'warning' | 'success' | 'info';

const INTENT_TEXT: Record<StateIntent, string> = {
  danger: 'text-danger',
  warning: 'text-warning',
  success: 'text-success',
  info: 'text-info',
};

// ─── SHARED MICRO-COMPONENTS ──────────────────────────────

interface SectionHeaderProps {
  title: string;
  sub?: string;
  /** Faixa #0F1F3D a 60% com letra branca (sem efeito de cursor). */
  banner?: boolean;
}

function SectionHeader({ title, sub, banner = false }: SectionHeaderProps) {
  if (banner)
    return (
      <div className="rounded-card bg-[#0F1F3D]/60 px-5 py-3 text-white">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        {sub && <p className="mt-1 font-body text-sm text-white/80">{sub}</p>}
      </div>
    );
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {sub && <p className="mt-1 font-body text-sm text-ink-muted">{sub}</p>}
    </div>
  );
}

interface ThresholdBarProps {
  /** 0–100 */
  pct: number;
  state?: StateIntent;
  className?: string;
}

function ThresholdBar({ pct, state, className }: ThresholdBarProps) {
  const fill =
    state === 'danger'
      ? 'bg-danger'
      : state === 'warning'
        ? 'bg-warning'
        : 'bg-primary';
  return (
    <div
      className={cn(
        'h-1.5 w-full overflow-hidden rounded-pill bg-surface-sunken',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-300',
          fill,
        )}
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
      />
    </div>
  );
}

// Taxa de erro (escala 0–5%): mais baixo é melhor.
const ERROR_RATE_BANDS = [
  { to: 1, color: '#2f9e63' },
  { to: 2, color: '#8fc23f' },
  { to: 3, color: '#f1c40f' },
  { to: 4, color: '#e67e22' },
  { to: 5, color: '#c0392b' },
];

// Cards "Crescimento" (public/images/crescimento diario…): fundo sólido,
// ícone em círculo, valor grande, variação e traço de tendência decorativo.
const GROWTH_TONES = {
  blue: 'bg-[#1E4A9E]',
  green: 'bg-[#1F8A5F]',
  purple: 'bg-[#4B2FA3]',
} as const;

function GrowthCard({
  icon: Icon,
  tone,
  label,
  value,
  chip,
  caption,
}: {
  icon: typeof Users;
  tone: keyof typeof GROWTH_TONES;
  label: string;
  value: string;
  /** Linha de variação (com ▲); omitida quando não há dados. */
  chip?: string;
  caption: string;
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-[155px] flex-col justify-between overflow-hidden rounded-panel p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)] transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100',
        GROWTH_TONES[tone],
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <h3 className="font-body text-sm font-semibold">{label}</h3>
      </div>
      <div>
        <p className="font-display text-4xl font-bold leading-none">{value}</p>
        {chip && (
          <p className="mt-3 flex items-center gap-1 font-body text-xs font-semibold text-[#6EE7A8]">
            <span aria-hidden>▲</span> {chip}
          </p>
        )}
        <p className="mt-0.5 font-body text-xs text-white/80">{caption}</p>
      </div>
      <svg
        aria-hidden
        viewBox="0 0 100 50"
        className="absolute bottom-4 right-4 h-12 w-24 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2,44 22,30 36,36 56,18 70,24 94,4" />
        <polyline points="82,4 94,4 94,16" />
      </svg>
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  barValue?: number;
  barMax?: number;
  barWarn?: number;
  barDanger?: number;
  /** Rótulo num cabeçalho navy (#0F1F3D a 60%) em vez de texto solto. */
  headed?: boolean;
}

function MetricTile({
  label,
  value,
  unit,
  sub,
  barValue,
  barMax,
  barWarn,
  barDanger,
  headed = false,
}: MetricTileProps) {
  const hasBar = barValue !== undefined && barMax !== undefined;
  const pct = hasBar ? (barValue! / barMax!) * 100 : 0;
  const isDanger =
    barValue !== undefined && barDanger !== undefined && barValue >= barDanger;
  const isWarn =
    !isDanger &&
    barValue !== undefined &&
    barWarn !== undefined &&
    barValue >= barWarn;

  return (
    <Card className={headed ? 'overflow-hidden' : undefined}>
      {headed && <CardTitleBar>{label}</CardTitleBar>}
      <CardBody>
        {!headed && (
          <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
            {label}
          </p>
        )}
        <p className="mt-1 font-display text-2xl font-bold text-ink">
          {value}
          {unit && (
            <span className="ml-1 font-body text-sm font-normal text-ink-muted">
              {unit}
            </span>
          )}
        </p>
        {sub && (
          <p className="mt-0.5 font-body text-xs text-ink-faint">{sub}</p>
        )}
        {hasBar && (
          <ThresholdBar
            pct={pct}
            state={isDanger ? 'danger' : isWarn ? 'warning' : undefined}
            className="mt-3"
          />
        )}
      </CardBody>
    </Card>
  );
}

interface StatusRow {
  label: string;
  value: string | number;
  intent?: StateIntent;
}

interface StatusCardProps {
  title: string;
  rows: StatusRow[];
}

function StatusCard({ title, rows }: StatusCardProps) {
  return (
    <Card className="overflow-hidden">
      <h3 className="flex items-center bg-[#0F1F3D]/60 px-5 py-3 font-body text-sm font-semibold text-white">
        {title}
      </h3>
      <CardBody>
        <div className="flex flex-col gap-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="font-body text-sm text-ink-muted">
                {r.label}
              </span>
              <span
                className={cn(
                  'font-body text-sm font-semibold',
                  r.intent ? INTENT_TEXT[r.intent] : 'text-ink',
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-pill border px-3 py-1 font-body text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary-subtle text-primary'
          : 'border-border text-ink-muted hover:text-ink',
      )}
    >
      {label}
    </button>
  );
}

// ─── STATUS MAPPINGS ───────────────────────────────────────

const INTEGRATION_STATUS: Record<
  IntegrationStatus,
  { label: string; intent: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  ACTIVE: { label: 'Activo', intent: 'success' },
  INACTIVE: { label: 'Inactivo', intent: 'neutral' },
  ERROR: { label: 'Erro', intent: 'danger' },
  PENDING_AUTH: { label: 'Aguarda Auth', intent: 'warning' },
  RATE_LIMITED: { label: 'Limite Atingido', intent: 'warning' },
  CONFIGURING: { label: 'Em Configuração', intent: 'neutral' },
  SUSPENDED: { label: 'Suspensa', intent: 'warning' },
};

const SEVERITY: Record<
  AlertSeverity,
  { label: string; intent: 'danger' | 'warning' | 'info'; border: string }
> = {
  CRITICAL: { label: 'Crítico', intent: 'danger', border: 'border-l-danger' },
  WARNING: { label: 'Aviso', intent: 'warning', border: 'border-l-warning' },
  INFO: { label: 'Info', intent: 'info', border: 'border-l-info' },
};

// ─── TAB PANELS ────────────────────────────────────────────

// ─── INDICADOR GERAL DE CAPACIDADE (modulo_scalability.md §4) ──

type CapacityState = 'Saudável' | 'Atenção' | 'Elevada utilização' | 'Crítica';

function capacityState(pct: number): {
  label: CapacityState;
  intent: 'success' | 'warning' | 'danger';
  bar?: StateIntent;
} {
  if (pct >= 90) return { label: 'Crítica', intent: 'danger', bar: 'danger' };
  if (pct >= 75)
    return { label: 'Elevada utilização', intent: 'warning', bar: 'warning' };
  if (pct >= 50) return { label: 'Atenção', intent: 'warning' };
  return { label: 'Saudável', intent: 'success' };
}

function CapacityIndicator({
  data,
  onRename,
}: {
  data: DashboardData;
  onRename: () => void;
}) {
  const { tenantInfo: t, performanceSummary: p } = data;
  const gid = useId();
  // A capacidade global é ditada pelo recurso mais utilizado (o gargalo).
  const resources = [
    { name: 'CPU', pct: p.cpuUsagePercent },
    { name: 'memória', pct: p.memoryUsagePercent },
    { name: 'base de dados', pct: p.dbUsagePercent ?? 0 },
    { name: 'armazenamento', pct: (t.storageUsedGb / t.maxStorageGb) * 100 },
    { name: 'licenças', pct: (t.activeUsersCount / t.maxUsers) * 100 },
  ].map((r) => ({ ...r, pct: Number.isFinite(r.pct) ? r.pct : 0 }));
  const bottleneck = resources.reduce((a, b) => (b.pct > a.pct ? b : a));
  const pct = Math.min(Math.round(bottleneck.pct), 100);
  const state = capacityState(pct);
  // Estimativa calculada no backend (medida do histórico ou modelo teórico).
  const estimate = data.capacityEstimate;
  const supported = estimate?.concurrentUsers ?? null;

  const statusColor =
    state.intent === 'danger'
      ? '#F87171'
      : state.intent === 'warning'
        ? '#FBBF24'
        : '#34D399';

  const size = 120;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      <div className="mb-2 flex items-center gap-3">
        <Server className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        <h3 className="font-display text-base font-bold uppercase tracking-wide">
          Tenant activo e capacidade
        </h3>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label={`Capacidade da INNOVA: ${pct}%`}
            className="-rotate-90"
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7CC4FF" />
                <stop offset="100%" stopColor="#2F80ED" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circ} ${circ}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold">
            {pct}%
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="font-display text-xl font-bold leading-snug">
              {t.tenantName}
            </p>
            <button
              type="button"
              onClick={onRename}
              aria-label="Editar nome da empresa"
              className="rounded-control p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7CC4FF]"
            >
              <Pencil size={16} strokeWidth={1.75} />
            </button>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-body text-xs font-semibold">
              {t.plan}
            </span>
          </div>
          <div className="flex flex-wrap items-stretch gap-x-8 gap-y-2">
            <div>
              <p className="font-body text-sm text-white/70">Estado</p>
              <p
                className="mt-1 flex items-center gap-2 font-display text-xl font-semibold"
                style={{ color: statusColor }}
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                {state.label}
              </p>
            </div>
            <div className="hidden w-px bg-white/20 sm:block" />
            <div>
              <p className="font-body text-sm text-white/70">
                Utilizadores simultâneos
              </p>
              <p className="font-display text-2xl font-bold">
                {supported !== null ? supported.toLocaleString() : '–'}
              </p>
            </div>
            <div className="hidden w-px bg-white/20 sm:block" />
            <div>
              <p className="font-body text-sm text-white/70">
                Recurso mais utilizado
              </p>
              <p className="font-display text-xl font-bold capitalize">
                {bottleneck.name}
              </p>
              <p className="font-body text-xs text-white/70">{pct}% em uso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
        <Info className="h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
        <span>
          {supported !== null
            ? `A infraestrutura atual suporta aproximadamente ${supported.toLocaleString()} utilizadores simultâneos nas condições atuais.`
            : 'Estimativa de capacidade indisponível.'}
          {estimate &&
            ` ${estimate.method === 'MEASURED' ? 'Valor medido' : 'Estimativa teórica'} — ${estimate.basis}`}
        </span>
      </div>
    </div>
  );
}

// ─── GRÁFICOS PRINCIPAIS (modulo_scalability.md §5) ───────────

interface ChartCardProps {
  title: string;
  sub?: string;
  children: React.ReactNode;
}

function ChartCard({ title, sub, children }: ChartCardProps) {
  return (
    <Card>
      <CardBody>
        <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </p>
        {sub && <p className="mb-3 font-body text-xs text-ink-faint">{sub}</p>}
        {children}
      </CardBody>
    </Card>
  );
}

const MONTHS_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS_PT[Number(m) - 1]} ${y.slice(2)}`;
}

function forecastText(
  f: OverviewChartsData['forecast'],
  hasGrowthData: boolean,
): string {
  if (!hasGrowthData) return 'Sem dados suficientes para prever.';
  if (f.alreadyReached)
    return `Os utilizadores registados já atingiram ${f.thresholdPercent}% da capacidade licenciada (${f.targetUsers.toLocaleString()} utilizadores).`;
  if (f.monthsToThreshold === null)
    return 'Sem crescimento de utilizadores nos últimos 3 meses — não há previsão de saturação.';
  const unit = f.monthsToThreshold === 1 ? 'mês' : 'meses';
  return `Com o crescimento atual (${f.monthlyGrowth.toLocaleString()} novos utilizadores/mês), a infraestrutura atingirá ${f.thresholdPercent}% da capacidade estimada em aproximadamente ${f.monthsToThreshold} ${unit}.`;
}

interface OverviewChartsProps {
  data: DashboardData;
  charts: OverviewChartsData | null;
}

function OverviewCharts({ data, charts }: OverviewChartsProps) {
  const { tenantInfo: t, performanceSummary: p, capacityEstimate } = data;
  // 'accounts' = contas atualmente ativas criadas até cada mês;
  // 'sessions' = utilizadores com sessão (login) nesse mês.
  const [activeMode, setActiveMode] = useState<'accounts' | 'sessions'>(
    'accounts',
  );
  const timeline = charts?.timeline ?? [];
  const growth = charts?.userGrowth ?? [];

  const hourLabel = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  const line = (
    label: string,
    pick: (m: OverviewChartsData['timeline'][number]) => number,
  ) => ({
    label,
    points: timeline.map((m, i) => ({
      x: i,
      y: pick(m),
      xLabel: hourLabel(m.at),
    })),
  });
  const growthLine = (
    label: string,
    pick: (g: OverviewChartsData['userGrowth'][number]) => number,
  ) => ({
    label,
    points: growth.map((g, i) => ({
      x: i,
      y: pick(g),
      xLabel: monthLabel(g.month),
    })),
  });

  // Capacidade disponível vs consumo atual, em % do limite de cada recurso.
  const capacityRows = [
    {
      name: 'Utilizadores simultâneos',
      pct: capacityEstimate
        ? (p.activeSessionsNow / capacityEstimate.concurrentUsers) * 100
        : 0,
    },
    { name: 'Licenças', pct: (t.activeUsersCount / t.maxUsers) * 100 },
    { name: 'CPU', pct: p.cpuUsagePercent },
    { name: 'Memória', pct: p.memoryUsagePercent },
    { name: 'Base de dados', pct: p.dbUsagePercent ?? 0 },
    { name: 'Armazenamento', pct: (t.storageUsedGb / t.maxStorageGb) * 100 },
  ].map((r) => ({
    ...r,
    pct: Number.isFinite(r.pct) ? Math.round(r.pct * 10) / 10 : 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Gráficos principais"
        sub="Utilização nas últimas 24 horas, crescimento de utilizadores e capacidade"
      />
      {timeline.length === 0 ? (
        <EmptyState
          title="Sem métricas nas últimas 24 horas"
          description="O histórico é preenchido automaticamente a cada minuto."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="CPU e RAM" sub="% média por hora">
            <AreaLineChart
              series={[
                line('CPU', (m) => m.cpuUsagePercent),
                line('RAM', (m) => m.memoryUsagePercent),
              ]}
              yFormat={(v) => `${v}%`}
            />
          </ChartCard>
          <ChartCard title="Utilizadores simultâneos" sub="Pico por hora">
            <AreaLineChart
              series={[line('Simultâneos', (m) => m.concurrentSessions)]}
            />
          </ChartCard>
          <ChartCard title="Requests" sub="Pedidos por minuto (média por hora)">
            <AreaLineChart
              series={[line('Requests/min', (m) => m.requestsPerMinute)]}
            />
          {!charts?.trafficSourceConnected && (
            <p className="mt-2 font-body text-xs text-ink-faint">
              Sem fonte de monitorização ligada — será preenchido quando o
              módulo Monitoring estiver ativo.
            </p>
          )}
          </ChartCard>
          <ChartCard title="Latência" sub="Latência média da API (ms)">
            <AreaLineChart
              series={[line('Latência', (m) => m.avgLatencyMs)]}
              yFormat={(v) => `${v}ms`}
            />
          {!charts?.trafficSourceConnected && (
            <p className="mt-2 font-body text-xs text-ink-faint">
              Sem fonte de monitorização ligada — será preenchido quando o
              módulo Monitoring estiver ativo.
            </p>
          )}
          </ChartCard>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Crescimento de utilizadores"
          sub="Últimos 12 meses — registados, ativos e novos por mês"
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <FilterChip
              label="Ativos: contas ativas"
              active={activeMode === 'accounts'}
              onClick={() => setActiveMode('accounts')}
            />
            <FilterChip
              label="Ativos: com sessão no mês"
              active={activeMode === 'sessions'}
              onClick={() => setActiveMode('sessions')}
            />
          </div>
          <AreaLineChart
            series={[
              growthLine('Registados', (g) => g.registered),
              growthLine(
                activeMode === 'accounts' ? 'Ativos (contas)' : 'Ativos (sessão)',
                (g) => (activeMode === 'accounts' ? g.active : g.activeInMonth),
              ),
              growthLine('Novos no mês', (g) => g.newUsers),
            ]}
          />
        </ChartCard>
        <ChartCard
          title="Capacidade vs utilização"
          sub="Consumo atual em % do limite disponível de cada recurso"
        >
          <BarChart
            orientation="horizontal"
            categories={capacityRows.map((r) => r.name)}
            series={[
              {
                label: 'Consumo atual (%)',
                values: capacityRows.map((r) => r.pct),
              },
            ]}
            yFormat={(v) => `${v}%`}
          />
          <p className="mt-2 font-body text-xs text-ink-faint">
            Capacidade disponível: 100% − consumo atual.
          </p>
        </ChartCard>
      </div>

      {charts && (
        <div className="rounded-card border border-border bg-surface px-4 py-3 font-body text-sm text-ink">
          <span className="font-semibold">Previsão: </span>
          {forecastText(charts.forecast, growth.length > 0)}
        </div>
      )}
    </div>
  );
}

interface OverviewTabProps {
  data: DashboardData;
  charts: OverviewChartsData | null;
}

function OverviewTab({ data, charts }: OverviewTabProps) {
  const {
    tenantInfo: t,
    performanceSummary: p,
    integrations,
    automations,
    alerts,
    slaCompliance,
  } = data;
  const userPct = (t.activeUsersCount / t.maxUsers) * 100;
  const storagePct = (t.storageUsedGb / t.maxStorageGb) * 100;
  const [renaming, setRenaming] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <CapacityIndicator data={data} onRename={() => setRenaming(true)} />

      {renaming && (
        <RenameTenantModal
          tenantId={t.id}
          currentName={t.tenantName}
          onClose={() => setRenaming(false)}
        />
      )}

      {/* SLA breach */}
      {slaCompliance.isBreached && (
        <div className="rounded-card border border-danger bg-danger-subtle px-4 py-3 font-body text-sm text-ink">
          SLA em violação — Uptime actual (
          {formatPercent(slaCompliance.currentUptimePercent, 2)}) abaixo do
          contratado ({formatPercent(slaCompliance.slaTarget, 1)})
        </div>
      )}

      {/* Primary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NavyStatCard
          icon={Users}
          tone="blue"
          label="Utilizadores Registados"
          value={(t.registeredUsersCount ?? t.activeUsersCount).toLocaleString()}
        />
        <NavyStatCard
          icon={Boxes}
          tone="green"
          label="Capacidade Estimada"
          value={t.maxUsers.toLocaleString()}
          sub="utilizadores"
        />
        <NavyStatCard
          icon={Gauge}
          tone="orange"
          label="Latência Média"
          value={`${p.avgLatencyMs} ms`}
          sub={`Limite SLA: ${slaCompliance.latencyTarget}ms`}
        />
        <NavyStatCard
          icon={Activity}
          tone="blue"
          label="Sessões Simultâneas"
          value={p.activeSessionsNow.toLocaleString()}
          sub="em tempo real"
        />
        <SpeedometerStatCard
          label="Utilizadores Activos"
          value={userPct}
          bands={INVERSE_RATE_BANDS}
          display={formatPercent(userPct, 0)}
          caption={`${t.activeUsersCount.toLocaleString()} de ${t.maxUsers.toLocaleString()} licenças`}
        />
        <SpeedometerStatCard
          label="Utilização da Capacidade"
          value={userPct}
          bands={INVERSE_RATE_BANDS}
          display={formatPercent(userPct, 0)}
          caption={`${t.activeUsersCount.toLocaleString()} de ${t.maxUsers.toLocaleString()}`}
        />
        <SpeedometerStatCard
          label="CPU"
          value={p.cpuUsagePercent}
          bands={INVERSE_RATE_BANDS}
          display={formatPercent(p.cpuUsagePercent, 0)}
        />
        <SpeedometerStatCard
          label="Memória"
          value={p.memoryUsagePercent}
          bands={INVERSE_RATE_BANDS}
          display={formatPercent(p.memoryUsagePercent, 0)}
        />
        <SpeedometerStatCard
          label="Base de Dados"
          value={p.dbUsagePercent ?? 0}
          bands={INVERSE_RATE_BANDS}
          display={formatPercent(p.dbUsagePercent ?? 0, 0)}
          caption="ligações abertas / máximo"
        />
        <SpeedometerStatCard
          label="Armazenamento"
          value={storagePct}
          bands={INVERSE_RATE_BANDS}
          display={formatPercent(storagePct, 0)}
          caption={`${t.storageUsedGb}GB de ${t.maxStorageGb}GB`}
        />
        <SpeedometerStatCard
          label="Uptime"
          value={p.uptimePercent}
          bands={RATE_BANDS}
          display={formatPercent(p.uptimePercent, 2)}
          caption={`SLA: ≥${formatPercent(slaCompliance.slaTarget, 1)}`}
        />
        <SpeedometerStatCard
          label="Taxa de Erro"
          value={p.errorRate}
          max={5}
          bands={ERROR_RATE_BANDS}
          display={formatPercent(p.errorRate, 2)}
          caption="últimos 60 min"
        />
      </div>

      <OverviewCharts data={data} charts={charts} />

      {/* Status cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatusCard
          title="Integrações"
          rows={[
            { label: 'Total', value: integrations.total },
            {
              label: 'Activas',
              value: integrations.active,
              intent: 'success',
            },
            {
              label: 'Com erro',
              value: integrations.withErrors,
              intent: integrations.withErrors > 0 ? 'danger' : undefined,
            },
            {
              label: 'Última sincronização',
              value: integrations.lastSyncAt
                ? timeAgo(integrations.lastSyncAt)
                : '—',
            },
          ]}
        />
        <StatusCard
          title="Automações"
          rows={[
            { label: 'Total de regras', value: automations.total },
            { label: 'Activas', value: automations.active, intent: 'success' },
            { label: 'Execuções hoje', value: automations.executionsToday },
            {
              label: 'Falhas hoje',
              value: automations.failedToday,
              intent: automations.failedToday > 0 ? 'warning' : undefined,
            },
          ]}
        />
        <StatusCard
          title="Alertas Abertos"
          rows={[
            { label: 'Total abertos', value: alerts.open },
            {
              label: 'Críticos',
              value: alerts.critical,
              intent: alerts.critical > 0 ? 'danger' : undefined,
            },
            {
              label: 'Avisos',
              value: alerts.warning,
              intent: alerts.warning > 0 ? 'warning' : undefined,
            },
            { label: 'Informativos', value: alerts.info },
          ]}
        />
      </div>
    </div>
  );
}

const PERF_CLASS: Record<
  PerfClass,
  { label: string; intent: 'success' | 'info' | 'warning' | 'danger' }
> = {
  EXCELENTE: { label: 'Excelente', intent: 'success' },
  NORMAL: { label: 'Normal', intent: 'info' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  DEGRADACAO: { label: 'Degradação', intent: 'danger' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

function PerformanceKpis({ perf }: { perf: PerformanceMetricsData }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <SectionHeader
          title="KPIs Transversais"
          sub="API, base de dados, frontend e filas"
        />
        {perf.overall && (
          <Badge intent={PERF_CLASS[perf.overall].intent} dot>
            {PERF_CLASS[perf.overall].label}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {perf.kpis.map((k) => (
          <Card
            key={k.key}
            className="transition-all duration-200 ease-out hover:scale-[1.06] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] motion-reduce:hover:scale-100"
          >
            <CardBody>
              <div className="flex items-center justify-between gap-2">
                <span className="font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {k.label}
                </span>
                {k.classification && (
                  <Badge intent={PERF_CLASS[k.classification].intent} dot>
                    {PERF_CLASS[k.classification].label}
                  </Badge>
                )}
              </div>
              <p className="mt-2 font-display text-xl font-bold tabular-nums text-ink">
                {k.value === null ? '—' : k.value.toLocaleString()}
                {k.value !== null && (
                  <span className="ml-1 text-sm font-normal text-ink-muted">
                    {k.unit}
                  </span>
                )}
              </p>
              {k.note && (
                <p className="mt-1 font-body text-[11px] text-ink-faint">
                  {k.note}
                </p>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
      {perf.slowEndpoints.length > 0 && (
        <Card>
          <CardBody>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Endpoints a vigiar
            </p>
            <table className="w-full font-body text-sm">
              <tbody>
                {perf.slowEndpoints.map((e) => (
                  <tr key={e.endpoint} className="border-t border-border">
                    <td className="py-1.5 text-ink">{e.endpoint}</td>
                    <td className="py-1.5 text-right text-ink-muted">
                      p95 {e.p95Ms} ms
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {e.errorRate}% erros
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

interface PerformanceTabProps {
  data: DashboardData;
  perf?: PerformanceMetricsData | null;
}

function PerformanceTab({ data, perf = null }: PerformanceTabProps) {
  const p = data.performanceSummary;
  const [configuring, setConfiguring] = useState(false);
  const metrics = [
    {
      label: 'CPU',
      value: p.cpuUsagePercent,
      max: 100,
      unit: '%',
      warn: 70,
      danger: 85,
    },
    {
      label: 'Memória',
      value: p.memoryUsagePercent,
      max: 100,
      unit: '%',
      warn: 75,
      danger: 90,
    },
    {
      label: 'Req/min',
      value: p.requestsPerMinute,
      max: 10000,
      unit: '',
      warn: 7000,
      danger: 9000,
    },
    {
      label: 'Latência (ms)',
      value: p.avgLatencyMs,
      max: 3000,
      unit: 'ms',
      warn: 1500,
      danger: 2500,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        banner
        title="Performance em Tempo Real"
        sub="Últimos dados capturados pelo sistema de monitorização"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {metrics.map((m) => {
          const pct = (m.value / m.max) * 100;
          const isDanger = m.value >= m.danger;
          const isWarn = !isDanger && m.value >= m.warn;
          const state: StateIntent | undefined = isDanger
            ? 'danger'
            : isWarn
              ? 'warning'
              : undefined;
          return (
            <Card key={m.label} className="overflow-hidden">
              <CardTitleBar>{m.label}</CardTitleBar>
              <CardBody>
                <div className="mb-3 flex items-center justify-end">
                  <span
                    className={cn(
                      'font-display text-xl font-bold tabular-nums',
                      state ? INTENT_TEXT[state] : 'text-ink',
                    )}
                  >
                    {m.value}
                    {m.unit}
                  </span>
                </div>
                <ThresholdBar pct={pct} state={state} />
                <div className="mt-2 flex justify-between font-body text-[11px] text-ink-faint">
                  <span>0</span>
                  <span>{pct.toFixed(1)}% da capacidade</span>
                  <span>
                    Aviso {m.warn}
                    {m.unit} · Limite {m.danger}
                    {m.unit}
                  </span>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {perf && <PerformanceKpis perf={perf} />}

      {/* Load test CTA */}
      <div className="flex items-center justify-between rounded-card border border-dashed border-border-strong bg-surface-sunken p-5">
        <div>
          <p className="font-body text-sm font-semibold text-ink">
            Teste de Carga (Stress Test)
          </p>
          <p className="mt-0.5 font-body text-xs text-ink-muted">
            Simular picos de utilizadores simultâneos para validar a
            escalabilidade
          </p>
        </div>
        <Button
          intent="secondary"
          size="sm"
          onClick={() => setConfiguring(true)}
        >
          Configurar Teste
        </Button>
      </div>

      {configuring && <LoadTestModal onClose={() => setConfiguring(false)} />}
    </div>
  );
}

interface IntegrationsTabProps {
  tenantId: string;
  integrations: Integration[];
  metrics?: IntegrationMetricsData | null;
  onSync: (id: number) => void;
}

const INTEGRATION_ROW_STATE: Record<
  IntegrationMetricsData['integrations'][number]['state'],
  { label: string; intent: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
  INACTIVA: { label: 'Inactiva', intent: 'neutral' },
};

function IntegrationMetrics({ m }: { m: IntegrationMetricsData }) {
  const t = m.totals;
  const fmt = (n: number) => n.toLocaleString();
  const lat = (ms: number | null) =>
    ms === null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Indicadores"
        sub={`Sincronizações das últimas ${m.windowHours}h`}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={Plug}
          tone="green"
          label="Integrações activas"
          value={`${t.active}/${t.total}`}
        />
        <NavyStatCard
          icon={Activity}
          tone="blue"
          label="Requests"
          value={fmt(t.requests)}
          sub="execuções de sync"
        />
        <NavyStatCard
          icon={RefreshCw}
          tone="blue"
          label="Sincronizações"
          value={fmt(t.syncs)}
        />
        <NavyStatCard
          icon={TriangleAlert}
          tone="red"
          label="Falhas"
          value={fmt(t.failures)}
          sub={`${t.errorRate}% de erro`}
        />
        <NavyStatCard
          icon={Gauge}
          tone="orange"
          label="Latência média"
          value={lat(t.avgLatencyMs)}
        />
        <NavyStatCard
          icon={RotateCcw}
          tone="orange"
          label="Novas tentativas"
          value={fmt(t.retries)}
        />
        <NavyStatCard
          icon={ListChecks}
          tone="blue"
          label="Tarefas pendentes"
          value={fmt(t.pendingJobs)}
        />
        <NavyStatCard
          icon={Database}
          tone="green"
          label="Volume transferido"
          value={fmt(t.recordsTransferred)}
          sub="registos, sem contagem de bytes"
        />
      </div>
      <Card className="overflow-hidden">
        <h3 className="flex items-center bg-[#0F1F3D]/60 px-5 py-3 font-body text-sm font-semibold text-white">
          Por integração
        </h3>
        <CardBody>
          {m.integrations.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem integrações configuradas.
            </p>
          ) : (
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Integração</th>
                  <th className="py-1.5 text-right font-semibold">Requests</th>
                  <th className="py-1.5 text-right font-semibold">Erros</th>
                  <th className="py-1.5 text-right font-semibold">Latência</th>
                  <th className="py-1.5 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {m.integrations.map((r) => {
                  const s = INTEGRATION_ROW_STATE[r.state];
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-1.5 text-ink">{r.name}</td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {fmt(r.requests)}
                      </td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {r.errorRate}%
                      </td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {lat(r.latencyMs)}
                      </td>
                      <td className="py-1.5 text-right">
                        <Badge intent={s.intent} dot={s.intent !== 'neutral'}>
                          {s.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function IntegrationsTab({
  tenantId,
  integrations,
  metrics = null,
  onSync,
}: IntegrationsTabProps) {
  const notify = useToast();
  const [creating, setCreating] = useState(false);
  const typeLabels: Record<string, string> = {
    ERP_HR: 'ERP de RH',
    PAYROLL: 'Folha de Pagamento',
    ATS: 'ATS',
    MICROSOFT_TEAMS: 'Microsoft Teams',
    SLACK: 'Slack',
    SSO_GOOGLE: 'SSO Google',
    SSO_MICROSOFT: 'SSO Microsoft',
    SCORM_PROVIDER: 'SCORM',
    XAPI_LRS: 'xAPI / LRS',
    BI_TOOL: 'Ferramenta BI',
    CUSTOM_WEBHOOK: 'Webhook Custom',
    REST_API: 'API REST',
    SOAP_API: 'API SOAP',
    WEBHOOK: 'Webhook',
    SFTP: 'SFTP',
    OAUTH2: 'OAuth 2.0',
    LDAP: 'LDAP',
    SAML2: 'SAML 2.0',
    OPENID_CONNECT: 'OpenID Connect',
    DATABASE: 'Base de Dados',
    CSV_FILE: 'Ficheiro CSV',
    EXCEL_FILE: 'Ficheiro Excel',
    OTHER: 'Outro',
  };
  const freqLabel: Record<string, string> = {
    REALTIME: 'Tempo Real',
    HOURLY: 'A cada hora',
    DAILY: 'Diário',
    WEEKLY: 'Semanal',
    MANUAL: 'Manual',
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Integrações Configuradas"
          sub="ERP, SSO, LMS padrões e comunicação"
        />
        <Button intent="secondary" size="sm" onClick={() => setCreating(true)}>
          Nova Integração
        </Button>
      </div>
      {creating && (
        <NewIntegrationModal
          tenantId={tenantId}
          onClose={() => setCreating(false)}
        />
      )}
      {metrics && <IntegrationMetrics m={metrics} />}
      <div className="flex flex-col gap-3">
        {integrations.map((int) => {
          const s = INTEGRATION_STATUS[int.status];
          return (
            <Card key={int.id}>
              <CardBody className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-semibold text-ink">
                    {int.name}
                  </p>
                  <p className="font-body text-xs text-ink-muted">
                    {typeLabels[int.type] ?? int.type} ·{' '}
                    {freqLabel[int.syncFrequency] ?? int.syncFrequency}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <Badge intent={s.intent} dot={s.intent !== 'neutral'}>
                    {s.label}
                  </Badge>
                  {int.lastSyncAt && (
                    <p className="mt-1 font-body text-[11px] text-ink-faint">
                      Sync: {timeAgo(int.lastSyncAt)} · {int.lastSyncStatus}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={() => onSync(int.id)}
                  >
                    Sync
                  </Button>
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() =>
                      notify({
                        title: `Configurar ${int.name}`,
                        intent: 'info',
                      })
                    }
                  >
                    Config
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
        {integrations.length === 0 && (
          <EmptyState
            title="Sem integrações configuradas"
            description="Adiciona uma integração (ERP, SSO, LMS…) para começar a sincronizar dados."
          />
        )}
      </div>
    </div>
  );
}

interface AutomationsTabProps {
  rules: AutomationRule[];
  onExecute: (id: number) => void;
}

function AutomationsTab({ rules, onExecute }: AutomationsTabProps) {
  const [creatingRule, setCreatingRule] = useState(false);
  const triggerLabel: Record<string, string> = {
    USER_HIRED: 'Contratação',
    USER_PROMOTED: 'Promoção',
    USER_TRANSFERRED: 'Transferência',
    USER_OFFBOARDED: 'Saída',
    COURSE_COMPLETED: 'Conclusão Curso',
    CERTIFICATE_EXPIRED: 'Certificado Expirado',
    TRAIL_COMPLETED: 'Trilha Concluída',
    SCHEDULED_CRON: 'Agendado',
    WEBHOOK_EVENT: 'Webhook',
    MANUAL: 'Manual',
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader title="Regras de Automação" />
        <Button
          intent="secondary"
          size="sm"
          onClick={() => setCreatingRule(true)}
        >
          Nova Regra
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {rules.map((rule) => {
          const status = !rule.isActive
            ? { label: 'Inactiva', cls: 'text-ink-faint' }
            : rule.lastRunStatus === 'FAILED'
              ? { label: 'Última falhou', cls: 'text-danger' }
              : { label: 'OK', cls: 'text-success' };
          return (
            <Card
              key={rule.id}
              className="overflow-hidden rounded-[24px] border-[#E3EAF4] bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]"
            >
              <CardBody className="flex flex-wrap items-center gap-4 px-6 py-5">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'font-body text-[15px] font-semibold',
                      rule.isActive ? 'text-[#0F1F3D]' : 'text-[#49658A]',
                    )}
                  >
                    {rule.name}
                  </p>
                  <p className="font-body text-xs text-[#49658A]">
                    Gatilho:{' '}
                    {triggerLabel[rule.triggerType] ?? rule.triggerType}
                    {' · '}
                    {rule.runCount.toLocaleString()} execuções
                    {rule.lastRunAt && ` · ${timeAgo(rule.lastRunAt)}`}
                  </p>
                </div>
                <span
                  className={cn('font-body text-xs font-semibold', status.cls)}
                >
                  {status.label}
                </span>
                <Button
                  intent="secondary"
                  size="sm"
                  disabled={!rule.isActive}
                  onClick={() => onExecute(rule.id)}
                >
                  Executar
                </Button>
              </CardBody>
            </Card>
          );
        })}
        {rules.length === 0 && (
          <EmptyState
            title="Sem regras de automação"
            description="Cria uma regra para automatizar acções em resposta a eventos da plataforma."
          />
        )}
      </div>

      {creatingRule && (
        <CreateRuleModal
          onClose={() => setCreatingRule(false)}
          extraInvalidateKeys={[
            queryKeys.scalability.automations(),
            queryKeys.scalability.dashboard(),
          ]}
        />
      )}
    </div>
  );
}

interface AlertsTabProps {
  alerts: Alert[];
  onResolve: (id: string) => void;
}

type AlertFilter = 'ALL' | 'CRITICAL' | 'WARNING';

const ALERT_FILTERS: Array<{
  key: AlertFilter;
  label: string;
  icon: typeof Bell;
}> = [
  { key: 'ALL', label: 'Todos', icon: ListChecks },
  { key: 'CRITICAL', label: 'Críticos', icon: TriangleAlert },
  { key: 'WARNING', label: 'Avisos', icon: Bell },
];

function AlertsTab({ alerts, onResolve }: AlertsTabProps) {
  const [filter, setFilter] = useState<AlertFilter>('ALL');
  const shown =
    filter === 'ALL' ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Alertas de Sistema"
          sub="Monitorização automática de performance, integrações e compliance"
        />
        {/* Separadores no desenho do separador Talento (dashboard-rh):
            moldura com borda, activo em navy #0F1F3D. */}
        <div className="flex flex-col gap-1 rounded-panel border border-border bg-surface p-1.5 shadow-sm">
          {ALERT_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                'flex items-center justify-center gap-2 rounded-control px-3 py-1 font-body text-xs font-medium transition-colors',
                filter === f.key
                  ? 'bg-[#0F1F3D] text-canvas shadow-sm'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              <f.icon size={13} strokeWidth={1.75} />
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 && (
        <Card>
          <CardBody>
            <p className="font-body text-sm text-ink-muted">
              Sem alertas nesta categoria.
            </p>
          </CardBody>
        </Card>
      )}
      <div className="flex flex-col gap-3">
        {shown.map((alert) => {
          const sev = SEVERITY[alert.severity];
          return (
            <Card key={alert.id} className={cn('border-l-2', sev.border)}>
              <CardBody className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Badge intent={sev.intent} dot={false}>
                      {sev.label}
                    </Badge>
                    <span className="font-body text-[11px] uppercase tracking-wide text-ink-faint">
                      {alert.category}
                    </span>
                    <span className="font-body text-[11px] text-ink-faint">
                      · {timeAgo(alert.createdAt)}
                    </span>
                  </div>
                  <p className="font-body text-sm font-semibold text-ink">
                    {alert.title}
                  </p>
                  <p className="mt-1 font-body text-sm leading-relaxed text-ink-muted">
                    {alert.message}
                  </p>
                </div>
                <Button
                  intent="ghost"
                  size="sm"
                  onClick={() => onResolve(alert.id)}
                >
                  Resolver
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface SlaTabProps {
  data: DashboardData;
  slaConfigs: SlaConfig[];
}

function SlaTab({ data, slaConfigs }: SlaTabProps) {
  const { slaCompliance: s, tenantInfo: t } = data;
  const [configuring, setConfiguring] = useState(false);
  const complianceScore = Math.min(
    100,
    (s.currentUptimePercent / s.slaTarget) * 100,
  );
  const slaGid = useId();
  const statusColor = s.isBreached ? '#F87171' : '#34D399';
  const slaRing = (() => {
    const size = 120;
    const stroke = 16;
    const r = (size - stroke) / 2;
    return { size, stroke, r, circ: 2 * Math.PI * r };
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="SLA & Compliance"
          sub="Monitorização de acordos de nível de serviço e conformidade regulatória"
        />
        <Button
          intent="secondary"
          size="sm"
          onClick={() => setConfiguring(true)}
        >
          Nova Configuração de SLA
        </Button>
      </div>

      {configuring && (
        <SlaConfigModal tenantId={t.id} onClose={() => setConfiguring(false)} />
      )}

      {/* Conformidade SLA — desenho do card "ROI Total" */}
      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="mb-2 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.8} aria-hidden />
          <h3 className="font-display text-base font-bold uppercase tracking-wide">
            Conformidade SLA
          </h3>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
          <div
            className="relative shrink-0"
            style={{ width: slaRing.size, height: slaRing.size }}
          >
            <svg
              width={slaRing.size}
              height={slaRing.size}
              viewBox={`0 0 ${slaRing.size} ${slaRing.size}`}
              role="img"
              aria-label={`Conformidade SLA: ${complianceScore.toFixed(0)}%`}
              className="-rotate-90"
            >
              <defs>
                <linearGradient id={slaGid} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7CC4FF" />
                  <stop offset="100%" stopColor="#2F80ED" />
                </linearGradient>
              </defs>
              <circle
                cx={slaRing.size / 2}
                cy={slaRing.size / 2}
                r={slaRing.r}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={slaRing.stroke}
              />
              <circle
                cx={slaRing.size / 2}
                cy={slaRing.size / 2}
                r={slaRing.r}
                fill="none"
                stroke={`url(#${slaGid})`}
                strokeWidth={slaRing.stroke}
                strokeLinecap="round"
                strokeDasharray={`${(complianceScore / 100) * slaRing.circ} ${slaRing.circ}`}
                opacity={s.isBreached ? 0.55 : 1}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold">
              {complianceScore.toFixed(0)}%
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-2 font-display text-xl font-bold leading-snug">
              Cumprimento do acordo de nível de serviço
            </p>
            <div className="flex flex-wrap items-stretch gap-x-8 gap-y-2">
              <div>
                <p className="font-body text-sm text-white/70">Estado</p>
                <p
                  className="mt-1 flex items-center gap-2 font-display text-xl font-semibold"
                  style={{ color: statusColor }}
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: statusColor }}
                  />
                  {s.isBreached ? 'SLA Violado' : 'SLA Cumprido'}
                </p>
              </div>
              <div className="hidden w-px bg-white/20 sm:block" />
              <div>
                <p className="font-body text-sm text-white/70">Uptime actual</p>
                <p className="font-display text-2xl font-bold">
                  {formatPercent(s.currentUptimePercent, 3)}
                </p>
              </div>
              <div className="hidden w-px bg-white/20 sm:block" />
              <div>
                <p className="font-body text-sm text-white/70">Meta</p>
                <p className="font-display text-xl font-bold">
                  {formatPercent(s.slaTarget, 1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
          <Info className="h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
          <span>
            {s.isBreached
              ? `O uptime actual está abaixo da meta contratada de ${formatPercent(s.slaTarget, 1)}.`
              : `O uptime actual cumpre a meta contratada de ${formatPercent(s.slaTarget, 1)}.`}
          </span>
        </div>
      </div>

      {/* SLA configurados — dados reais de SlaConfig, não uma checklist de
          certificações fabricada (não existe nenhum modelo de compliance
          LGPD/GDPR/ISO27001 no schema; mostrar isso como "Conforme" seria
          inventar um estado legal que ninguém verificou). */}
      <SectionHeader
        title="Configurações de SLA"
        sub="Contratos activos para este tenant"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {slaConfigs.map((sla) => (
          <Card key={sla.id}>
            <CardBody>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-body text-sm font-semibold text-ink">
                  {sla.name}
                </p>
                <Badge
                  intent={sla.isActive ? 'success' : 'neutral'}
                  dot={false}
                >
                  {sla.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-body text-xs text-ink-muted">
                <span>Uptime mínimo</span>
                <span className="text-right text-ink">
                  {formatPercent(sla.uptimePercent, 2)}
                </span>
                <span>Latência máx.</span>
                <span className="text-right text-ink">
                  {sla.maxLatencyMs}ms
                </span>
                <span>Taxa de erro máx.</span>
                <span className="text-right text-ink">
                  {formatPercent(sla.maxErrorRate * 100, 2)}
                </span>
                <span>Resposta a incidentes</span>
                <span className="text-right text-ink">
                  {sla.incidentResponse}min
                </span>
                {sla.rpoMinutes != null && (
                  <>
                    <span>RPO</span>
                    <span className="text-right text-ink">
                      {sla.rpoMinutes}min
                    </span>
                  </>
                )}
                {sla.rtoMinutes != null && (
                  <>
                    <span>RTO</span>
                    <span className="text-right text-ink">
                      {sla.rtoMinutes}min
                    </span>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
        {slaConfigs.length === 0 && (
          <EmptyState
            className="md:col-span-2"
            title="Sem SLA configurado"
            description="Cria uma configuração de SLA para definir metas de uptime, latência e resposta a incidentes."
          />
        )}
      </div>
    </div>
  );
}

interface UsersTabProps {
  data: DashboardData;
  load: UsersLoadData | null;
}

const SEGMENT_TABS: Array<{
  key: keyof Omit<UsersLoadData['segmentation'], 'platform'>;
  label: string;
}> = [
  { key: 'unit', label: 'Unidade' },
  { key: 'department', label: 'Departamento' },
  { key: 'position', label: 'Cargo' },
  { key: 'role', label: 'Perfil' },
  { key: 'location', label: 'Localização' },
  { key: 'userType', label: 'Tipo de utilizador' },
];

function SegmentTable({ rows }: { rows: UsersLoadSegmentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="font-body text-xs text-ink-faint">
        Sem dados para esta segmentação.
      </p>
    );
  }
  return (
    <table className="w-full font-body text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
          <th className="py-1.5 font-semibold">Segmento</th>
          <th className="py-1.5 text-right font-semibold">Utilizadores</th>
          <th className="py-1.5 text-right font-semibold">Activos (30d)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name} className="border-t border-border">
            <td className="py-1.5 text-ink">{r.name}</td>
            <td className="py-1.5 text-right text-ink">
              {r.users.toLocaleString()}
            </td>
            <td className="py-1.5 text-right text-ink-muted">
              {r.activeMonthly.toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsersTab({ data, load }: UsersTabProps) {
  const { tenantInfo: t } = data;
  const [importing, setImporting] = useState(false);
  const [segment, setSegment] =
    useState<(typeof SEGMENT_TABS)[number]['key']>('department');
  const fmt = (n: number) => n.toLocaleString();
  const growthSub = (g: { newUsers: number; percent: number }) =>
    `${g.newUsers.toLocaleString()} novos (${g.percent}% da base)`;
  const hhmm = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Utilizadores & Carga"
          sub="Impacto do crescimento de utilizadores, segmentação e gestão de licenças"
        />
        <Button intent="secondary" size="sm" onClick={() => setImporting(true)}>
          Importar CSV
        </Button>
      </div>

      {importing && (
        <ImportUsersModal tenantId={t.id} onClose={() => setImporting(false)} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NavyStatCard
          icon={Users}
          tone="blue"
          label="Utilizadores Activos"
          value={t.activeUsersCount.toLocaleString()}
          sub={`de ${t.maxUsers.toLocaleString()} licenças`}
        />
        <NavyStatCard
          icon={Boxes}
          tone="green"
          label="Licenças Disponíveis"
          value={(t.maxUsers - t.activeUsersCount).toLocaleString()}
        />
        <NavyStatCard
          icon={Scaling}
          tone="orange"
          label="Plano Actual"
          value={t.plan}
        />
      </div>

      {!load ? (
        <EmptyState
          title="A carregar indicadores de carga"
          description="Os indicadores de utilizadores aparecem aqui assim que estiverem disponíveis."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NavyStatCard
              icon={Users}
              tone="blue"
              label="Total de utilizadores"
              value={fmt(load.totals.total)}
            />
            <NavyStatCard
              icon={ShieldCheck}
              tone="green"
              label="Utilizadores activos"
              value={fmt(load.totals.active)}
            />
            <NavyStatCard
              icon={Activity}
              tone="blue"
              label="Activos diariamente"
              value={fmt(load.totals.activeDaily)}
              sub="com sessão nas últimas 24h"
            />
            <NavyStatCard
              icon={Activity}
              tone="green"
              label="Activos mensalmente"
              value={fmt(load.totals.activeMonthly)}
              sub="com sessão nos últimos 30 dias"
            />
            <NavyStatCard
              icon={Globe}
              tone="orange"
              label="Simultâneos agora"
              value={fmt(load.concurrent.current)}
            />
            <NavyStatCard
              icon={LineChart}
              tone="red"
              label="Pico de simultâneos"
              value={fmt(load.concurrent.peak24h)}
              sub={`histórico: ${fmt(load.concurrent.historicPeak)}`}
            />
            <NavyStatCard
              icon={Workflow}
              tone="blue"
              label="Média de sessões"
              value={load.sessions.avgPerUser30d.toLocaleString()}
              sub="logins por utilizador activo / 30d"
            />
            <NavyStatCard
              icon={Gauge}
              tone="orange"
              label="Duração média da sessão"
              value={
                load.sessions.avgDurationMinutes === null
                  ? '—'
                  : `${load.sessions.avgDurationMinutes} min`
              }
              sub={
                load.sessions.avgDurationMinutes === null
                  ? 'o fim das sessões não é registado'
                  : undefined
              }
            />
            <NavyStatCard
              icon={Server}
              tone="green"
              label="Requests por utilizador"
              value={
                load.sessions.requestsPerUserPerMin === null
                  ? '—'
                  : `${load.sessions.requestsPerUserPerMin}/min`
              }
              sub={
                load.sessions.requestsPerUserPerMin === null
                  ? 'aguarda o módulo Monitoring'
                  : undefined
              }
            />
            <GrowthCard
              icon={TrendingUp}
              tone="blue"
              label="Crescimento Diário"
              value={`+${load.growth.daily.percent}%`}
              chip={`+${load.growth.daily.newUsers.toLocaleString()} novos`}
              caption="da base de utilizadores, hoje"
            />
            <GrowthCard
              icon={CalendarDays}
              tone="green"
              label="Crescimento Mensal"
              value={`+${load.growth.monthly.percent}%`}
              chip={`+${load.growth.monthly.newUsers.toLocaleString()} novos`}
              caption="da base de utilizadores, este mês"
            />
            <GrowthCard
              icon={BarChart3}
              tone="purple"
              label="Crescimento Anual"
              value={`+${load.growth.yearly.percent}%`}
              chip={`+${load.growth.yearly.newUsers.toLocaleString()} novos`}
              caption="da base de utilizadores, este ano"
            />
          </div>

          <Card>
            <CardBody>
              <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Concurrent Users (24h)
              </p>
              <p className="mb-3 font-body text-xs text-ink-faint">
                Média {load.concurrent.avg24h} · Máximo {load.concurrent.max24h}{' '}
                · Mínimo {load.concurrent.min24h} · Pico histórico{' '}
                {load.concurrent.historicPeak}
              </p>
              {load.concurrent.timeline.length === 0 ? (
                <EmptyState
                  title="Sem métricas nas últimas 24 horas"
                  description="O histórico é preenchido automaticamente a cada minuto."
                />
              ) : (
                <AreaLineChart
                  series={[
                    {
                      label: 'Simultâneos (pico por hora)',
                      points: load.concurrent.timeline.map((m, i) => ({
                        x: i,
                        y: m.peak,
                        xLabel: hhmm(m.at),
                      })),
                    },
                    {
                      label: 'Média 24h',
                      points: load.concurrent.timeline.map((m, i) => ({
                        x: i,
                        y: load.concurrent.avg24h,
                        xLabel: hhmm(m.at),
                      })),
                    },
                  ]}
                />
              )}
            </CardBody>
          </Card>

          <Card className="overflow-hidden">
            <CardTitleBar>Segmentação</CardTitleBar>
            <CardBody>
              <div className="mb-4 flex flex-wrap gap-2">
                {SEGMENT_TABS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSegment(s.key)}
                    className={`rounded-pill px-3 py-1 font-body text-xs font-medium ${
                      segment === s.key
                        ? 'bg-ink text-surface'
                        : 'bg-surface-sunken text-ink-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <span
                  className="rounded-pill bg-surface-sunken px-3 py-1 font-body text-xs font-medium text-ink-faint"
                  title="Não há registo de dispositivo (web/mobile) nas sessões."
                >
                  Web/mobile: sem dados
                </span>
              </div>
              <SegmentTable rows={load.segmentation[segment]} />
            </CardBody>
          </Card>
        </>
      )}

      {/* Role grid */}
      <Card className="overflow-hidden">
        <CardTitleBar>Perfis de Acesso (RBAC)</CardTitleBar>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { role: 'Admin', color: '#EF4657', desc: 'Acesso total à plataforma' },
              { role: 'RH', color: '#1877F2', desc: 'Gestão de utilizadores e relatórios' },
              { role: 'Gestor', color: '#E99A16', desc: 'Equipa e relatórios de departamento' },
              { role: 'Instrutor', color: '#7C3AED', desc: 'Criação e gestão de conteúdo' },
              { role: 'Colaborador', color: '#218653', desc: 'Acesso a cursos e trilhas' },
              { role: 'Auditor', color: '#0F766E', desc: 'Leitura de logs e compliance' },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-card border border-border border-l-4 bg-surface p-3"
                style={{ borderLeftColor: r.color }}
              >
                <p className="font-body text-sm font-semibold text-ink">
                  {r.role}
                </p>
                <p className="mt-0.5 font-body text-xs text-ink-faint">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

interface ContentTabProps {
  tenantId: string;
  config: ContentDeliveryConfig | null;
  frontend?: FrontendMetricsData | null;
}

// ─── FRONTEND & CDN (modulo_scalability.md §10) ───────────────

const PAGE_STATE: Record<
  PageStatus,
  { label: string; intent: 'success' | 'warning' | 'danger' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

interface PageRow {
  key: string;
  label: string;
  stats: FrontendMetricsData['pages'][number] | null;
}

function PageTable({ rows }: { rows: PageRow[] }) {
  const ms = (v: number | null | undefined) =>
    v === null || v === undefined ? '—' : `${Math.round(v)} ms`;
  return (
    <div className="overflow-x-auto">
      <table className="w-full font-body text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="py-1.5 font-semibold">Página</th>
            <th className="py-1.5 text-right font-semibold">Visitas</th>
            <th className="py-1.5 text-right font-semibold">Carregamento</th>
            <th className="py-1.5 text-right font-semibold">LCP</th>
            <th className="py-1.5 text-right font-semibold">TTFB</th>
            <th className="py-1.5 text-right font-semibold">Erros</th>
            <th className="py-1.5 pl-4 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label, stats }) => (
            <tr key={key} className="border-t border-border">
              <td className="py-1.5 font-mono text-xs text-ink">{label}</td>
              <td className="py-1.5 text-right text-ink">{stats?.views ?? 0}</td>
              <td className="py-1.5 text-right text-ink">{ms(stats?.loadMs)}</td>
              <td className="py-1.5 text-right text-ink">{ms(stats?.lcpMs)}</td>
              <td className="py-1.5 text-right text-ink-muted">{ms(stats?.ttfbMs)}</td>
              <td className="py-1.5 text-right text-ink-muted">{stats?.errors ?? 0}</td>
              <td className="py-1.5 pl-4">
                {stats && stats.views > 0 ? (
                  <Badge intent={PAGE_STATE[stats.status].intent} dot={false}>
                    {PAGE_STATE[stats.status].label}
                  </Badge>
                ) : (
                  <Badge intent="neutral" dot={false}>
                    Sem dados
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FrontendPerfSection({ data }: { data: FrontendMetricsData | null }) {
  if (!data) {
    return (
      <EmptyState
        title="A carregar métricas de frontend"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const ms = (v: number | null) => (v === null ? '—' : `${Math.round(v)} ms`);
  const kb = (v: number | null) =>
    v === null ? '—' : `${v.toLocaleString()} KB`;
  const noData = data.samples === 0;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Performance do Frontend"
        sub={`Medições reais dos browsers dos utilizadores — ${data.percentile.toUpperCase()} das últimas ${data.windowHours} h (${data.samples.toLocaleString()} visualizações)`}
      />
      {noData ? (
        <EmptyState
          title="Ainda sem amostras de frontend"
          description="As métricas aparecem depois de os utilizadores navegarem na plataforma."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricTile label="Page Load" value={ms(data.vitals.pageLoadMs)} />
          <MetricTile
            label="First Contentful Paint"
            value={ms(data.vitals.fcpMs)}
            sub="bom ≤ 1800 ms"
          />
          <MetricTile
            label="Largest Contentful Paint"
            value={ms(data.vitals.lcpMs)}
            sub="bom ≤ 2500 ms"
          />
          <MetricTile
            label="Interaction to Next Paint"
            value={ms(data.vitals.inpMs)}
            sub="bom ≤ 200 ms"
          />
          <MetricTile
            label="Time to First Byte"
            value={ms(data.vitals.ttfbMs)}
            sub="bom ≤ 800 ms"
          />
          <MetricTile
            label="JavaScript (bundle)"
            value={kb(data.resources.jsKb)}
            sub="média por página"
          />
          <MetricTile
            label="CSS"
            value={kb(data.resources.cssKb)}
            sub="média por página"
          />
          <MetricTile
            label="Imagens"
            value={kb(data.resources.imagesKb)}
            sub="média por página"
          />
          <MetricTile
            label="Cache hit ratio"
            value={
              data.resources.cacheHitRatio === null
                ? '—'
                : `${data.resources.cacheHitRatio}%`
            }
            sub="recursos servidos da cache do browser"
          />
          <MetricTile
            label="Requests"
            value={
              data.resources.requestsPerPage === null
                ? '—'
                : `${data.resources.requestsPerPage}`
            }
            sub="por página"
          />
          <MetricTile
            label="Erros frontend"
            value={data.errors.total.toLocaleString()}
            sub={`${data.errors.errorRate}% das páginas com erros`}
          />
        </div>
      )}

      <Card className="overflow-hidden">
        <CardTitleBar>Páginas críticas</CardTitleBar>
        <CardBody>
          <PageTable
            rows={data.criticalPages.map((p) => ({
              key: p.path,
              label: p.page,
              stats: p.hasData ? p : null,
            }))}
          />
        </CardBody>
      </Card>

      {!noData && (
        <Card className="overflow-hidden">
          <CardTitleBar>Tempo de carregamento por página</CardTitleBar>
          <CardBody>
            {data.slowPages.length > 0 && (
              <p className="mb-3 font-body text-xs text-ink-muted">
                {data.slowPages.length} página(s) lentas detectadas (≥ 3
                visitas) — candidatas a degradar com grandes volumes de dados.
              </p>
            )}
            <PageTable
              rows={data.pages.map((p) => ({
                key: p.path,
                label: p.path,
                stats: p,
              }))}
            />
            <p className="mt-3 font-body text-xs text-ink-faint">
              Estado: Crítico com LCP &gt; 4 s ou carregamento &gt; 6 s; Atenção
              com LCP &gt; 2,5 s ou carregamento &gt; 3,5 s.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function ContentTab({ tenantId, config, frontend = null }: ContentTabProps) {
  const [configuring, setConfiguring] = useState(false);

  if (!config) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Conteúdo & CDN"
              sub="Distribuição de vídeos, SCORM e PDFs com bitrate adaptativo"
            />
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setConfiguring(true)}
            >
              Configurar CDN
            </Button>
          </div>
          {configuring && (
            <ContentDeliveryConfigModal
              tenantId={tenantId}
              config={null}
              onClose={() => setConfiguring(false)}
            />
          )}
          <EmptyState
            title="Sem configuração de entrega de conteúdo"
            description="Este tenant ainda não tem CDN/bitrate adaptativo configurado."
            action={{
              label: 'Configurar CDN',
              onClick: () => setConfiguring(true),
            }}
          />
        </div>
        <FrontendPerfSection data={frontend} />
      </div>
    );
  }

  const rows: { title: string; value: string; active: boolean }[] = [
    {
      title: 'CDN',
      value: config.cdnProvider ?? 'Não configurado',
      active: !!config.cdnProvider,
    },
    {
      title: 'Bitrate Adaptativo',
      value: config.adaptiveBitrate ? 'Activado' : 'Desactivado',
      active: config.adaptiveBitrate,
    },
    {
      title: 'Sincronização Offline',
      value: config.offlineSyncEnabled
        ? `Activada — ${config.maxOfflineDays} dias de cache`
        : 'Desactivada',
      active: config.offlineSyncEnabled,
    },
    {
      title: 'Compressão',
      value: config.compressionEnabled ? 'Activada' : 'Desactivada',
      active: config.compressionEnabled,
    },
    {
      title: 'Formatos Suportados',
      value: config.allowedFormats.join(', ').toUpperCase() || '—',
      active: config.allowedFormats.length > 0,
    },
    {
      title: 'Tamanho Máx. Vídeo',
      value: `${config.maxVideoSizeMb} MB por ficheiro`,
      active: true,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <FrontendPerfSection data={frontend} />
      <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Conteúdo & CDN"
          sub="Distribuição de vídeos, SCORM e PDFs com bitrate adaptativo"
        />
        <Button
          intent="secondary"
          size="sm"
          onClick={() => setConfiguring(true)}
        >
          Editar Configuração
        </Button>
      </div>
      {configuring && (
        <ContentDeliveryConfigModal
          tenantId={tenantId}
          config={config}
          onClose={() => setConfiguring(false)}
        />
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((item) => (
          <Card key={item.title}>
            <CardBody className="flex items-center justify-between gap-3">
              <div>
                <p className="font-body text-xs text-ink-muted">{item.title}</p>
                <p className="mt-0.5 font-body text-sm font-semibold text-ink">
                  {item.value}
                </p>
              </div>
              <Badge
                intent={item.active ? 'success' : 'neutral'}
                dot={false}
                className="shrink-0"
              >
                {item.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </CardBody>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─── API & BACKEND (modulo_scalability.md §7) ──────────────────

const ENDPOINT_STATE: Record<
  ApiMetricsData['endpoints'][number]['status'],
  { label: string; intent: 'success' | 'warning' | 'danger' }
> = {
  OK: { label: 'OK', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
};

function ApiTab({ api }: { api: ApiMetricsData | null }) {
  if (!api) {
    return (
      <EmptyState
        title="A carregar métricas da API"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  const rate = (v: number | null, unit: string) =>
    v === null ? '—' : `${v.toLocaleString()}${unit}`;
  const warming = api.rates.requestsPerSecond === null;
  const uptimeMin = Math.round(api.sinceProcessStartSeconds / 60);
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="API & Backend"
        sub={`Capacidade da API NestJS — acumulado desde o arranque do servidor (${uptimeMin} min)`}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Requests por segundo"
          value={rate(api.rates.requestsPerSecond, '/s')}
          sub={warming ? 'a recolher amostras' : `janela de ${api.rates.windowSeconds / 60} min`}
        />
        <MetricTile
          label="Requests por minuto"
          value={rate(api.rates.requestsPerMinute, '/min')}
        />
        <MetricTile label="Total de requests" value={fmt(api.totals.requests)} />
        <MetricTile
          label="Throughput"
          value={rate(api.rates.throughputRps, ' req/s')}
          sub="sem contagem de bytes servidos"
        />
        <MetricTile label="Latência média" value={`${api.totals.avgLatencyMs} ms`} />
        <MetricTile label="P50" value={`${api.totals.p50Ms} ms`} />
        <MetricTile label="P95" value={`${api.totals.p95Ms} ms`} />
        <MetricTile label="P99" value={`${api.totals.p99Ms} ms`} />
        <ThermometerStatCard
          label="Taxa de erro"
          // escala 0–5% do erro mapeada para 0–100 do termómetro
          value={(api.totals.errorRate / 5) * 100}
          bands={INVERSE_RATE_BANDS}
          display={`${api.totals.errorRate}%`}
          caption="4xx + 5xx sobre o total"
        />
        <MetricTile label="HTTP 4xx" value={fmt(api.totals.http4xx)} />
        <MetricTile
          label="HTTP 5xx"
          value={fmt(api.totals.http5xx)}
          sub={
            api.rates.errors5xxPerMinute === null
              ? undefined
              : `${api.rates.errors5xxPerMinute}/min`
          }
        />
        <MetricTile
          label="Timeouts"
          value={fmt(api.totals.timeouts)}
          sub="respostas 408/504"
        />
        <MetricTile
          label="Requests concorrentes"
          value={api.concurrentRequests === null ? '—' : fmt(api.concurrentRequests)}
          sub={api.concurrentRequests === null ? 'pedidos em curso não são registados' : undefined}
        />
        <MetricTile
          label="Tempo de processamento"
          value={`${api.totals.avgProcessingMs} ms`}
          sub="média por pedido"
        />
        <MetricTile
          label="Requests lentos"
          value={fmt(api.totals.slowRequests)}
          sub={`acima de ${api.totals.slowThresholdMs} ms`}
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Por endpoint</CardTitleBar>
        <CardBody>
          {api.endpoints.length === 0 ? (
            <EmptyState
              title="Sem pedidos registados"
              description="Os endpoints aparecem à medida que a API recebe tráfego."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Endpoint</th>
                    <th className="py-1.5 text-right font-semibold">Requests</th>
                    <th className="py-1.5 text-right font-semibold">Média</th>
                    <th className="py-1.5 text-right font-semibold">P95</th>
                    <th className="py-1.5 text-right font-semibold">Erros</th>
                    <th className="py-1.5 text-right font-semibold">Lentos</th>
                    <th className="py-1.5 pl-4 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {api.endpoints.map((e) => {
                    const st = ENDPOINT_STATE[e.status];
                    return (
                      <tr key={e.endpoint} className="border-t border-border">
                        <td className="py-1.5 font-mono text-xs text-ink">{e.endpoint}</td>
                        <td className="py-1.5 text-right text-ink">{fmt(e.requests)}</td>
                        <td className="py-1.5 text-right text-ink-muted">{e.avgMs} ms</td>
                        <td className="py-1.5 text-right text-ink">{e.p95Ms} ms</td>
                        <td className="py-1.5 text-right text-ink-muted">{e.errorRate}%</td>
                        <td className="py-1.5 text-right text-ink-muted">{fmt(e.slowRequests)}</td>
                        <td className="py-1.5 pl-4">
                          <Badge intent={st.intent} dot={false}>
                            {st.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">
            Estado: Crítico com P95 &gt; 1,5 s ou ≥ 5% de erros 5xx; Atenção com P95 &gt; 500 ms ou ≥ 1% de erros 5xx.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── BASE DE DADOS (modulo_scalability.md §8-9) ───────────────

const GROWTH_WINDOWS: Array<{ key: '7d' | '30d' | '90d' | '1y'; label: string }> = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: '90d', label: '90 dias' },
  { key: '1y', label: '1 ano' },
];

function DatabaseTab({ db }: { db: DatabaseMetricsData | null }) {
  const [win, setWin] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  if (!db) {
    return (
      <EmptyState
        title="A carregar métricas da base de dados"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  const rate = (v: number | null, unit: string) =>
    v === null ? '—' : `${v.toLocaleString()}${unit}`;
  const growthTile = (
    icon: typeof Users,
    tone: keyof typeof GROWTH_TONES,
    label: string,
    g: DatabaseMetricsData['growth']['daily'],
  ) => (
    <GrowthCard
      icon={icon}
      tone={tone}
      label={label}
      value={g ? `${g.growthGb >= 0 ? '+' : ''}${g.growthGb} GB` : '—'}
      caption={g ? `${g.coverageDays} dias de histórico` : 'a acumular histórico'}
    />
  );
  const series = db.growth.series[win];
  const f = db.growth.forecast;
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Base de Dados"
        sub="PostgreSQL — ligações, desempenho, índices e crescimento"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="CPU da BD"
          value="—"
          sub="não acessível por SQL"
        />
        <MetricTile label="RAM da BD" value="—" sub="não acessível por SQL" />
        <MetricTile label="Storage (tamanho da BD)" value={`${db.storage.sizeGb} GB`} />
        <MetricTile
          label="IOPS (leituras)"
          value={rate(db.throughput.readIops, '/s')}
          sub="blocos lidos do disco"
        />
        <MetricTile
          label="Throughput"
          value={rate(db.throughput.transactionsPerSecond, ' tx/s')}
        />
        <MetricTile
          label="Ligações activas"
          value={`${db.connections.active}`}
          sub={`${db.connections.total} abertas (${db.connections.idle} inactivas)`}
        />
        <MetricTile
          label="Ligações máximas"
          value={fmt(db.connections.max)}
          barValue={db.connections.usagePercent}
          barMax={100}
          barWarn={70}
          barDanger={90}
          sub={`${db.connections.usagePercent}% em uso`}
        />
        <MetricTile
          label="Pool de ligações"
          value={fmt(db.pool.max)}
          sub="DB_POOL_MAX por instância"
        />
        <MetricTile
          label="Queries por segundo"
          value={rate(db.throughput.queriesPerSecond, '/s')}
        />
        <MetricTile
          label="Queries lentas"
          value={fmt(db.queries.slowCount)}
          sub={`acima de ${db.queries.slowThresholdMs} ms (desde o arranque)`}
        />
        <MetricTile label="Locks em espera" value={fmt(db.health.waitingLocks)} />
        <MetricTile label="Deadlocks" value={fmt(db.health.deadlocks)} />
        <MetricTile
          label="Cache hit ratio"
          value={db.health.cacheHitRatio === null ? '—' : `${db.health.cacheHitRatio}%`}
        />
        <MetricTile
          label="Query média (app)"
          value={`${db.queries.appAvgMs} ms`}
          sub={`P95 ${db.queries.appP95Ms} ms · ${fmt(db.queries.appTotal)} queries`}
        />
        <MetricTile
          label="Índices"
          value={fmt(db.indexes.total)}
          sub={`${db.indexes.unusedCount} inutilizados (top 10)`}
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Queries lentas</CardTitleBar>
        <CardBody>
          {db.slowQueries === null ? (
            <EmptyState
              title="pg_stat_statements não está instalada"
              description="Activa a extensão pg_stat_statements no PostgreSQL para ver as queries mais lentas com execuções e tempo médio."
            />
          ) : db.slowQueries.rows.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">Sem queries registadas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Query</th>
                    <th className="py-1.5 text-right font-semibold">Execuções</th>
                    <th className="py-1.5 text-right font-semibold">Tempo médio</th>
                    <th className="py-1.5 text-right font-semibold">Máximo</th>
                  </tr>
                </thead>
                <tbody>
                  {db.slowQueries.rows.map((q, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="max-w-md truncate py-1.5 font-mono text-xs text-ink" title={q.query}>
                        {q.query}
                      </td>
                      <td className="py-1.5 text-right text-ink">{fmt(q.calls)}</td>
                      <td className="py-1.5 text-right text-ink">{q.meanMs} ms</td>
                      <td className="py-1.5 text-right text-ink-muted">{q.maxMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardTitleBar>Tabelas maiores</CardTitleBar>
          <CardBody>
            <table className="w-full font-body text-sm">
              <tbody>
                {db.largestTables.map((t) => (
                  <tr key={t.name} className="border-t border-border first:border-0">
                    <td className="py-1.5 font-mono text-xs text-ink">{t.name}</td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(t.rows)} linhas</td>
                    <td className="py-1.5 text-right text-ink">{t.sizeMb} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <Card className="overflow-hidden">
          <CardTitleBar>Tabelas que mais crescem</CardTitleBar>
          <CardBody>
            {db.growth.growingTables.length === 0 ? (
              <p className="font-body text-xs text-ink-faint">
                A acumular histórico — aparece após duas ou mais amostras horárias com crescimento.
              </p>
            ) : (
              <table className="w-full font-body text-sm">
                <tbody>
                  {db.growth.growingTables.map((t) => (
                    <tr key={t.name} className="border-t border-border first:border-0">
                      <td className="py-1.5 font-mono text-xs text-ink">{t.name}</td>
                      <td className="py-1.5 text-right text-ink">+{t.growthMb} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Índices inutilizados</CardTitleBar>
        <CardBody>
          {db.indexes.unused.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Nenhum índice sem leituras (excluindo únicos e chaves primárias).
            </p>
          ) : (
            <table className="w-full font-body text-sm">
              <tbody>
                {db.indexes.unused.map((i) => (
                  <tr key={i.index} className="border-t border-border first:border-0">
                    <td className="py-1.5 font-mono text-xs text-ink">{i.index}</td>
                    <td className="py-1.5 text-ink-muted">{i.table}</td>
                    <td className="py-1.5 text-right text-ink">{i.sizeMb} MB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* §9 Crescimento da base de dados */}
      <div className="overflow-hidden rounded-card bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] px-5 py-3 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 shrink-0 text-[#7CC4FF]" strokeWidth={1.8} aria-hidden />
          <h2 className="font-display text-lg font-bold">
            Crescimento da base de dados
          </h2>
        </div>
        <p className="mt-1 font-body text-sm text-white/80">
          Database Growth — amostra horária do tamanho da BD
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {growthTile(TrendingUp, 'blue', 'Crescimento Diário', db.growth.daily)}
        {growthTile(CalendarDays, 'green', 'Crescimento Mensal', db.growth.monthly)}
        {growthTile(BarChart3, 'purple', 'Crescimento Anual', db.growth.yearly)}
      </div>
      <Card>
        <CardBody>
          <PeriodPills
            className="mb-3"
            label="Janela de crescimento"
            options={GROWTH_WINDOWS.map((w) => ({
              value: w.key,
              label: w.label,
            }))}
            value={win}
            onChange={setWin}
          />
          {series.length < 2 ? (
            <EmptyState
              title="Histórico insuficiente"
              description="O tamanho da BD é amostrado a cada hora; o gráfico aparece com pelo menos dois dias de dados."
            />
          ) : (
            <AreaLineChart
              series={[
                {
                  label: 'Tamanho da BD (GB)',
                  points: series.map((s, i) => ({ x: i, y: s.gb, xLabel: s.day })),
                },
              ]}
              yFormat={(v) => `${v} GB`}
            />
          )}
        </CardBody>
      </Card>
      <Card className="overflow-hidden">
        <CardTitleBar>Previsão</CardTitleBar>
        <CardBody>
          {f ? (
            <ul className="font-body text-sm text-ink">
              <li>Base de dados atual: {f.currentGb} GB</li>
              <li>Crescimento médio: {f.avgGrowthGbPerMonth} GB/mês</li>
              <li>Previsão 12 meses: {f.projectedGb12m} GB</li>
              <li className="mt-1 text-xs text-ink-faint">
                Calculado sobre {f.basedOnDays} dias de histórico.
              </li>
            </ul>
          ) : (
            <p className="font-body text-xs text-ink-faint">
              A acumular histórico — a previsão aparece após mais de um dia de amostras.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ─── FILAS & JOBS (modulo_scalability.md §11) ─────────────────

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;
}

// Nomes em português dos domínios síncronos (o backend devolve-os em inglês).
const SYNC_DOMAIN_LABELS: Record<string, string> = {
  Processes: 'Processos',
  Payroll: 'Folha de pagamento',
  Reports: 'Relatórios',
  Imports: 'Importações',
  Exports: 'Exportações',
  'AI Tutor': 'Tutor de IA',
  'Avatar Training': 'Formação com avatar',
};

function QueuesTab({ queues }: { queues: QueueMetricsData | null }) {
  if (!queues) {
    return (
      <EmptyState
        title="A carregar filas e tarefas"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const fmt = (n: number) => n.toLocaleString();
  const t = queues.totals;
  const points = queues.depthHistory.map((h, i) => ({
    x: i,
    y: h.total,
    xLabel: new Date(h.at).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Filas & Tarefas"
        sub="Filas Bull (Redis) e tarefas persistidas em base de dados"
      />
      {queues.mode === 'SYNC' && (
        <Card>
          <CardBody>
            <p className="font-body text-sm text-ink">
              As filas estão desligadas (QUEUE_ENABLED=false): a auditoria e as
              notificações executam de forma síncrona.
            </p>
          </CardBody>
        </Card>
      )}
      {queues.mode === 'QUEUE' && !queues.redisAvailable && (
        <Card>
          <CardBody>
            <p className="font-body text-sm text-danger">
              Redis indisponível — as filas Bull não responderam. Os valores
              abaixo incluem apenas as tarefas guardadas em base de dados.
            </p>
          </CardBody>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard icon={ListChecks} tone="green" label="Tarefas executadas" value={fmt(t.executed)} />
        <NavyStatCard icon={Clock} tone="orange" label="Tarefas pendentes" value={fmt(t.pending)} />
        <NavyStatCard icon={Workflow} tone="blue" label="Tarefas em execução" value={fmt(t.running)} />
        <NavyStatCard icon={TriangleAlert} tone="red" label="Tarefas falhadas" value={fmt(t.failed)} />
        <NavyStatCard icon={Timer} tone="orange" label="Tarefas atrasadas" value={fmt(t.delayed)} />
        <NavyStatCard
          icon={Gauge}
          tone="blue"
          label="Tempo médio de execução"
          value={formatDuration(t.avgDurationMs)}
        />
        <NavyStatCard
          icon={Activity}
          tone="green"
          label="Throughput"
          value={t.throughputPerMin.toLocaleString()}
          sub="tarefas/min · filas Bull, últimos 5 min"
        />
        <NavyStatCard icon={Boxes} tone="blue" label="Tamanho da fila" value={fmt(t.queueSize)} />
        <NavyStatCard
          icon={RotateCcw}
          tone="orange"
          label="Novas tentativas"
          value={fmt(t.retries)}
          sub="tentativas além da primeira"
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Queue Depth</CardTitleBar>
        <CardBody>
          {points.length < 2 ? (
            <EmptyState
              title="Histórico insuficiente"
              description="A profundidade das filas é amostrada a cada minuto; o gráfico aparece após dois minutos de dados."
            />
          ) : (
            <AreaLineChart
              series={[{ label: 'Tarefas em espera', points }]}
              yFormat={(v) => `${v}`}
            />
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">
            Tarefas em espera + atrasadas nas filas Bull, últimas{' '}
            {queues.historyHours} h. O histórico é guardado em memória e
            reinicia com o servidor.
          </p>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardTitleBar>Por fila</CardTitleBar>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Fila</th>
                  <th className="py-1.5 text-right font-semibold">Em espera</th>
                  <th className="py-1.5 text-right font-semibold">Em execução</th>
                  <th className="py-1.5 text-right font-semibold">Atrasados</th>
                  <th className="py-1.5 text-right font-semibold">Falhados</th>
                  <th className="py-1.5 text-right font-semibold">Concluídos</th>
                  <th className="py-1.5 text-right font-semibold">Duração média</th>
                  <th className="py-1.5 text-right font-semibold">Jobs/min</th>
                  <th className="py-1.5 text-right font-semibold">Retries</th>
                </tr>
              </thead>
              <tbody>
                {queues.queues.map((q) => (
                  <tr key={q.key} className="border-t border-border">
                    <td className="py-1.5 text-ink">
                      {q.label}
                      <span className="ml-2 text-xs text-ink-faint">
                        {q.domain}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-ink">{fmt(q.waiting)}</td>
                    <td className="py-1.5 text-right text-ink">{fmt(q.active)}</td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(q.delayed)}</td>
                    <td
                      className={cn(
                        'py-1.5 text-right',
                        q.failed > 0 ? 'font-semibold text-danger' : 'text-ink-muted',
                      )}
                    >
                      {fmt(q.failed)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(q.completed)}</td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {formatDuration(q.avgDurationMs)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">{q.throughputPerMin}</td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(q.retries)}</td>
                  </tr>
                ))}
                {queues.queues.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-3 text-xs text-ink-faint">
                      Sem dados das filas Bull.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {queues.queues
            .filter((q) => q.lastFailure)
            .map((q) => (
              <p key={q.key} className="mt-2 font-body text-xs text-ink-faint">
                Última falha em {q.label}
                {q.lastFailure?.at ? ` (${timeAgo(q.lastFailure.at)})` : ''}:{' '}
                {q.lastFailure?.reason ?? 'sem motivo registado'}
              </p>
            ))}
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardTitleBar>Tarefas em base de dados (últimas 24 h)</CardTitleBar>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Origem</th>
                  <th className="py-1.5 text-right font-semibold">Executados</th>
                  <th className="py-1.5 text-right font-semibold">Pendentes</th>
                  <th className="py-1.5 text-right font-semibold">Em execução</th>
                  <th className="py-1.5 text-right font-semibold">Falhados</th>
                  <th className="py-1.5 text-right font-semibold">Atrasados</th>
                  <th className="py-1.5 text-right font-semibold">Duração média</th>
                  <th className="py-1.5 text-right font-semibold">Retries</th>
                </tr>
              </thead>
              <tbody>
                {queues.dbJobs.map((j) => (
                  <tr key={j.key} className="border-t border-border">
                    <td className="py-1.5 text-ink">{j.label}</td>
                    <td className="py-1.5 text-right text-ink">{fmt(j.executed)}</td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(j.pending)}</td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(j.running)}</td>
                    <td
                      className={cn(
                        'py-1.5 text-right',
                        j.failed > 0 ? 'font-semibold text-danger' : 'text-ink-muted',
                      )}
                    >
                      {fmt(j.failed)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(j.delayed)}</td>
                    <td className="py-1.5 text-right text-ink-muted">
                      {formatDuration(j.avgDurationMs)}
                    </td>
                    <td className="py-1.5 text-right text-ink-muted">{fmt(j.retries)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-xs text-ink-faint">
            Sem fila nem registo de tarefas (executam de forma síncrona):{' '}
            {queues.synchronousDomains.map((d) => SYNC_DOMAIN_LABELS[d] ?? d).join(', ')}.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── STORAGE (modulo_scalability.md §12) ──────────────────────

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(mb < 10 ? 2 : 1)} MB`;
}

function StorageBreakdown({
  title,
  rows,
}: {
  title: string;
  rows: StorageMetricsData['byModule'];
}) {
  return (
    <Card className="overflow-hidden">
      <CardTitleBar>{title}</CardTitleBar>
      <CardBody>
        {rows.length === 0 ? (
          <p className="font-body text-xs text-ink-faint">Sem ficheiros registados.</p>
        ) : (
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="py-1.5 font-semibold">Nome</th>
                <th className="py-1.5 text-right font-semibold">Ficheiros</th>
                <th className="py-1.5 text-right font-semibold">Tamanho</th>
                <th className="py-1.5 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-border">
                  <td className="py-1.5 text-ink">{r.label}</td>
                  <td className="py-1.5 text-right text-ink-muted">
                    {r.files.toLocaleString()}
                  </td>
                  <td className="py-1.5 text-right text-ink">{formatSize(r.mb)}</td>
                  <td className="py-1.5 text-right text-ink-muted">{r.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}

function StorageTab({ storage }: { storage: StorageMetricsData | null }) {
  if (!storage) {
    return (
      <EmptyState
        title="A carregar métricas de storage"
        description="Os indicadores aparecem aqui assim que estiverem disponíveis."
      />
    );
  }
  const growthPoints = storage.growth.map((g, i) => ({
    x: i,
    y: g.cumulativeGb,
    xLabel: g.month,
  }));
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Storage"
        sub="Ficheiros guardados pela plataforma, por módulo, tipo e unidade"
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <MetricTile
          label="Storage total"
          value={storage.totalGb === null ? '—' : `${storage.totalGb} GB`}
          sub="quota do tenant"
        />
        <MetricTile
          label="Utilizado"
          value={formatSize(storage.usedMb)}
          barValue={storage.usagePercent ?? undefined}
          barMax={storage.usagePercent === null ? undefined : 100}
          barWarn={70}
          barDanger={90}
          sub={
            storage.usagePercent === null
              ? undefined
              : `${storage.usagePercent}% da quota`
          }
        />
        <MetricTile
          label="Disponível"
          value={
            storage.availableGb === null ? '—' : `${storage.availableGb} GB`
          }
        />
        <MetricTile
          headed
          label="Crescimento mensal"
          value={`${storage.monthlyGrowthMb >= 0 ? '+' : ''}${formatSize(storage.monthlyGrowthMb)}`}
          sub="carregado no último mês com dados"
        />
        <MetricTile
          label="Ficheiros armazenados"
          value={storage.files.toLocaleString()}
        />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Crescimento acumulado</CardTitleBar>
        <CardBody>
          {growthPoints.length < 2 ? (
            <EmptyState
              title="Histórico insuficiente"
              description="O gráfico aparece quando existirem ficheiros carregados em pelo menos dois meses."
            />
          ) : (
            <AreaLineChart
              series={[{ label: 'Storage acumulado (GB)', points: growthPoints }]}
              yFormat={(v) => `${v} GB`}
            />
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StorageBreakdown title="Storage por módulo" rows={storage.byModule} />
        <StorageBreakdown title="Categorias de conteúdo" rows={storage.byKind} />
        <StorageBreakdown title="Tipos de ficheiro" rows={storage.byType} />
        <StorageBreakdown title="Storage por unidade" rows={storage.byUnit} />
      </div>

      <Card className="overflow-hidden">
        <CardTitleBar>Maiores ficheiros</CardTitleBar>
        <CardBody>
          {storage.largestFiles.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem ficheiros com tamanho registado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Ficheiro</th>
                    <th className="py-1.5 font-semibold">Módulo</th>
                    <th className="py-1.5 font-semibold">Tipo</th>
                    <th className="py-1.5 text-right font-semibold">Tamanho</th>
                    <th className="py-1.5 text-right font-semibold">Carregado</th>
                  </tr>
                </thead>
                <tbody>
                  {storage.largestFiles.map((f, i) => (
                    <tr key={`${f.name}-${i}`} className="border-t border-border">
                      <td className="py-1.5 text-ink">{f.name}</td>
                      <td className="py-1.5 text-ink-muted">{f.module}</td>
                      <td className="py-1.5 text-ink-muted">{f.type}</td>
                      <td className="py-1.5 text-right text-ink">{formatSize(f.mb)}</td>
                      <td className="py-1.5 text-right text-ink-muted">
                        {timeAgo(f.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">{storage.note}</p>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── TABS CONFIG ──────────────────────────────────────────

const TABS: PillTabItem[] = [
  { id: 'overview', label: 'Visão Geral', hint: 'Estado geral', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', hint: 'Latência e erros', icon: Gauge },
  { id: 'integrations', label: 'Integrações', hint: 'Sistemas ligados', icon: Plug },
  { id: 'automations', label: 'Automações', hint: 'Regras automáticas', icon: Workflow },
  { id: 'alerts', label: 'Alertas', hint: 'Avisos abertos', icon: Bell },
  { id: 'sla', label: 'SLA & Compliance', hint: 'Objectivos de serviço', icon: ShieldCheck },
  { id: 'users', label: 'Utilizadores', hint: 'Carga de utilizadores', icon: Users },
  { id: 'api', label: 'API & Backend', hint: 'Pedidos e rotas', icon: Server },
  { id: 'database', label: 'Base de Dados', hint: 'Consultas e ligações', icon: Database },
  { id: 'content', label: 'Conteúdo & CDN', hint: 'Entrega de conteúdo', icon: Globe },
  { id: 'queues', label: 'Filas & Tarefas', hint: 'Tarefas em fila', icon: ListChecks },
  { id: 'storage', label: 'Storage', hint: 'Espaço e ficheiros', icon: HardDrive },
  { id: 'capacity', label: 'Capacidade', hint: 'Recursos disponíveis', icon: Boxes },
  { id: 'autoscaling', label: 'Auto Scaling', hint: 'Escala automática', icon: Scaling },
  { id: 'resilience', label: 'Resiliência', hint: 'Tolerância a falhas', icon: LifeBuoy },
  { id: 'incidents', label: 'Incidentes', hint: 'Ocorrências', icon: Siren },
  { id: 'forecasts', label: 'Previsões', hint: 'Projecções de uso', icon: LineChart },
  { id: 'loadtests', label: 'Testes de Carga', hint: 'Simulações de carga', icon: FlaskConical },
  { id: 'costs', label: 'Custos', hint: 'Gastos de infra', icon: Wallet },
  { id: 'reports', label: 'Relatórios', hint: 'Relatórios técnicos', icon: FileText },
  { id: 'settings', label: 'Configurações', hint: 'Limiares e opções', icon: Settings },
];

// ─── DASHBOARD VIEW (apresentacional — sem estado, sem fetch) ──────────────

export interface ScalabilityDashboardViewProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dashboard: DashboardData;
  overviewCharts?: OverviewChartsData | null;
  usersLoad?: UsersLoadData | null;
  apiMetrics?: ApiMetricsData | null;
  databaseMetrics?: DatabaseMetricsData | null;
  frontendMetrics?: FrontendMetricsData | null;
  queueMetrics?: QueueMetricsData | null;
  storageMetrics?: StorageMetricsData | null;
  integrationMetrics?: IntegrationMetricsData | null;
  performanceMetrics?: PerformanceMetricsData | null;
  capacityMetrics?: CapacityMetricsData | null;
  autoScaling?: AutoScalingData | null;
  resilience?: ResilienceData | null;
  /** só ADMIN pode alterar limites, política de scaling e resiliência */
  canEditInfra?: boolean;
  infraSaving?: boolean;
  onSaveCapacityLimits?: (v: {
    maxConcurrentUsers: number;
    maxApiRps: number;
  }) => void;
  onSaveAutoScaling?: (v: AutoScalingUpdate) => void;
  onSaveResilience?: (v: ResilienceUpdate) => void;
  incidents?: IncidentsData | null;
  forecasts?: ForecastsData | null;
  incidentSaving?: boolean;
  forecastSaving?: boolean;
  onCreateIncident?: (v: IncidentCreate, done: () => void) => void;
  onUpdateIncident?: (
    id: string,
    v: IncidentUpdate,
    done: () => void,
  ) => void;
  onSaveDbCapacity?: (gb: number | null) => void;
  loadTests?: LoadTestsData | null;
  costs?: CostsData | null;
  alertRules?: AlertRulesData | null;
  loadTestSaving?: boolean;
  costsSaving?: boolean;
  alertsEvaluating?: boolean;
  reportCatalog?: ReportCatalogData | null;
  report?: ReportData | null;
  selectedReport?: string | null;
  reportLoading?: boolean;
  reportExporting?: ReportFormat | null;
  onSelectReport?: (type: string) => void;
  onExportReport?: (type: string, format: ReportFormat) => void;
  settings?: SettingsData | null;
  settingsSaving?: boolean;
  onSaveSettings?: (v: SettingsUpdate, done: () => void) => void;
  onCreateLoadTest?: (v: LoadTestCreate, done: () => void) => void;
  onUpdateLoadTest?: (
    id: string,
    v: LoadTestUpdate,
    done: () => void,
  ) => void;
  onSaveCosts?: (v: CostsSave, done: () => void) => void;
  onEvaluateAlerts?: () => void;
  alerts: Alert[];
  integrations: Integration[];
  automations: AutomationRule[];
  slaConfigs: SlaConfig[];
  contentDelivery: ContentDeliveryConfig | null;
  lastRefresh: Date;
  onRefresh: () => void;
  onSyncIntegration: (id: number) => void;
  onExecuteRule: (id: number) => void;
  onResolveAlert: (id: string) => void;
}

export function ScalabilityDashboardView({
  activeTab,
  onTabChange,
  dashboard,
  overviewCharts = null,
  usersLoad = null,
  apiMetrics = null,
  databaseMetrics = null,
  frontendMetrics = null,
  queueMetrics = null,
  storageMetrics = null,
  integrationMetrics = null,
  performanceMetrics = null,
  capacityMetrics = null,
  autoScaling = null,
  resilience = null,
  canEditInfra = false,
  infraSaving = false,
  onSaveCapacityLimits = () => undefined,
  onSaveAutoScaling = () => undefined,
  onSaveResilience = () => undefined,
  incidents = null,
  forecasts = null,
  incidentSaving = false,
  forecastSaving = false,
  onCreateIncident = () => undefined,
  onUpdateIncident = () => undefined,
  onSaveDbCapacity = () => undefined,
  loadTests = null,
  costs = null,
  alertRules = null,
  loadTestSaving = false,
  costsSaving = false,
  alertsEvaluating = false,
  reportCatalog = null,
  report = null,
  selectedReport = null,
  reportLoading = false,
  reportExporting = null,
  onSelectReport = () => undefined,
  onExportReport = () => undefined,
  settings = null,
  settingsSaving = false,
  onSaveSettings = () => undefined,
  onCreateLoadTest = () => undefined,
  onUpdateLoadTest = () => undefined,
  onSaveCosts = () => undefined,
  onEvaluateAlerts = () => undefined,
  alerts,
  integrations,
  automations,
  slaConfigs,
  contentDelivery,
  lastRefresh,
  onRefresh,
  onSyncIntegration,
  onExecuteRule,
  onResolveAlert,
}: ScalabilityDashboardViewProps) {
  const openAlertCount = alerts.filter((a) => !a.isResolved).length;
  const criticalCount = alerts.filter(
    (a) => !a.isResolved && a.severity === 'CRITICAL',
  ).length;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/escalabilidade.jpg"
          title="Escalabilidade"
          hint={`${
            criticalCount > 0
              ? `${criticalCount} alerta${criticalCount > 1 ? 's' : ''} crítico${criticalCount > 1 ? 's' : ''} · `
              : ''
          }Actualizado: ${lastRefresh.toLocaleTimeString('pt-PT', {
            hour: '2-digit',
            minute: '2-digit',
          })}`}
        />
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
          <PillTabsList
            items={TABS.map((tab) =>
              tab.id === 'alerts' && openAlertCount > 0
                ? {
                    ...tab,
                    badge: (
                      <Badge
                        intent={criticalCount > 0 ? 'danger' : 'warning'}
                        dot={false}
                        className="px-1.5 py-0"
                      >
                        {openAlertCount}
                      </Badge>
                    ),
                  }
                : tab,
            )}
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewTab data={dashboard} charts={overviewCharts} />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab data={dashboard} perf={performanceMetrics} />
            <div className="mt-6">
              <EndpointHistoryChart />
            </div>
          </TabsContent>
          <TabsContent value="integrations">
            <IntegrationsTab
              tenantId={dashboard.tenantInfo.id}
              integrations={integrations}
              metrics={integrationMetrics}
              onSync={onSyncIntegration}
            />
          </TabsContent>
          <TabsContent value="automations">
            <AutomationsTab rules={automations} onExecute={onExecuteRule} />
          </TabsContent>
          <TabsContent value="alerts">
            <div className="flex flex-col gap-8">
              <AlertRulesSection
                data={alertRules}
                canEdit={canEditInfra}
                evaluating={alertsEvaluating}
                onEvaluate={onEvaluateAlerts}
              />
              <AlertsTab alerts={alerts} onResolve={onResolveAlert} />
            </div>
          </TabsContent>
          <TabsContent value="sla">
            <SlaTab data={dashboard} slaConfigs={slaConfigs} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab data={dashboard} load={usersLoad} />
          </TabsContent>
          <TabsContent value="api">
            <ApiTab api={apiMetrics} />
          </TabsContent>
          <TabsContent value="database">
            <DatabaseTab db={databaseMetrics} />
          </TabsContent>
          <TabsContent value="content">
            <ContentTab
              tenantId={dashboard.tenantInfo.id}
              config={contentDelivery}
              frontend={frontendMetrics}
            />
          </TabsContent>
          <TabsContent value="queues">
            <QueuesTab queues={queueMetrics} />
            <div className="mt-6">
              <QueueHistoryChart />
            </div>
          </TabsContent>
          <TabsContent value="storage">
            <StorageTab storage={storageMetrics} />
          </TabsContent>
          <TabsContent value="capacity">
            <CapacityTab
              key={JSON.stringify(capacityMetrics?.limits)}
              capacity={capacityMetrics}
              canEdit={canEditInfra}
              saving={infraSaving}
              onSaveLimits={onSaveCapacityLimits}
            />
            <div className="mt-6">
              <WhatIfPanel />
            </div>
            <div className="mt-6">
              <RecommendationsCard />
            </div>
            <div className="mt-6">
              <HourlyHistoryCharts />
            </div>
          </TabsContent>
          <TabsContent value="autoscaling">
            <AutoScalingTab
              key={autoScaling?.policy.updatedAt}
              data={autoScaling}
              canEdit={canEditInfra}
              saving={infraSaving}
              onSave={onSaveAutoScaling}
            />
          </TabsContent>
          <TabsContent value="resilience">
            <ResilienceTab
              key={JSON.stringify(resilience?.indicators)}
              data={resilience}
              canEdit={canEditInfra}
              saving={infraSaving}
              onSave={onSaveResilience}
            />
          </TabsContent>
          <TabsContent value="incidents">
            <IncidentsTab
              data={incidents}
              canEdit={canEditInfra}
              saving={incidentSaving}
              onCreate={onCreateIncident}
              onUpdate={onUpdateIncident}
            />
          </TabsContent>
          <TabsContent value="forecasts">
            <ForecastsTab
              data={forecasts}
              canEdit={canEditInfra}
              saving={forecastSaving}
              onSaveDbCapacity={onSaveDbCapacity}
            />
          </TabsContent>
          <TabsContent value="loadtests">
            <LoadTestsTab
              data={loadTests}
              canEdit={canEditInfra}
              saving={loadTestSaving}
              onCreate={onCreateLoadTest}
              onUpdate={onUpdateLoadTest}
            />
          </TabsContent>
          <TabsContent value="costs">
            <CostsTab
              data={costs}
              canEdit={canEditInfra}
              saving={costsSaving}
              onSave={onSaveCosts}
            />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab
              catalog={reportCatalog}
              report={report}
              selected={selectedReport}
              loadingReport={reportLoading}
              exporting={reportExporting}
              onSelect={onSelectReport}
              onExport={onExportReport}
            />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab
              data={settings}
              canEdit={canEditInfra}
              saving={settingsSaving}
              onSave={onSaveSettings}
            />
            <div className="mt-6">
              <RetentionStatusCard />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
