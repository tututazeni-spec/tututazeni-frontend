// components/scalability/ScalabilityDashboardView.tsx
// Vista apresentacional do módulo de Escalabilidade — sem estado próprio,
// sem fetch, sem efeitos. Recebe todos os dados e callbacks via props do
// container (app/(platform)/scalability/page.tsx). Extraído do ficheiro
// original (2020 linhas, tudo junto) — os *Tab já estavam razoavelmente
// isolados; o que faltava separar era só o topo (estado + JSX do layout).
// Ver memory project_innova_component_separation_audit, item 3.1.
//
// NOTA: Dashboard opera em tema escuro (#080d19) incompatível com a fundação
// de design light-theme. Colors refletem status (verde=sucesso, vermelho=erro,
// laranja=aviso, púrpura=primária). Background/borders/text escuros ficam
// todos como inline styles (constants em ./colors) para preservar o design —
// incluindo os botões auxiliares (ActionButton/SmallButton/FilterChip), que
// antes usavam classes Tailwind indigo/gray/slate soltas e foram convertidos
// para os mesmos tokens DARK_THEME/METRIC_ACCENT_COLORS do resto do ficheiro.

import { useToast } from '@/providers/ToastProvider';
import type {
  AlertSeverity,
  IntegrationStatus,
  DashboardData,
  Alert,
  Integration,
  AutomationRule,
} from './types';
import {
  STATUS_COLORS,
  SEVERITY_COLORS,
  METRIC_ACCENT_COLORS,
  DARK_THEME,
  SLA_STATE_COLORS,
  ROLE_COLORS,
} from './colors';

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

// ─── SUB-COMPONENTS ────────────────────────────────────────

interface StatusDotProps {
  status: IntegrationStatus;
}

