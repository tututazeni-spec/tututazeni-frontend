'use client';

import { useId, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  INVERSE_RATE_BANDS,
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import {
  Activity,
  Boxes,
  Gauge,
  Info,
  Pencil,
  Server,
  Users,
} from 'lucide-react';
import { RenameTenantModal } from '../RenameTenantModal';
import type { DashboardData, OverviewChartsData } from '../types';
import {
  ERROR_RATE_BANDS,
  FilterChip,
  SectionHeader,
  StateIntent,
  StatusCard,
  formatPercent,
  timeAgo,
} from './shared';

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
    <div className="overflow-hidden rounded-panel bg-gradient-to-br from-brand via-brand-mid to-brand-dark p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      <div className="mb-2 flex items-center gap-3">
        <Server className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        <h3 className="font-display text-base font-bold uppercase tracking-wide">
          Tenant activo e capacidade
        </h3>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
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
              className="rounded-control p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-brand-accent"
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
        <Info className="h-5 w-5 shrink-0 text-on-brand-accent" aria-hidden />
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
          <ChartCard title="Pedidos" sub="Pedidos por minuto (média por hora)">
            <AreaLineChart
              series={[line('Pedidos/min', (m) => m.requestsPerMinute)]}
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
                activeMode === 'accounts'
                  ? 'Ativos (contas)'
                  : 'Ativos (sessão)',
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

export function OverviewTab({ data, charts }: OverviewTabProps) {
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
          value={(
            t.registeredUsersCount ?? t.activeUsersCount
          ).toLocaleString()}
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
