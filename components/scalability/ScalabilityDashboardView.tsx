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

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import {
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
  Pencil,
  Plug,
  Scaling,
  Server,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { CreateRuleModal } from '@/components/automation/CreateRuleModal';
import { ImportUsersModal } from './ImportUsersModal';
import { NewIntegrationModal } from './NewIntegrationModal';
import { LoadTestModal } from './LoadTestModal';
import { AutoScalingTab, CapacityTab, ResilienceTab } from './InfraTabs';
import { ForecastsTab, IncidentsTab } from './IncidentsForecastsTabs';
import {
  AlertRulesSection,
  CostsTab,
  LoadTestsTab,
} from './LoadTestsCostsAlertsTabs';
import { ReportsTab, SettingsTab } from './ReportsSettingsTabs';
import { RenameTenantModal } from './RenameTenantModal';
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
}

function SectionHeader({ title, sub }: SectionHeaderProps) {
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

interface MetricTileProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  barValue?: number;
  barMax?: number;
  barWarn?: number;
  barDanger?: number;
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
    <Card>
      <CardBody>
        <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </p>
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
    <Card>
      <CardBody>
        <p className="mb-4 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </p>
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

function CapacityIndicator({ data }: { data: DashboardData }) {
  const { tenantInfo: t, performanceSummary: p } = data;
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

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Capacidade da INNOVA
          </p>
          <Badge intent={state.intent} dot={false}>
            {state.label}
          </Badge>
        </div>
        <p className="mt-2 font-display text-3xl font-bold text-ink">{pct}%</p>
        <ThresholdBar pct={pct} state={state.bar} className="mt-3" />
        <p className="mt-3 font-body text-sm text-ink-muted">
          {supported !== null
            ? `A infraestrutura atual suporta aproximadamente ${supported.toLocaleString()} utilizadores simultâneos nas condições atuais.`
            : 'Estimativa de capacidade indisponível.'}
        </p>
        {estimate && (
          <p className="mt-1 font-body text-xs text-ink-faint">
            {estimate.method === 'MEASURED' ? 'Valor medido' : 'Estimativa teórica'}
            {' — '}
            {estimate.basis}
          </p>
        )}
        <p className="mt-1 font-body text-xs text-ink-faint">
          Recurso mais utilizado: {bottleneck.name} ({pct}%)
        </p>
      </CardBody>
    </Card>
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
      {/* Tenant banner */}
      <div className="flex items-center justify-between rounded-panel border border-border bg-surface p-6">
        <div>
          <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Tenant Activo
          </p>
          <div className="flex items-center gap-2">
            <p className="font-display text-2xl font-bold text-ink">
              {t.tenantName}
            </p>
            <button
              type="button"
              onClick={() => setRenaming(true)}
              aria-label="Editar nome da empresa"
              className="rounded-control p-1 text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Pencil size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <Badge intent="neutral" dot={false}>
          {t.plan}
        </Badge>
      </div>

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

      <CapacityIndicator data={data} />

      {/* Primary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="Utilizadores Registados"
          value={(t.registeredUsersCount ?? t.activeUsersCount).toLocaleString()}
        />
        <MetricTile
          label="Utilizadores Activos"
          value={t.activeUsersCount.toLocaleString()}
          sub={`de ${t.maxUsers.toLocaleString()} licenças`}
          barValue={userPct}
          barMax={100}
          barWarn={75}
          barDanger={90}
        />
        <MetricTile
          label="Capacidade Estimada"
          value={t.maxUsers.toLocaleString()}
          unit="utilizadores"
        />
        <MetricTile
          label="Utilização da Capacidade"
          value={formatPercent(userPct, 0)}
          sub={`${t.activeUsersCount.toLocaleString()} de ${t.maxUsers.toLocaleString()}`}
          barValue={userPct}
          barMax={100}
          barWarn={75}
          barDanger={90}
        />
        <MetricTile
          label="CPU"
          value={formatPercent(p.cpuUsagePercent, 0)}
          barValue={p.cpuUsagePercent}
          barMax={100}
          barWarn={70}
          barDanger={85}
        />
        <MetricTile
          label="Memória"
          value={formatPercent(p.memoryUsagePercent, 0)}
          barValue={p.memoryUsagePercent}
          barMax={100}
          barWarn={75}
          barDanger={90}
        />
        <MetricTile
          label="Base de Dados"
          value={formatPercent(p.dbUsagePercent ?? 0, 0)}
          sub="ligações abertas / máximo"
          barValue={p.dbUsagePercent ?? 0}
          barMax={100}
          barWarn={70}
          barDanger={90}
        />
        <MetricTile
          label="Uptime"
          value={formatPercent(p.uptimePercent, 2)}
          sub={`SLA: ≥${formatPercent(slaCompliance.slaTarget, 1)}`}
          barValue={p.uptimePercent}
          barMax={100}
        />
        <MetricTile
          label="Latência Média"
          value={p.avgLatencyMs}
          unit="ms"
          sub={`Limite SLA: ${slaCompliance.latencyTarget}ms`}
          barValue={p.avgLatencyMs}
          barMax={slaCompliance.latencyTarget * 1.5}
          barWarn={slaCompliance.latencyTarget * 0.7}
          barDanger={slaCompliance.latencyTarget}
        />
        <MetricTile
          label="Sessões Simultâneas"
          value={p.activeSessionsNow.toLocaleString()}
          sub="em tempo real"
        />
        <MetricTile
          label="Armazenamento"
          value={`${t.storageUsedGb}GB`}
          sub={`de ${t.maxStorageGb}GB`}
          barValue={storagePct}
          barMax={100}
          barWarn={70}
          barDanger={90}
        />
        <MetricTile
          label="Taxa de Erro"
          value={formatPercent(p.errorRate, 2)}
          sub="últimos 60 min"
          barValue={p.errorRate}
          barMax={5}
          barWarn={1}
          barDanger={3}
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
          <Card key={k.key}>
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
            <Card key={m.label}>
              <CardBody>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-body text-sm font-semibold text-ink-muted">
                    {m.label}
                  </span>
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
        <MetricTile
          label="Integrações activas"
          value={`${t.active}/${t.total}`}
        />
        <MetricTile
          label="Requests"
          value={fmt(t.requests)}
          sub="execuções de sync"
        />
        <MetricTile label="Sincronizações" value={fmt(t.syncs)} />
        <MetricTile
          label="Falhas"
          value={fmt(t.failures)}
          sub={`${t.errorRate}% de erro`}
        />
        <MetricTile label="Latência média" value={lat(t.avgLatencyMs)} />
        <MetricTile label="Retries" value={fmt(t.retries)} />
        <MetricTile label="Jobs pendentes" value={fmt(t.pendingJobs)} />
        <MetricTile
          label="Volume transferido"
          value={fmt(t.recordsTransferred)}
          unit="registos"
          sub="sem contagem de bytes"
        />
      </div>
      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Por integração
          </p>
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
            <Card key={rule.id}>
              <CardBody className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'font-body text-sm font-semibold',
                      rule.isActive ? 'text-ink' : 'text-ink-muted',
                    )}
                  >
                    {rule.name}
                  </p>
                  <p className="font-body text-xs text-ink-muted">
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
                  intent="ghost"
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
        {/* Filtros secundários mantêm-se em estilo "pílula" — não são as
            abas principais do módulo, e agora dispostos verticalmente. */}
        <div className="flex flex-col gap-1 rounded-card bg-surface-sunken p-1">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            aria-pressed={filter === 'ALL'}
            className={cn(
              'rounded-pill px-3 py-1 font-body text-xs font-medium transition-colors',
              filter === 'ALL'
                ? 'bg-surface text-ink shadow-resting'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFilter('CRITICAL')}
            aria-pressed={filter === 'CRITICAL'}
            className={cn(
              'rounded-pill px-3 py-1 font-body text-xs font-medium transition-colors',
              filter === 'CRITICAL'
                ? 'bg-surface text-ink shadow-resting'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            Críticos
          </button>
          <button
            type="button"
            onClick={() => setFilter('WARNING')}
            aria-pressed={filter === 'WARNING'}
            className={cn(
              'rounded-pill px-3 py-1 font-body text-xs font-medium transition-colors',
              filter === 'WARNING'
                ? 'bg-surface text-ink shadow-resting'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            Avisos
          </button>
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
  const { slaCompliance: s } = data;
  const complianceScore = Math.min(
    100,
    (s.currentUptimePercent / s.slaTarget) * 100,
  );
  const ringColor = s.isBreached
    ? 'var(--color-danger)'
    : 'var(--color-success)';

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="SLA & Compliance"
        sub="Monitorização de acordos de nível de serviço e conformidade regulatória"
      />

      {/* SLA score */}
      <div className="flex items-center gap-8 rounded-panel border border-border bg-surface p-6">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(${ringColor} ${complianceScore * 3.6}deg, var(--color-surface-sunken) 0deg)`,
          }}
        >
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-surface font-display text-lg font-bold text-ink">
            {complianceScore.toFixed(0)}%
          </div>
        </div>
        <div>
          <p className="mb-1 font-body text-sm text-ink-muted">
            Conformidade SLA
          </p>
          <p
            className={cn(
              'font-display text-2xl font-bold',
              s.isBreached ? 'text-danger' : 'text-success',
            )}
          >
            {s.isBreached ? 'SLA Violado' : 'SLA Cumprido'}
          </p>
          <p className="mt-1 font-body text-sm text-ink-muted">
            Uptime actual:{' '}
            <strong className="text-ink">
              {formatPercent(s.currentUptimePercent, 3)}
            </strong>{' '}
            · Meta:{' '}
            <strong className="text-ink">
              {formatPercent(s.slaTarget, 1)}
            </strong>
          </p>
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
        <MetricTile
          label="Utilizadores Activos"
          value={t.activeUsersCount.toLocaleString()}
          sub={`de ${t.maxUsers.toLocaleString()} licenças`}
          barValue={(t.activeUsersCount / t.maxUsers) * 100}
          barMax={100}
          barWarn={75}
          barDanger={90}
        />
        <MetricTile
          label="Licenças Disponíveis"
          value={(t.maxUsers - t.activeUsersCount).toLocaleString()}
        />
        <MetricTile label="Plano Actual" value={t.plan} />
      </div>

      {!load ? (
        <EmptyState
          title="A carregar indicadores de carga"
          description="Os indicadores de utilizadores aparecem aqui assim que estiverem disponíveis."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricTile
              label="Total de utilizadores"
              value={fmt(load.totals.total)}
            />
            <MetricTile
              label="Utilizadores activos"
              value={fmt(load.totals.active)}
            />
            <MetricTile
              label="Activos diariamente"
              value={fmt(load.totals.activeDaily)}
              sub="com sessão nas últimas 24h"
            />
            <MetricTile
              label="Activos mensalmente"
              value={fmt(load.totals.activeMonthly)}
              sub="com sessão nos últimos 30 dias"
            />
            <MetricTile
              label="Simultâneos agora"
              value={fmt(load.concurrent.current)}
            />
            <MetricTile
              label="Pico de simultâneos"
              value={fmt(load.concurrent.peak24h)}
              sub={`histórico: ${fmt(load.concurrent.historicPeak)}`}
            />
            <MetricTile
              label="Média de sessões"
              value={load.sessions.avgPerUser30d.toLocaleString()}
              sub="logins por utilizador activo / 30d"
            />
            <MetricTile
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
            <MetricTile
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
            <MetricTile
              label="Crescimento diário"
              value={`+${fmt(load.growth.daily.newUsers)}`}
              sub={growthSub(load.growth.daily)}
            />
            <MetricTile
              label="Crescimento mensal"
              value={`+${fmt(load.growth.monthly.newUsers)}`}
              sub={growthSub(load.growth.monthly)}
            />
            <MetricTile
              label="Crescimento anual"
              value={`+${fmt(load.growth.yearly.newUsers)}`}
              sub={growthSub(load.growth.yearly)}
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

          <Card>
            <CardBody>
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Segmentação
              </p>
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
      <Card>
        <CardBody>
          <p className="mb-4 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Perfis de Acesso (RBAC)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { role: 'Admin', desc: 'Acesso total à plataforma' },
              { role: 'RH', desc: 'Gestão de utilizadores e relatórios' },
              { role: 'Gestor', desc: 'Equipa e relatórios de departamento' },
              { role: 'Instrutor', desc: 'Criação e gestão de conteúdo' },
              { role: 'Colaborador', desc: 'Acesso a cursos e trilhas' },
              { role: 'Auditor', desc: 'Leitura de logs e compliance' },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-card border border-border border-l-2 border-l-border-strong bg-surface p-3"
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

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Páginas críticas
          </p>
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
        <Card>
          <CardBody>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Tempo de carregamento por página
            </p>
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

function ContentTab({ config, frontend = null }: ContentTabProps) {
  if (!config) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <SectionHeader
            title="Conteúdo & CDN"
            sub="Distribuição de vídeos, SCORM e PDFs com bitrate adaptativo"
          />
          <EmptyState
            title="Sem configuração de entrega de conteúdo"
            description="Este tenant ainda não tem CDN/bitrate adaptativo configurado."
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
      <SectionHeader
        title="Conteúdo & CDN"
        sub="Distribuição de vídeos, SCORM e PDFs com bitrate adaptativo"
      />
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
        <MetricTile
          label="Taxa de erro"
          value={`${api.totals.errorRate}%`}
          sub="4xx + 5xx sobre o total"
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

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Por endpoint
          </p>
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
    label: string,
    g: DatabaseMetricsData['growth']['daily'],
  ) => (
    <MetricTile
      label={label}
      value={g ? `${g.growthGb >= 0 ? '+' : ''}${g.growthGb} GB` : '—'}
      sub={g ? `${g.coverageDays} dias de histórico` : 'a acumular histórico'}
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

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Queries lentas
          </p>
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
        <Card>
          <CardBody>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Tabelas maiores
            </p>
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
        <Card>
          <CardBody>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Tabelas que mais crescem
            </p>
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

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Índices inutilizados
          </p>
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
      <SectionHeader
        title="Crescimento da base de dados"
        sub="Database Growth — amostra horária do tamanho da BD"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {growthTile('Crescimento diário', db.growth.daily)}
        {growthTile('Crescimento mensal', db.growth.monthly)}
        {growthTile('Crescimento anual', db.growth.yearly)}
      </div>
      <Card>
        <CardBody>
          <div className="mb-3 flex flex-wrap gap-2">
            {GROWTH_WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setWin(w.key)}
                className={`rounded-pill px-3 py-1 font-body text-xs font-medium ${
                  win === w.key
                    ? 'bg-ink text-surface'
                    : 'bg-surface-sunken text-ink-muted'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
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
      <Card>
        <CardBody>
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Previsão
          </p>
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

function QueuesTab({ queues }: { queues: QueueMetricsData | null }) {
  if (!queues) {
    return (
      <EmptyState
        title="A carregar filas e jobs"
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
        title="Filas & Jobs"
        sub="Filas Bull (Redis) e jobs persistidos em base de dados"
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
              abaixo incluem apenas os jobs guardados em base de dados.
            </p>
          </CardBody>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile label="Jobs executados" value={fmt(t.executed)} />
        <MetricTile label="Jobs pendentes" value={fmt(t.pending)} />
        <MetricTile label="Jobs em execução" value={fmt(t.running)} />
        <MetricTile label="Jobs falhados" value={fmt(t.failed)} />
        <MetricTile label="Jobs atrasados" value={fmt(t.delayed)} />
        <MetricTile
          label="Tempo médio de execução"
          value={formatDuration(t.avgDurationMs)}
        />
        <MetricTile
          label="Throughput"
          value={t.throughputPerMin.toLocaleString()}
          unit="jobs/min"
          sub="filas Bull, últimos 5 min"
        />
        <MetricTile label="Tamanho da fila" value={fmt(t.queueSize)} />
        <MetricTile
          label="Retry count"
          value={fmt(t.retries)}
          sub="tentativas além da primeira"
        />
      </div>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Queue Depth
          </p>
          {points.length < 2 ? (
            <EmptyState
              title="Histórico insuficiente"
              description="A profundidade das filas é amostrada a cada minuto; o gráfico aparece após dois minutos de dados."
            />
          ) : (
            <AreaLineChart
              series={[{ label: 'Jobs em espera', points }]}
              yFormat={(v) => `${v}`}
            />
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">
            Jobs em espera + atrasados nas filas Bull, últimas{' '}
            {queues.historyHours} h. O histórico é guardado em memória e
            reinicia com o servidor.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Por fila
          </p>
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

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Jobs em base de dados (últimas 24 h)
          </p>
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
            Sem fila nem registo de jobs (executam de forma síncrona):{' '}
            {queues.synchronousDomains.join(', ')}.
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
    <Card>
      <CardBody>
        <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {title}
        </p>
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
          label="Crescimento mensal"
          value={`${storage.monthlyGrowthMb >= 0 ? '+' : ''}${formatSize(storage.monthlyGrowthMb)}`}
          sub="carregado no último mês com dados"
        />
        <MetricTile
          label="Ficheiros armazenados"
          value={storage.files.toLocaleString()}
        />
      </div>

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Crescimento acumulado
          </p>
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

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Maiores ficheiros
          </p>
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

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'performance', label: 'Performance', icon: Gauge },
  { id: 'integrations', label: 'Integrações', icon: Plug },
  { id: 'automations', label: 'Automações', icon: Workflow },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'sla', label: 'SLA & Compliance', icon: ShieldCheck },
  { id: 'users', label: 'Utilizadores', icon: Users },
  { id: 'api', label: 'API & Backend', icon: Server },
  { id: 'database', label: 'Base de Dados', icon: Database },
  { id: 'content', label: 'Conteúdo & CDN', icon: Globe },
  { id: 'queues', label: 'Filas & Jobs', icon: ListChecks },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'capacity', label: 'Capacidade', icon: Boxes },
  { id: 'autoscaling', label: 'Auto Scaling', icon: Scaling },
  { id: 'resilience', label: 'Resiliência', icon: LifeBuoy },
  { id: 'incidents', label: 'Incidentes', icon: Siren },
  { id: 'forecasts', label: 'Previsões', icon: LineChart },
  { id: 'loadtests', label: 'Testes de Carga', icon: FlaskConical },
  { id: 'costs', label: 'Custos', icon: Wallet },
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'settings', label: 'Configurações', icon: Settings },
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
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-bold text-ink">
              Escalabilidade
            </h1>
            {criticalCount > 0 && (
              <Badge intent="danger">
                {criticalCount} Alerta{criticalCount > 1 ? 's' : ''} Crítico
                {criticalCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-xs text-ink-faint">
              Actualizado:{' '}
              {lastRefresh.toLocaleTimeString('pt-PT', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <Button intent="secondary" size="sm" onClick={onRefresh}>
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs — formato de "cartão": cada trigger é um cartão independente
          (borda + fundo branco + rounded), sem underline no container.
          Alinhadas horizontal e verticalmente (justify-center +
          items-center no TabsList, flex items-center em cada TabsTrigger)
          com largura mínima uniforme. Estado activo usa data-[state=active]
          do Radix para aplicar destaque azul (borda/fundo/texto primary). */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className="bg-surface px-6 py-3">
          <TabsList className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 overflow-x-auto border-b-0 bg-transparent p-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-white px-4 py-2 text-center text-sm font-medium text-foreground shadow-none
                             data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {tab.label}
                  {tab.id === 'alerts' && openAlertCount > 0 && (
                    <Badge
                      intent={criticalCount > 0 ? 'danger' : 'warning'}
                      dot={false}
                      className="ml-1.5 px-1.5 py-0"
                    >
                      {openAlertCount}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewTab data={dashboard} charts={overviewCharts} />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab data={dashboard} perf={performanceMetrics} />
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
            <ContentTab config={contentDelivery} frontend={frontendMetrics} />
          </TabsContent>
          <TabsContent value="queues">
            <QueuesTab queues={queueMetrics} />
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
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