function StatusDot({ status }: StatusDotProps) {
  const color = STATUS_COLORS[status];
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}88`,
      }}
    />
  );
}

interface SeverityBadgeProps {
  severity: AlertSeverity;
}

function SeverityBadge({ severity }: SeverityBadgeProps) {
  const s = SEVERITY_COLORS[severity];
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {s.label}
    </span>
  );
}

interface GaugeBarProps {
  value: number;
  max: number;
  color?: string;
  danger?: number;
  warn?: number;
}

function GaugeBar({
  value,
  max,
  color = METRIC_ACCENT_COLORS.users,
  danger,
  warn,
}: GaugeBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const isDanger = danger !== undefined && value >= danger;
  const isWarn = !isDanger && warn !== undefined && value >= warn;
  const barColor = isDanger
    ? STATUS_COLORS.ERROR
    : isWarn
      ? STATUS_COLORS.PENDING_AUTH
      : color;
  return (
    <div
      style={{
        width: '100%',
        background: DARK_THEME.bgTertiary,
        borderRadius: 4,
        height: 6,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  barValue?: number;
  barMax?: number;
  barDanger?: number;
  barWarn?: number;
  accent?: string;
}

function MetricCard({
  label,
  value,
  unit = '',
  sub,
  barValue,
  barMax,
  barDanger,
  barWarn,
  accent = METRIC_ACCENT_COLORS.users,
}: MetricCardProps) {
  return (
    <div
      style={{
        background: DARK_THEME.bgCard,
        border: `1px solid ${DARK_THEME.borderPrimary}`,
        borderRadius: 10,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: DARK_THEME.textSubtle,
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: DARK_THEME.textPrimary,
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 13, color: DARK_THEME.textMuted }}>
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <span style={{ fontSize: 12, color: DARK_THEME.textFaint }}>{sub}</span>
      )}
      {barValue !== undefined && barMax !== undefined && (
        <GaugeBar
          value={barValue}
          max={barMax}
          color={accent}
          danger={barDanger}
          warn={barWarn}
        />
      )}
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: '◈' },
  { id: 'performance', label: 'Performance', icon: '⚡' },
  { id: 'integrations', label: 'Integrações', icon: '⬡' },
  { id: 'automations', label: 'Automações', icon: '⟲' },
  { id: 'alerts', label: 'Alertas', icon: '◉' },
  { id: 'sla', label: 'SLA & Compliance', icon: '✦' },
  { id: 'users', label: 'Utilizadores', icon: '⊕' },
  { id: 'content', label: 'Conteúdo & CDN', icon: '▣' },
];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tenant Banner */}
      <div
        style={{
          background: DARK_THEME.bgGradientCard,
          border: `1px solid ${DARK_THEME.borderAccent}`,
          borderRadius: 12,
          padding: '20px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              color: METRIC_ACCENT_COLORS.users,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Tenant Activo
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: DARK_THEME.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            {t.tenantName}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(79, 70, 229, 0.07)',
            border: '1px solid rgb(79, 70, 229)',
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: METRIC_ACCENT_COLORS.users,
          }}
        >
          {t.plan}
        </div>
      </div>

      {/* SLA Status Bar */}
      {slaCompliance.isBreached && (
        <div
          style={{
            background: DARK_THEME.bgCritical,
            border: `1px solid ${STATUS_COLORS.ERROR}`,
            borderRadius: 8,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠</span>
          <span
            style={{
              color: SLA_STATE_COLORS.breached.statusText,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            SLA em violação — Uptime actual (
            {formatPercent(slaCompliance.currentUptimePercent, 2)}) abaixo do
            contratado ({formatPercent(slaCompliance.slaTarget, 1)})
          </span>
        </div>
      )}

      {/* Primary Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}
      >
        <MetricCard
          label="Utilizadores Activos"
          value={t.activeUsersCount.toLocaleString()}
          sub={`de ${t.maxUsers.toLocaleString()} licenças`}
          barValue={userPct}
          barMax={100}
          barWarn={75}
          barDanger={90}
          accent={METRIC_ACCENT_COLORS.users}
        />
        <MetricCard
          label="Uptime"
          value={formatPercent(p.uptimePercent, 2)}
          sub={`SLA: ≥${formatPercent(slaCompliance.slaTarget, 1)}`}
          barValue={p.uptimePercent}
          barMax={100}
          barDanger={99}
          accent={METRIC_ACCENT_COLORS.uptime}
        />
        <MetricCard
          label="Latência Média"
          value={p.avgLatencyMs}
          unit="ms"
          sub={`Limite SLA: ${slaCompliance.latencyTarget}ms`}
          barValue={p.avgLatencyMs}
          barMax={slaCompliance.latencyTarget * 1.5}
          barWarn={slaCompliance.latencyTarget * 0.7}
          barDanger={slaCompliance.latencyTarget}
          accent={METRIC_ACCENT_COLORS.latency}
        />
        <MetricCard
          label="Sessões Simultâneas"
          value={p.activeSessionsNow.toLocaleString()}
          sub="em tempo real"
          accent={METRIC_ACCENT_COLORS.sessions}
        />
        <MetricCard
          label="Armazenamento"
          value={`${t.storageUsedGb}GB`}
          sub={`de ${t.maxStorageGb}GB`}
          barValue={storagePct}
          barMax={100}
          barWarn={70}
          barDanger={90}
          accent={METRIC_ACCENT_COLORS.storage}
        />
        <MetricCard
          label="Taxa de Erro"
          value={formatPercent(p.errorRate, 2)}
          sub="últimos 60 min"
          barValue={p.errorRate}
          barMax={5}
          barWarn={1}
          barDanger={3}
          accent={METRIC_ACCENT_COLORS.errorRate}
        />
      </div>

      {/* Status Cards Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <StatusCard
          title="Integrações"
          color={METRIC_ACCENT_COLORS.users}
          rows={[
            { label: 'Total', value: integrations.total },
            {
              label: 'Activas',
              value: integrations.active,
              accent: STATUS_COLORS.ACTIVE,
            },
            {
              label: 'Com erro',
              value: integrations.withErrors,
              accent:
                integrations.withErrors > 0
                  ? STATUS_COLORS.ERROR
                  : DARK_THEME.textSubtle,
            },
            {
              label: 'Última sync',
              value: integrations.lastSyncAt
                ? timeAgo(integrations.lastSyncAt)
                : '—',
            },
          ]}
        />
        <StatusCard
          title="Automações"
          color={METRIC_ACCENT_COLORS.sessions}
          rows={[
            { label: 'Total de regras', value: automations.total },
            {
              label: 'Activas',
              value: automations.active,
              accent: STATUS_COLORS.ACTIVE,
            },
            { label: 'Execuções hoje', value: automations.executionsToday },
            {
              label: 'Falhas hoje',
              value: automations.failedToday,
              accent:
                automations.failedToday > 0
                  ? STATUS_COLORS.PENDING_AUTH
                  : DARK_THEME.textSubtle,
            },
          ]}
        />
        <StatusCard
          title="Alertas Abertos"
          color={STATUS_COLORS.PENDING_AUTH}
          rows={[
            { label: 'Total abertos', value: alerts.open },
            {
              label: 'Críticos',
              value: alerts.critical,
              accent:
                alerts.critical > 0
                  ? STATUS_COLORS.ERROR
                  : DARK_THEME.textSubtle,
            },
            {
              label: 'Avisos',
              value: alerts.warning,
              accent:
                alerts.warning > 0
                  ? STATUS_COLORS.PENDING_AUTH
                  : DARK_THEME.textSubtle,
            },
            {
              label: 'Informativos',
              value: alerts.info,
              accent: METRIC_ACCENT_COLORS.latency,
            },
          ]}
        />
      </div>
    </div>
  );
}

interface StatusCardProps {
  title: string;
  color: string;
  rows: { label: string; value: string | number; accent?: string }[];
}

function StatusCard({ title, color, rows }: StatusCardProps) {
  return (
    <div
      style={{
        background: DARK_THEME.bgCard,
        border: `1px solid ${DARK_THEME.borderPrimary}`,
        borderRadius: 10,
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13, color: DARK_THEME.textTertiary }}>
              {r.label}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: r.accent ?? DARK_THEME.textPrimary,
              }}
            >
              {r.value}
            </span>
          </div>
        ))}
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
      color: METRIC_ACCENT_COLORS.cpu,
    },
    {
      label: 'Memória',
      value: p.memoryUsagePercent,
      max: 100,
      unit: '%',
      warn: 75,
      danger: 90,
      color: METRIC_ACCENT_COLORS.memory,
    },
    {
      label: 'Req/min',
      value: p.requestsPerMinute,
      max: 10000,
      unit: '',
      warn: 7000,
      danger: 9000,
      color: METRIC_ACCENT_COLORS.requests,
    },
    {
      label: 'Latência (ms)',
      value: p.avgLatencyMs,
      max: 3000,
      unit: 'ms',
      warn: 1500,
      danger: 2500,
      color: METRIC_ACCENT_COLORS.storage,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Performance em Tempo Real"
        sub="Últimos dados capturados pelo sistema de monitorização"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        {metrics.map((m) => {
          const pct = (m.value / m.max) * 100;
          const isDanger = m.value >= m.danger;
          const isWarn = !isDanger && m.value >= m.warn;
          const color = isDanger
            ? STATUS_COLORS.ERROR
            : isWarn
              ? STATUS_COLORS.PENDING_AUTH
              : m.color;
          return (
            <div
              key={m.label}
              style={{
                background: DARK_THEME.bgCard,
                border: `1px solid ${isDanger ? DARK_THEME.borderErrorAlpha : DARK_THEME.borderPrimary}`,
                borderRadius: 10,
                padding: '20px 24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: DARK_THEME.textTertiary,
                    fontWeight: 600,
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {m.value}
                  {m.unit}
                </span>
              </div>
              {/* Visual bar */}
              <div
                style={{
                  position: 'relative',
                  height: 32,
                  background: DARK_THEME.bgTertiary,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${Math.min(pct, 100)}%`,
                    background: `linear-gradient(90deg, ${color}66, ${color})`,
                    borderRadius: 6,
                    transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 12,
                    fontSize: 12,
                    color: DARK_THEME.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  {pct.toFixed(1)}% da capacidade
                </div>
              </div>
              {/* Threshold markers */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  fontSize: 11,
                  color: DARK_THEME.textFaint,
                }}
              >
                <span>0</span>
                <span style={{ color: STATUS_COLORS.PENDING_AUTH }}>
                  ⚠ {m.warn}
                  {m.unit}
                </span>
                <span style={{ color: STATUS_COLORS.ERROR }}>
                  ✕ {m.danger}
                  {m.unit}
                </span>
                <span>
                  {m.max}
                  {m.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load Test CTA */}
      <div
        style={{
          background: DARK_THEME.bgSecondary,
          border: `1px dashed ${DARK_THEME.borderInfo}`,
          borderRadius: 10,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: DARK_THEME.textSecondary,
              marginBottom: 4,
            }}
          >
            Teste de Carga (Stress Test)
          </div>
          <div style={{ fontSize: 13, color: DARK_THEME.textMuted }}>
            Simular picos de utilizadores simultâneos para validar a
            escalabilidade
          </div>
        </div>
        <ActionButton
          label="Configurar Teste"
          onClick={() =>
            notify({
              title: 'Modal de configuração de teste de carga',
              intent: 'info',
            })
          }
        />
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
  const statusLabel: Record<IntegrationStatus, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    ERROR: 'Erro',
    PENDING_AUTH: 'Aguarda Auth',
  };
  const freqLabel: Record<string, string> = {
    REALTIME: 'Tempo Real',
    HOURLY: 'A cada hora',
    DAILY: 'Diário',
    WEEKLY: 'Semanal',
    MANUAL: 'Manual',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <SectionHeader
          title="Integrações Configuradas"
          sub="ERP, SSO, LMS padrões e comunicação"
        />
        <ActionButton
          label="+ Nova Integração"
          onClick={() =>
            notify({ title: 'Modal de nova integração', intent: 'info' })
          }
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {integrations.map((int) => (
          <div
            key={int.id}
            style={{
              background: DARK_THEME.bgCard,
              border: `1px solid ${int.status === 'ERROR' ? DARK_THEME.borderErrorAlpha : DARK_THEME.borderPrimary}`,
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <StatusDot status={int.status} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: DARK_THEME.textSecondary,
                  marginBottom: 2,
                }}
              >
                {int.name}
              </div>
              <div style={{ fontSize: 12, color: DARK_THEME.textMuted }}>
                {typeLabels[int.type] ?? int.type} ·{' '}
                {freqLabel[int.syncFrequency] ?? int.syncFrequency}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color:
                    int.status === 'ACTIVE'
                      ? STATUS_COLORS.ACTIVE
                      : int.status === 'ERROR'
                        ? STATUS_COLORS.ERROR
                        : DARK_THEME.textTertiary,
                  marginBottom: 2,
                }}
              >
                {statusLabel[int.status]}
              </div>
              {int.lastSyncAt && (
                <div style={{ fontSize: 11, color: DARK_THEME.textFaint }}>
                  Sync: {timeAgo(int.lastSyncAt)} · {int.lastSyncStatus}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmallButton
                label="Sync"
                onClick={() =>
                  notify({
                    title: `Sincronizando ${int.name}...`,
                    intent: 'info',
                  })
                }
              />
              <SmallButton
                label="Config"
                variant="ghost"
                onClick={() =>
                  notify({ title: `Configurar ${int.name}`, intent: 'info' })
                }
              />
            </div>
          </div>
        ))}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <SectionHeader
          title="Regras de Automação"
          sub="Atribuição automática, onboarding, recertificação e notificações"
        />
        <ActionButton
          label="+ Nova Regra"
          onClick={() =>
            notify({ title: 'Modal de nova regra', intent: 'info' })
          }
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map((rule) => (
          <div
            key={rule.id}
            style={{
              background: DARK_THEME.bgCard,
              border: `1px solid ${DARK_THEME.borderPrimary}`,
              borderRadius: 10,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: rule.isActive
                  ? DARK_THEME.bgAccentDark
                  : DARK_THEME.bgTertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: rule.isActive
                  ? METRIC_ACCENT_COLORS.users
                  : DARK_THEME.textDisabled,
                border: `1px solid ${rule.isActive ? DARK_THEME.borderAccent : DARK_THEME.borderInactive}`,
              }}
            >
              ⟲
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: rule.isActive
                    ? DARK_THEME.textSecondary
                    : DARK_THEME.textSubtle,
                  marginBottom: 3,
                }}
              >
                {rule.name}
              </div>
              <div style={{ fontSize: 12, color: DARK_THEME.textMuted }}>
                Gatilho:{' '}
                <span style={{ color: METRIC_ACCENT_COLORS.users }}>
                  {triggerLabel[rule.triggerType] ?? rule.triggerType}
                </span>
                {' · '}
                {rule.runCount.toLocaleString()} execuções
                {rule.lastRunAt && ` · ${timeAgo(rule.lastRunAt)}`}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: !rule.isActive
                  ? DARK_THEME.textSubtle
                  : rule.lastRunStatus === 'FAILED'
                    ? STATUS_COLORS.ERROR
                    : STATUS_COLORS.ACTIVE,
              }}
            >
              {!rule.isActive
                ? 'Inactiva'
                : rule.lastRunStatus === 'FAILED'
                  ? 'Última falhou'
                  : 'OK'}
            </div>
            <SmallButton
              label="Executar"
              onClick={() =>
                notify({ title: `Executar: ${rule.name}`, intent: 'info' })
              }
            />
          </div>
        ))}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <SectionHeader
          title="Alertas de Sistema"
          sub="Monitorização automática de performance, integrações e compliance"
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <FilterChip label="Todos" active />
          <FilterChip label="Críticos" />
          <FilterChip label="Avisos" />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map((alert) => (
          <div
            key={alert.id}
            style={{
              background: DARK_THEME.bgCard,
              border: `1px solid ${alert.severity === 'CRITICAL' ? DARK_THEME.borderErrorAlpha : alert.severity === 'WARNING' ? DARK_THEME.borderWarning : DARK_THEME.borderInfo}`,
              borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? STATUS_COLORS.ERROR : alert.severity === 'WARNING' ? STATUS_COLORS.PENDING_AUTH : METRIC_ACCENT_COLORS.latency}`,
              borderRadius: '0 10px 10px 0',
              padding: '14px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <SeverityBadge severity={alert.severity} />
                  <span
                    style={{
                      fontSize: 11,
                      color: DARK_THEME.textFaint,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {alert.category}
                  </span>
                  <span
                    style={{ fontSize: 11, color: DARK_THEME.textDisabled }}
                  >
                    · {timeAgo(alert.createdAt)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: DARK_THEME.textSecondary,
                    marginBottom: 4,
                  }}
                >
                  {alert.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: DARK_THEME.textMuted,
                    lineHeight: 1.5,
                  }}
                >
                  {alert.message}
                </div>
              </div>
              <SmallButton
                label="Resolver"
                onClick={() =>
                  notify({ title: 'Resolver alerta...', intent: 'info' })
                }
              />
            </div>
          </div>
        ))}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="SLA & Compliance"
        sub="Monitorização de acordos de nível de serviço e conformidade regulatória"
      />

      {/* SLA Score */}
      <div
        style={{
          background: s.isBreached
            ? SLA_STATE_COLORS.breached.gradient
            : SLA_STATE_COLORS.compliant.gradient,
          border: `1px solid ${s.isBreached ? SLA_STATE_COLORS.breached.border : SLA_STATE_COLORS.compliant.border}`,
          borderRadius: 12,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: `conic-gradient(${s.isBreached ? SLA_STATE_COLORS.breached.statusColor : SLA_STATE_COLORS.compliant.statusColor} ${complianceScore * 3.6}deg, ${DARK_THEME.bgGradientUnfilled} 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: s.isBreached
                ? SLA_STATE_COLORS.breached.bg
                : SLA_STATE_COLORS.compliant.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 800,
              color: s.isBreached
                ? SLA_STATE_COLORS.breached.statusColor
                : SLA_STATE_COLORS.compliant.statusColor,
            }}
          >
            {complianceScore.toFixed(0)}%
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              color: DARK_THEME.textMuted,
              marginBottom: 6,
            }}
          >
            Conformidade SLA
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: s.isBreached
                ? SLA_STATE_COLORS.breached.statusText
                : SLA_STATE_COLORS.compliant.statusText,
              marginBottom: 4,
            }}
          >
            {s.isBreached ? '⚠ SLA Violado' : '✓ SLA Cumprido'}
          </div>
          <div style={{ fontSize: 13, color: DARK_THEME.textTertiary }}>
            Uptime actual:{' '}
            <strong>{formatPercent(s.currentUptimePercent, 3)}</strong> · Meta:{' '}
            <strong>{formatPercent(s.slaTarget, 1)}</strong>
          </div>
        </div>
      </div>

      {/* Compliance Checklist */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
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
          <div
            key={i}
            style={{
              background: DARK_THEME.bgCard,
              border: `1px solid ${DARK_THEME.borderPrimary}`,
              borderRadius: 8,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 16,
                color: item.status
                  ? STATUS_COLORS.ACTIVE
                  : STATUS_COLORS.PENDING_AUTH,
              }}
            >
              {item.status ? '✓' : '◌'}
            </span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: DARK_THEME.textSecondary,
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: DARK_THEME.textMuted }}>
                {item.desc}
              </div>
            </div>
          </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <SectionHeader
          title="Gestão Massiva de Utilizadores"
          sub="Importação, segmentação e gestão de licenças em escala"
        />
        <ActionButton
          label="Importar CSV"
          onClick={() =>
            notify({ title: 'Modal de importação', intent: 'info' })
          }
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <MetricCard
          label="Utilizadores Activos"
          value={t.activeUsersCount.toLocaleString()}
          sub={`de ${t.maxUsers.toLocaleString()} licenças`}
          barValue={(t.activeUsersCount / t.maxUsers) * 100}
          barMax={100}
          barWarn={75}
          barDanger={90}
          accent={METRIC_ACCENT_COLORS.users}
        />
        <MetricCard
          label="Licenças Disponíveis"
          value={(t.maxUsers - t.activeUsersCount).toLocaleString()}
          accent={STATUS_COLORS.ACTIVE}
        />
        <MetricCard
          label="Plano Actual"
          value={t.plan}
          accent={STATUS_COLORS.PENDING_AUTH}
        />
      </div>

      {/* Segmentation */}
      <div
        style={{
          background: DARK_THEME.bgCard,
          border: `1px solid ${DARK_THEME.borderPrimary}`,
          borderRadius: 10,
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: METRIC_ACCENT_COLORS.users,
            fontWeight: 700,
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Segmentação Disponível
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
              style={{
                background: DARK_THEME.bgAccentDark,
                border: `1px solid ${DARK_THEME.borderAccent}`,
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                color: DARK_THEME.textHighlight,
                fontWeight: 600,
              }}
            >
              {seg}
            </span>
          ))}
        </div>
      </div>

      {/* Role grid */}
      <div
        style={{
          background: DARK_THEME.bgCard,
          border: `1px solid ${DARK_THEME.borderPrimary}`,
          borderRadius: 10,
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: METRIC_ACCENT_COLORS.users,
            fontWeight: 700,
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          Perfis de Acesso (RBAC)
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {[
            {
              role: 'Admin',
              desc: 'Acesso total à plataforma',
              color: ROLE_COLORS.admin,
            },
            {
              role: 'RH',
              desc: 'Gestão de utilizadores e relatórios',
              color: ROLE_COLORS.rh,
            },
            {
              role: 'Gestor',
              desc: 'Equipa e relatórios de departamento',
              color: ROLE_COLORS.manager,
            },
            {
              role: 'Instrutor',
              desc: 'Criação e gestão de conteúdo',
              color: ROLE_COLORS.instructor,
            },
            {
              role: 'Colaborador',
              desc: 'Acesso a cursos e trilhas',
              color: ROLE_COLORS.employee,
            },
            {
              role: 'Auditor',
              desc: 'Leitura de logs e compliance',
              color: ROLE_COLORS.auditor,
            },
          ].map((r) => (
            <div
              key={r.role}
              style={{
                background: DARK_THEME.bgPrimary,
                border: `1px solid ${r.color}22`,
                borderLeft: `2px solid ${r.color}`,
                borderRadius: 6,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: r.color,
                  marginBottom: 3,
                }}
              >
                {r.role}
              </div>
              <div style={{ fontSize: 11, color: DARK_THEME.textFaint }}>
                {r.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Conteúdo & CDN"
        sub="Distribuição global de vídeos, SCORM e PDFs com bitrate adaptativo"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        {[
          {
            title: 'CDN Activo',
            value: 'Cloudfront (AWS)',
            icon: '▣',
            active: true,
          },
          {
            title: 'Bitrate Adaptativo',
            value: '360p / 480p / 720p / 1080p',
            icon: '⚡',
            active: true,
          },
          {
            title: 'Modo Offline',
            value: 'Mobile app — 30 dias de cache',
            icon: '⬡',
            active: true,
          },
          {
            title: 'Compressão',
            value: 'Activada — GZIP/Brotli',
            icon: '◈',
            active: true,
          },
          {
            title: 'Formatos Suportados',
            value: 'MP4, PDF, SCORM, xAPI',
            icon: '◉',
            active: true,
          },
          {
            title: 'Tamanho Máx. Vídeo',
            value: '500 MB por ficheiro',
            icon: '✦',
            active: false,
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              background: DARK_THEME.bgCard,
              border: `1px solid ${DARK_THEME.borderPrimary}`,
              borderRadius: 10,
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                background: DARK_THEME.bgAccentDark,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: METRIC_ACCENT_COLORS.users,
              }}
            >
              {item.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: DARK_THEME.textMuted,
                  marginBottom: 4,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: DARK_THEME.textSecondary,
                }}
              >
                {item.value}
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: item.active
                    ? DARK_THEME.bgSuccess
                    : DARK_THEME.bgTertiary,
                  color: item.active
                    ? METRIC_ACCENT_COLORS.activeToggle
                    : DARK_THEME.textSubtle,
                }}
              >
                {item.active ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SHARED MICRO-COMPONENTS ──────────────────────────────

interface SectionHeaderProps {
  title: string;
  sub: string;
}

function SectionHeader({ title, sub }: SectionHeaderProps) {
  return (
    <div>
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 800,
          color: DARK_THEME.textPrimary,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h2>
      <p
        style={{ margin: '4px 0 0', fontSize: 13, color: DARK_THEME.textFaint }}
      >
        {sub}
      </p>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
}

function ActionButton({ label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-[18px] py-[9px] text-sm font-semibold rounded-control"
      style={{
        background: METRIC_ACCENT_COLORS.users,
        color: DARK_THEME.textWhite,
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </button>
  );
}

interface SmallButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
}

function SmallButton({
  label,
  onClick,
  variant = 'primary',
}: SmallButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-control text-xs font-semibold whitespace-nowrap border"
      style={
        variant === 'ghost'
          ? {
              background: 'transparent',
              borderColor: DARK_THEME.borderPrimary,
              color: DARK_THEME.textSubtle,
            }
          : {
              background: DARK_THEME.bgAccentDark,
              borderColor: DARK_THEME.borderAccent,
              color: DARK_THEME.textHighlight,
            }
      }
    >
      {label}
    </button>
  );
}

interface FilterChipProps {
  label: string;
  active?: boolean;
}

function FilterChip({ label, active }: FilterChipProps) {
  return (
    <button
      className="px-[14px] py-1 rounded-pill text-xs font-semibold border"
      style={
        active
          ? {
              background: DARK_THEME.bgAccentDark,
              borderColor: DARK_THEME.borderAccent,
              color: DARK_THEME.textHighlight,
            }
          : {
              background: 'transparent',
              borderColor: DARK_THEME.borderPrimary,
              color: DARK_THEME.textFaint,
            }
      }
    >
      {label}
    </button>
  );
}

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
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={dashboard} />;
      case 'performance':
        return <PerformanceTab data={dashboard} />;
      case 'integrations':
        return <IntegrationsTab integrations={integrations} />;
      case 'automations':
        return <AutomationsTab rules={automations} />;
      case 'alerts':
        return <AlertsTab alerts={alerts} />;
      case 'sla':
        return <SlaTab data={dashboard} />;
      case 'users':
        return <UsersTab data={dashboard} />;
      case 'content':
        return <ContentTab />;
      default:
        return null;
    }
  };

  const openAlertCount = alerts.filter((a) => !a.isResolved).length;
  const criticalCount = alerts.filter(
    (a) => !a.isResolved && a.severity === 'CRITICAL',
  ).length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: DARK_THEME.bgPrimary,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        color: DARK_THEME.textPrimary,
      }}
    >
      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${DARK_THEME.scrollbarBg}; }
        ::-webkit-scrollbar-thumb { background: ${DARK_THEME.scrollbarThumb}; border-radius: 3px; }
      `}</style>

      {/* Top Header */}
      <div
        style={{
          borderBottom: `1px solid ${DARK_THEME.borderPrimary}`,
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: DARK_THEME.bgPrimary,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: DARK_THEME.bgGradientTablet,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 900,
              color: DARK_THEME.textWhite,
            }}
          >
            I
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: DARK_THEME.textPrimary,
                letterSpacing: '-0.01em',
              }}
            >
              INNOVA
            </div>
            <div
              style={{
                fontSize: 11,
                color: DARK_THEME.textFaint,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Módulo de Escalabilidade
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {criticalCount > 0 && (
            <div
              style={{
                background: SLA_STATE_COLORS.breached.bg,
                border: `1px solid ${SLA_STATE_COLORS.breached.border}66`,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: SLA_STATE_COLORS.breached.statusText,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: STATUS_COLORS.ERROR,
                  display: 'inline-block',
                }}
              />
              {criticalCount} Alerta{criticalCount > 1 ? 's' : ''} Crítico
              {criticalCount > 1 ? 's' : ''}
            </div>
          )}
          <div style={{ fontSize: 12, color: DARK_THEME.textDisabled }}>
            Actualizado:{' '}
            {lastRefresh.toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <button
            onClick={onRefresh}
            style={{
              background: DARK_THEME.bgCard,
              border: `1px solid ${DARK_THEME.borderPrimary}`,
              borderRadius: 6,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 600,
              color: DARK_THEME.textMuted,
              cursor: 'pointer',
            }}
          >
            ⟳ Actualizar
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          borderBottom: `1px solid ${DARK_THEME.borderPrimary}`,
          padding: '0 32px',
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          background: DARK_THEME.bgSecondary,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasAlert = tab.id === 'alerts' && openAlertCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '14px 18px',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive
                  ? DARK_THEME.textHighlight
                  : DARK_THEME.textFaint,
                cursor: 'pointer',
                borderBottom: `2px solid ${isActive ? METRIC_ACCENT_COLORS.users : 'transparent'}`,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 12 }}>{tab.icon}</span>
              {tab.label}
              {hasAlert && (
                <span
                  style={{
                    background:
                      criticalCount > 0
                        ? SLA_STATE_COLORS.breached.bg
                        : DARK_THEME.bgWarningDark,
                    color:
                      criticalCount > 0
                        ? SLA_STATE_COLORS.breached.statusText
                        : DARK_THEME.textWarningLight,
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 10,
                  }}
                >
                  {openAlertCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Page Content */}
      <div style={{ padding: '32px', maxWidth: 1280, margin: '0 auto' }}>
        {renderTab()}
      </div>
    </div>
  );
}
