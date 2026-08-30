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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Bell,
  Gauge,
  Globe,
  LayoutDashboard,
  Plug,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import type {
  AlertSeverity,
  IntegrationStatus,
  DashboardData,
  Alert,
  Integration,
  AutomationRule,
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
  sub: string;
}

function SectionHeader({ title, sub }: SectionHeaderProps) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1 font-body text-sm text-ink-muted">{sub}</p>
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
}

function FilterChip({ label, active }: FilterChipProps) {
  return (
    <button
      type="button"
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

interface OverviewTabProps {
  data: DashboardData;
}

function OverviewTab({ data }: OverviewTabProps) {
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

  return (
    <div className="flex flex-col gap-6">
      {/* Tenant banner */}
      <div className="flex items-center justify-between rounded-panel border border-border bg-surface p-6">
        <div>
          <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Tenant Activo
          </p>
          <p className="font-display text-2xl font-bold text-ink">
            {t.tenantName}
          </p>
        </div>
        <Badge intent="neutral" dot={false}>
          {t.plan}
        </Badge>
      </div>

      {/* SLA breach */}
      {slaCompliance.isBreached && (
        <div className="rounded-card border border-danger bg-danger-subtle px-4 py-3 font-body text-sm text-ink">
          SLA em violação — Uptime actual (
          {formatPercent(slaCompliance.currentUptimePercent, 2)}) abaixo do
          contratado ({formatPercent(slaCompliance.slaTarget, 1)})
        </div>
      )}

      {/* Primary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

interface PerformanceTabProps {
  data: DashboardData;
}

function PerformanceTab({ data }: PerformanceTabProps) {
  const notify = useToast();
  const p = data.performanceSummary;
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
          onClick={() =>
            notify({
              title: 'Modal de configuração de teste de carga',
              intent: 'info',
            })
          }
        >
          Configurar Teste
        </Button>
      </div>
    </div>
  );
}

interface IntegrationsTabProps {
  integrations: Integration[];
}

function IntegrationsTab({ integrations }: IntegrationsTabProps) {
  const notify = useToast();
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
        <Button
          intent="secondary"
          size="sm"
          onClick={() =>
            notify({ title: 'Modal de nova integração', intent: 'info' })
          }
        >
          Nova Integração
        </Button>
      </div>
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
                    onClick={() =>
                      notify({
                        title: `Sincronizando ${int.name}...`,
                        intent: 'info',
                      })
                    }
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
      </div>
    </div>
  );
}

interface AutomationsTabProps {
  rules: AutomationRule[];
}

function AutomationsTab({ rules }: AutomationsTabProps) {
  const notify = useToast();
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
        <SectionHeader
          title="Regras de Automação"
          sub="Atribuição automática, onboarding, recertificação e notificações"
        />
        <Button
          intent="secondary"
          size="sm"
          onClick={() =>
            notify({ title: 'Modal de nova regra', intent: 'info' })
          }
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
                  onClick={() =>
                    notify({ title: `Executar: ${rule.name}`, intent: 'info' })
                  }
                >
                  Executar
                </Button>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface AlertsTabProps {
  alerts: Alert[];
}

function AlertsTab({ alerts }: AlertsTabProps) {
  const notify = useToast();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Alertas de Sistema"
          sub="Monitorização automática de performance, integrações e compliance"
        />
        <div className="flex gap-2">
          <FilterChip label="Todos" active />
          <FilterChip label="Críticos" />
          <FilterChip label="Avisos" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {alerts.map((alert) => {
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
                  onClick={() =>
                    notify({ title: 'Resolver alerta...', intent: 'info' })
                  }
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
}

function SlaTab({ data }: SlaTabProps) {
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

      {/* Compliance checklist */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          {
            label: 'LGPD (Lei Geral de Protecção de Dados)',
            status: true,
            desc: 'Brasil',
          },
          {
            label: 'GDPR (General Data Protection Regulation)',
            status: true,
            desc: 'União Europeia',
          },
          {
            label: 'APD (Lei de Protecção de Dados de Angola)',
            status: true,
            desc: 'Angola',
          },
          {
            label: 'ISO 27001 — Segurança da Informação',
            status: true,
            desc: 'Internacional',
          },
          {
            label: 'SOC 2 Type II',
            status: false,
            desc: 'Em processo de certificação',
          },
          {
            label: 'Backups Automáticos Diários',
            status: true,
            desc: 'RPO: 60min · RTO: 4h',
          },
        ].map((item, i) => (
          <Card key={i}>
            <CardBody className="flex items-center justify-between gap-3">
              <div>
                <p className="font-body text-sm font-semibold text-ink">
                  {item.label}
                </p>
                <p className="font-body text-xs text-ink-muted">{item.desc}</p>
              </div>
              <Badge
                intent={item.status ? 'success' : 'warning'}
                dot={false}
                className="shrink-0"
              >
                {item.status ? 'Conforme' : 'Em curso'}
              </Badge>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface UsersTabProps {
  data: DashboardData;
}

function UsersTab({ data }: UsersTabProps) {
  const notify = useToast();
  const { tenantInfo: t } = data;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Gestão Massiva de Utilizadores"
          sub="Importação, segmentação e gestão de licenças em escala"
        />
        <Button
          intent="secondary"
          size="sm"
          onClick={() =>
            notify({ title: 'Modal de importação', intent: 'info' })
          }
        >
          Importar CSV
        </Button>
      </div>

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

      {/* Segmentation */}
      <Card>
        <CardBody>
          <p className="mb-4 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Segmentação Disponível
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Departamento',
              'Cargo',
              'Localização',
              'Senioridade',
              'Unidade/Região',
              'País',
              'Gestor',
            ].map((seg) => (
              <span
                key={seg}
                className="rounded-pill bg-surface-sunken px-3 py-1 font-body text-xs font-medium text-ink-muted"
              >
                {seg}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

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

function ContentTab() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Conteúdo & CDN"
        sub="Distribuição global de vídeos, SCORM e PDFs com bitrate adaptativo"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[
          { title: 'CDN Activo', value: 'Cloudfront (AWS)', active: true },
          {
            title: 'Bitrate Adaptativo',
            value: '360p / 480p / 720p / 1080p',
            active: true,
          },
          {
            title: 'Modo Offline',
            value: 'Mobile app — 30 dias de cache',
            active: true,
          },
          {
            title: 'Compressão',
            value: 'Activada — GZIP/Brotli',
            active: true,
          },
          {
            title: 'Formatos Suportados',
            value: 'MP4, PDF, SCORM, xAPI',
            active: true,
          },
          {
            title: 'Tamanho Máx. Vídeo',
            value: '500 MB por ficheiro',
            active: false,
          },
        ].map((item) => (
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
  { id: 'content', label: 'Conteúdo & CDN', icon: Globe },
];

// ─── DASHBOARD VIEW (apresentacional — sem estado, sem fetch) ──────────────

export interface ScalabilityDashboardViewProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  dashboard: DashboardData;
  alerts: Alert[];
  integrations: Integration[];
  automations: AutomationRule[];
  lastRefresh: Date;
  onRefresh: () => void;
}

export function ScalabilityDashboardView({
  activeTab,
  onTabChange,
  dashboard,
  alerts,
  integrations,
  automations,
  lastRefresh,
  onRefresh,
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl gap-4 overflow-x-auto border-b-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="gap-2 whitespace-nowrap"
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
            <OverviewTab data={dashboard} />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab data={dashboard} />
          </TabsContent>
          <TabsContent value="integrations">
            <IntegrationsTab integrations={integrations} />
          </TabsContent>
          <TabsContent value="automations">
            <AutomationsTab rules={automations} />
          </TabsContent>
          <TabsContent value="alerts">
            <AlertsTab alerts={alerts} />
          </TabsContent>
          <TabsContent value="sla">
            <SlaTab data={dashboard} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab data={dashboard} />
          </TabsContent>
          <TabsContent value="content">
            <ContentTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
