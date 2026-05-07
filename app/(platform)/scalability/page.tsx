// ============================================================
// INNOVA PLATFORM — SCALABILITY MODULE — FRONTEND PAGE
// src/pages/scalability/scalability.page.tsx
// ============================================================

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── TYPES ──────────────────────────────────────────────────
type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
type IntegrationStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_AUTH';
type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM';

interface DashboardData {
  tenantInfo: {
    tenantName: string;
    plan: TenantPlan;
    maxUsers: number;
    activeUsersCount: number;
    storageUsedGb: number;
    maxStorageGb: number;
  };
  performanceSummary: {
    uptimePercent: number;
    avgLatencyMs: number;
    errorRate: number;
    activeSessionsNow: number;
    requestsPerMinute: number;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
  };
  integrations: { total: number; active: number; withErrors: number; lastSyncAt: string | null };
  automations: { total: number; active: number; executionsToday: number; failedToday: number };
  alerts: { open: number; critical: number; warning: number; info: number };
  slaCompliance: {
    currentUptimePercent: number;
    slaTarget: number;
    isBreached: boolean;
    avgLatencyMs: number;
    latencyTarget: number;
  };
}

interface Alert {
  id: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: IntegrationStatus;
  syncFrequency: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
}

// ─── MOCK DATA (substituir por chamadas API) ──────────────────
const MOCK_DASHBOARD: DashboardData = {
  tenantInfo: { tenantName: 'Sonangol EP', plan: 'ENTERPRISE', maxUsers: 5000, activeUsersCount: 3847, storageUsedGb: 128, maxStorageGb: 500 },
  performanceSummary: { uptimePercent: 99.97, avgLatencyMs: 187, errorRate: 0.03, activeSessionsNow: 412, requestsPerMinute: 2840, cpuUsagePercent: 34, memoryUsagePercent: 61 },
  integrations: { total: 7, active: 5, withErrors: 1, lastSyncAt: new Date(Date.now() - 3600000).toISOString() },
  automations: { total: 18, active: 14, executionsToday: 234, failedToday: 3 },
  alerts: { open: 4, critical: 1, warning: 2, info: 1 },
  slaCompliance: { currentUptimePercent: 99.97, slaTarget: 99.9, isBreached: false, avgLatencyMs: 187, latencyTarget: 2000 },
};

const MOCK_ALERTS: Alert[] = [
  { id: '1', severity: 'CRITICAL', category: 'INTEGRATION', title: 'Falha na sincronização ERP', message: 'Integração com ERP HR Angola falhou às 14:32. 0 registos processados.', isResolved: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '2', severity: 'WARNING', category: 'PERFORMANCE', title: 'CPU acima de 80%', message: 'Uso de CPU atingiu 82% durante pico de acessos simultâneos.', isResolved: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', severity: 'WARNING', category: 'STORAGE', title: 'Armazenamento em 76%', message: 'Uso de armazenamento atingiu 76% da capacidade contratada.', isResolved: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '4', severity: 'INFO', category: 'AUTOMATION', title: 'Automação de onboarding executada', message: '47 novos colaboradores processados via automação USER_HIRED.', isResolved: false, createdAt: new Date(Date.now() - 900000).toISOString() },
];

const MOCK_INTEGRATIONS: Integration[] = [
  { id: '1', name: 'ERP RH Angola', type: 'ERP_HR', status: 'ERROR', syncFrequency: 'DAILY', lastSyncAt: new Date(Date.now() - 86400000).toISOString(), lastSyncStatus: 'FAILED' },
  { id: '2', name: 'Microsoft Teams', type: 'MICROSOFT_TEAMS', status: 'ACTIVE', syncFrequency: 'REALTIME', lastSyncAt: new Date(Date.now() - 300000).toISOString(), lastSyncStatus: 'SUCCESS' },
  { id: '3', name: 'Folha de Pagamento', type: 'PAYROLL', status: 'ACTIVE', syncFrequency: 'WEEKLY', lastSyncAt: new Date(Date.now() - 172800000).toISOString(), lastSyncStatus: 'SUCCESS' },
  { id: '4', name: 'SSO Microsoft', type: 'SSO_MICROSOFT', status: 'ACTIVE', syncFrequency: 'REALTIME', lastSyncAt: null, lastSyncStatus: null },
  { id: '5', name: 'xAPI LRS', type: 'XAPI_LRS', status: 'ACTIVE', syncFrequency: 'REALTIME', lastSyncAt: new Date(Date.now() - 60000).toISOString(), lastSyncStatus: 'SUCCESS' },
];

const MOCK_AUTOMATIONS: AutomationRule[] = [
  { id: '1', name: 'Onboarding — Trilha Inicial', triggerType: 'USER_HIRED', isActive: true, runCount: 234, lastRunAt: new Date(Date.now() - 1800000).toISOString(), lastRunStatus: 'SUCCESS' },
  { id: '2', name: 'Promoção — Atualizar Trilha de Liderança', triggerType: 'USER_PROMOTED', isActive: true, runCount: 47, lastRunAt: new Date(Date.now() - 7200000).toISOString(), lastRunStatus: 'SUCCESS' },
  { id: '3', name: 'Recertificação Obrigatória', triggerType: 'CERTIFICATE_EXPIRED', isActive: true, runCount: 89, lastRunAt: new Date(Date.now() - 3600000).toISOString(), lastRunStatus: 'FAILED' },
  { id: '4', name: 'Conclusão de Curso — Notificar Gestor', triggerType: 'COURSE_COMPLETED', isActive: true, runCount: 1203, lastRunAt: new Date(Date.now() - 300000).toISOString(), lastRunStatus: 'SUCCESS' },
  { id: '5', name: 'Offboarding — Revogar Acessos', triggerType: 'USER_OFFBOARDED', isActive: false, runCount: 12, lastRunAt: new Date(Date.now() - 604800000).toISOString(), lastRunStatus: 'SUCCESS' },
];

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

function StatusDot({ status }: { status: IntegrationStatus }) {
  const map: Record<IntegrationStatus, string> = {
    ACTIVE: '#22c55e', INACTIVE: '#6b7280', ERROR: '#ef4444', PENDING_AUTH: '#f59e0b',
  };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: map[status], boxShadow: `0 0 6px ${map[status]}88`,
    }} />
  );
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  const map: Record<AlertSeverity, { bg: string; color: string; label: string }> = {
    CRITICAL: { bg: '#ef444422', color: '#ef4444', label: 'Crítico' },
    WARNING: { bg: '#f59e0b22', color: '#f59e0b', label: 'Aviso' },
    INFO: { bg: '#3b82f622', color: '#60a5fa', label: 'Info' },
  };
  const s = map[severity];
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: s.bg, color: s.color, letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>{s.label}</span>
  );
}

function GaugeBar({ value, max, color = '#6366f1', danger, warn }: {
  value: number; max: number; color?: string; danger?: number; warn?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const isDanger = danger !== undefined && value >= danger;
  const isWarn = !isDanger && warn !== undefined && value >= warn;
  const barColor = isDanger ? '#ef4444' : isWarn ? '#f59e0b' : color;
  return (
    <div style={{ width: '100%', background: '#1e2537', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', background: barColor,
        borderRadius: 4, transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

function MetricCard({ label, value, unit = '', sub, barValue, barMax, barDanger, barWarn, accent = '#6366f1' }: {
  label: string; value: string | number; unit?: string; sub?: string;
  barValue?: number; barMax?: number; barDanger?: number; barWarn?: number; accent?: string;
}) {
  return (
    <div style={{
      background: '#111827', border: '1px solid #1e2a3a', borderRadius: 10, padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: '#64748b' }}>{unit}</span>}
      </div>
      {sub && <span style={{ fontSize: 12, color: '#475569' }}>{sub}</span>}
      {barValue !== undefined && barMax !== undefined && (
        <GaugeBar value={barValue} max={barMax} color={accent} danger={barDanger} warn={barWarn} />
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

function OverviewTab({ data }: { data: DashboardData }) {
  const { tenantInfo: t, performanceSummary: p, integrations, automations, alerts, slaCompliance } = data;
  const userPct = (t.activeUsersCount / t.maxUsers) * 100;
  const storagePct = (t.storageUsedGb / t.maxStorageGb) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tenant Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        border: '1px solid #312e81', borderRadius: 12, padding: '20px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 13, color: '#818cf8', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Tenant Activo</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{t.tenantName}</div>
        </div>
        <div style={{
          background: '#4f46e511', border: '1px solid #4f46e5', borderRadius: 8,
          padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#818cf8',
        }}>{t.plan}</div>
      </div>

      {/* SLA Status Bar */}
      {slaCompliance.isBreached && (
        <div style={{
          background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8,
          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>⚠</span>
          <span style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600 }}>
            SLA em violação — Uptime actual ({formatPercent(slaCompliance.currentUptimePercent, 2)}) abaixo do contratado ({formatPercent(slaCompliance.slaTarget, 1)})
          </span>
        </div>
      )}

      {/* Primary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <MetricCard label="Utilizadores Activos" value={t.activeUsersCount.toLocaleString()} sub={`de ${t.maxUsers.toLocaleString()} licenças`} barValue={userPct} barMax={100} barWarn={75} barDanger={90} accent="#6366f1" />
        <MetricCard label="Uptime" value={formatPercent(p.uptimePercent, 2)} sub={`SLA: ≥${formatPercent(slaCompliance.slaTarget, 1)}`} barValue={p.uptimePercent} barMax={100} barDanger={99} accent="#22c55e" />
        <MetricCard label="Latência Média" value={p.avgLatencyMs} unit="ms" sub={`Limite SLA: ${slaCompliance.latencyTarget}ms`} barValue={p.avgLatencyMs} barMax={slaCompliance.latencyTarget * 1.5} barWarn={slaCompliance.latencyTarget * 0.7} barDanger={slaCompliance.latencyTarget} accent="#3b82f6" />
        <MetricCard label="Sessões Simultâneas" value={p.activeSessionsNow.toLocaleString()} sub="em tempo real" accent="#8b5cf6" />
        <MetricCard label="Armazenamento" value={`${t.storageUsedGb}GB`} sub={`de ${t.maxStorageGb}GB`} barValue={storagePct} barMax={100} barWarn={70} barDanger={90} accent="#0ea5e9" />
        <MetricCard label="Taxa de Erro" value={formatPercent(p.errorRate, 2)} sub="últimos 60 min" barValue={p.errorRate} barMax={5} barWarn={1} barDanger={3} accent="#f59e0b" />
      </div>

      {/* Status Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatusCard title="Integrações" color="#6366f1" rows={[
          { label: 'Total', value: integrations.total },
          { label: 'Activas', value: integrations.active, accent: '#22c55e' },
          { label: 'Com erro', value: integrations.withErrors, accent: integrations.withErrors > 0 ? '#ef4444' : '#6b7280' },
          { label: 'Última sync', value: integrations.lastSyncAt ? timeAgo(integrations.lastSyncAt) : '—' },
        ]} />
        <StatusCard title="Automações" color="#8b5cf6" rows={[
          { label: 'Total de regras', value: automations.total },
          { label: 'Activas', value: automations.active, accent: '#22c55e' },
          { label: 'Execuções hoje', value: automations.executionsToday },
          { label: 'Falhas hoje', value: automations.failedToday, accent: automations.failedToday > 0 ? '#f59e0b' : '#6b7280' },
        ]} />
        <StatusCard title="Alertas Abertos" color="#f59e0b" rows={[
          { label: 'Total abertos', value: alerts.open },
          { label: 'Críticos', value: alerts.critical, accent: alerts.critical > 0 ? '#ef4444' : '#6b7280' },
          { label: 'Avisos', value: alerts.warning, accent: alerts.warning > 0 ? '#f59e0b' : '#6b7280' },
          { label: 'Informativos', value: alerts.info, accent: '#60a5fa' },
        ]} />
      </div>
    </div>
  );
}

function StatusCard({ title, color, rows }: { title: string; color: string; rows: { label: string; value: any; accent?: string }[] }) {
  return (
    <div style={{
      background: '#111827', border: '1px solid #1e2a3a', borderRadius: 10, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: r.accent ?? '#f1f5f9' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceTab({ data }: { data: DashboardData }) {
  const p = data.performanceSummary;
  const metrics = [
    { label: 'CPU', value: p.cpuUsagePercent, max: 100, unit: '%', warn: 70, danger: 85, color: '#8b5cf6' },
    { label: 'Memória', value: p.memoryUsagePercent, max: 100, unit: '%', warn: 75, danger: 90, color: '#6366f1' },
    { label: 'Req/min', value: p.requestsPerMinute, max: 10000, unit: '', warn: 7000, danger: 9000, color: '#3b82f6' },
    { label: 'Latência (ms)', value: p.avgLatencyMs, max: 3000, unit: 'ms', warn: 1500, danger: 2500, color: '#0ea5e9' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Performance em Tempo Real" sub="Últimos dados capturados pelo sistema de monitorização" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {metrics.map((m) => {
          const pct = (m.value / m.max) * 100;
          const isDanger = m.value >= m.danger;
          const isWarn = !isDanger && m.value >= m.warn;
          const color = isDanger ? '#ef4444' : isWarn ? '#f59e0b' : m.color;
          return (
            <div key={m.label} style={{
              background: '#111827', border: `1px solid ${isDanger ? '#ef444433' : '#1e2a3a'}`,
              borderRadius: 10, padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                  {m.value}{m.unit}
                </span>
              </div>
              {/* Visual bar */}
              <div style={{ position: 'relative', height: 32, background: '#1e2537', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, height: '100%',
                  width: `${Math.min(pct, 100)}%`,
                  background: `linear-gradient(90deg, ${color}66, ${color})`,
                  borderRadius: 6, transition: 'width 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 12,
                  fontSize: 12, color: '#cbd5e1', fontWeight: 600,
                }}>
                  {pct.toFixed(1)}% da capacidade
                </div>
              </div>
              {/* Threshold markers */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#475569' }}>
                <span>0</span>
                <span style={{ color: '#f59e0b' }}>⚠ {m.warn}{m.unit}</span>
                <span style={{ color: '#ef4444' }}>✕ {m.danger}{m.unit}</span>
                <span>{m.max}{m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load Test CTA */}
      <div style={{
        background: '#0c1426', border: '1px dashed #1e3a5f', borderRadius: 10,
        padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Teste de Carga (Stress Test)</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>Simular picos de utilizadores simultâneos para validar a escalabilidade</div>
        </div>
        <ActionButton label="Configurar Teste" onClick={() => alert('Modal de configuração de teste de carga')} />
      </div>
    </div>
  );
}

function IntegrationsTab({ integrations }: { integrations: Integration[] }) {
  const typeLabels: Record<string, string> = {
    ERP_HR: 'ERP de RH', PAYROLL: 'Folha de Pagamento', ATS: 'ATS',
    MICROSOFT_TEAMS: 'Microsoft Teams', SLACK: 'Slack',
    SSO_GOOGLE: 'SSO Google', SSO_MICROSOFT: 'SSO Microsoft',
    SCORM_PROVIDER: 'SCORM', XAPI_LRS: 'xAPI / LRS',
    BI_TOOL: 'Ferramenta BI', CUSTOM_WEBHOOK: 'Webhook Custom',
  };
  const statusLabel: Record<IntegrationStatus, string> = {
    ACTIVE: 'Activo', INACTIVE: 'Inactivo', ERROR: 'Erro', PENDING_AUTH: 'Aguarda Auth',
  };
  const freqLabel: Record<string, string> = {
    REALTIME: 'Tempo Real', HOURLY: 'A cada hora', DAILY: 'Diário', WEEKLY: 'Semanal', MANUAL: 'Manual',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Integrações Configuradas" sub="ERP, SSO, LMS padrões e comunicação" />
        <ActionButton label="+ Nova Integração" onClick={() => alert('Modal de nova integração')} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {integrations.map((int) => (
          <div key={int.id} style={{
            background: '#111827',
            border: `1px solid ${int.status === 'ERROR' ? '#ef444433' : '#1e2a3a'}`,
            borderRadius: 10, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <StatusDot status={int.status} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{int.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{typeLabels[int.type] ?? int.type} · {freqLabel[int.syncFrequency] ?? int.syncFrequency}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: int.status === 'ACTIVE' ? '#22c55e' : int.status === 'ERROR' ? '#ef4444' : '#94a3b8',
                marginBottom: 2,
              }}>{statusLabel[int.status]}</div>
              {int.lastSyncAt && (
                <div style={{ fontSize: 11, color: '#475569' }}>
                  Sync: {timeAgo(int.lastSyncAt)} · {int.lastSyncStatus}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmallButton label="Sync" onClick={() => alert(`Sincronizando ${int.name}...`)} />
              <SmallButton label="Config" variant="ghost" onClick={() => alert(`Configurar ${int.name}`)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AutomationsTab({ rules }: { rules: AutomationRule[] }) {
  const triggerLabel: Record<string, string> = {
    USER_HIRED: 'Contratação', USER_PROMOTED: 'Promoção', USER_TRANSFERRED: 'Transferência',
    USER_OFFBOARDED: 'Saída', COURSE_COMPLETED: 'Conclusão Curso',
    CERTIFICATE_EXPIRED: 'Certificado Expirado', TRAIL_COMPLETED: 'Trilha Concluída',
    SCHEDULED_CRON: 'Agendado', WEBHOOK_EVENT: 'Webhook', MANUAL: 'Manual',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Regras de Automação" sub="Atribuição automática, onboarding, recertificação e notificações" />
        <ActionButton label="+ Nova Regra" onClick={() => alert('Modal de nova regra')} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map((rule) => (
          <div key={rule.id} style={{
            background: '#111827', border: '1px solid #1e2a3a', borderRadius: 10,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: rule.isActive ? '#1e1b4b' : '#1a1a2e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: rule.isActive ? '#818cf8' : '#374151',
              border: `1px solid ${rule.isActive ? '#312e81' : '#1f2937'}`,
            }}>⟲</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: rule.isActive ? '#e2e8f0' : '#6b7280', marginBottom: 3 }}>{rule.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Gatilho: <span style={{ color: '#818cf8' }}>{triggerLabel[rule.triggerType] ?? rule.triggerType}</span>
                {' · '}{rule.runCount.toLocaleString()} execuções
                {rule.lastRunAt && ` · ${timeAgo(rule.lastRunAt)}`}
              </div>
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: !rule.isActive ? '#6b7280' : rule.lastRunStatus === 'FAILED' ? '#ef4444' : '#22c55e',
            }}>
              {!rule.isActive ? 'Inactiva' : rule.lastRunStatus === 'FAILED' ? 'Última falhou' : 'OK'}
            </div>
            <SmallButton label="Executar" onClick={() => alert(`Executar: ${rule.name}`)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AlertsTab({ alerts }: { alerts: Alert[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Alertas de Sistema" sub="Monitorização automática de performance, integrações e compliance" />
        <div style={{ display: 'flex', gap: 8 }}>
          <FilterChip label="Todos" active />
          <FilterChip label="Críticos" />
          <FilterChip label="Avisos" />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map((alert) => (
          <div key={alert.id} style={{
            background: '#111827',
            border: `1px solid ${alert.severity === 'CRITICAL' ? '#ef444433' : alert.severity === 'WARNING' ? '#f59e0b22' : '#1e2a3a'}`,
            borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? '#ef4444' : alert.severity === 'WARNING' ? '#f59e0b' : '#3b82f6'}`,
            borderRadius: '0 10px 10px 0', padding: '14px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <SeverityBadge severity={alert.severity} />
                  <span style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{alert.category}</span>
                  <span style={{ fontSize: 11, color: '#374151' }}>· {timeAgo(alert.createdAt)}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{alert.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{alert.message}</div>
              </div>
              <SmallButton label="Resolver" onClick={() => alert('Resolver alerta...')} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlaTab({ data }: { data: DashboardData }) {
  const { slaCompliance: s } = data;
  const complianceScore = Math.min(100, (s.currentUptimePercent / s.slaTarget) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="SLA & Compliance" sub="Monitorização de acordos de nível de serviço e conformidade regulatória" />

      {/* SLA Score */}
      <div style={{
        background: `linear-gradient(135deg, ${s.isBreached ? '#1a0505' : '#0a1628'} 0%, ${s.isBreached ? '#2d0909' : '#0f1f3d'} 100%)`,
        border: `1px solid ${s.isBreached ? '#7f1d1d' : '#1e3a5f'}`,
        borderRadius: 12, padding: '28px 32px',
        display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: `conic-gradient(${s.isBreached ? '#ef4444' : '#22c55e'} ${complianceScore * 3.6}deg, #1e2537 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: s.isBreached ? '#1a0505' : '#0a1628',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: s.isBreached ? '#ef4444' : '#22c55e',
          }}>
            {complianceScore.toFixed(0)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>Conformidade SLA</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: s.isBreached ? '#fca5a5' : '#86efac', marginBottom: 4 }}>
            {s.isBreached ? '⚠ SLA Violado' : '✓ SLA Cumprido'}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
            Uptime actual: <strong>{formatPercent(s.currentUptimePercent, 3)}</strong> · Meta: <strong>{formatPercent(s.slaTarget, 1)}</strong>
          </div>
        </div>
      </div>

      {/* Compliance Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {[
          { label: 'LGPD (Lei Geral de Protecção de Dados)', status: true, desc: 'Brasil' },
          { label: 'GDPR (General Data Protection Regulation)', status: true, desc: 'União Europeia' },
          { label: 'APD (Lei de Protecção de Dados de Angola)', status: true, desc: 'Angola' },
          { label: 'ISO 27001 — Segurança da Informação', status: true, desc: 'Internacional' },
          { label: 'SOC 2 Type II', status: false, desc: 'Em processo de certificação' },
          { label: 'Backups Automáticos Diários', status: true, desc: 'RPO: 60min · RTO: 4h' },
        ].map((item, i) => (
          <div key={i} style={{
            background: '#111827', border: '1px solid #1e2a3a', borderRadius: 8,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 16, color: item.status ? '#22c55e' : '#f59e0b' }}>
              {item.status ? '✓' : '◌'}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab({ data }: { data: DashboardData }) {
  const { tenantInfo: t } = data;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Gestão Massiva de Utilizadores" sub="Importação, segmentação e gestão de licenças em escala" />
        <ActionButton label="Importar CSV" onClick={() => alert('Modal de importação')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <MetricCard label="Utilizadores Activos" value={t.activeUsersCount.toLocaleString()} sub={`de ${t.maxUsers.toLocaleString()} licenças`} barValue={(t.activeUsersCount / t.maxUsers) * 100} barMax={100} barWarn={75} barDanger={90} accent="#6366f1" />
        <MetricCard label="Licenças Disponíveis" value={(t.maxUsers - t.activeUsersCount).toLocaleString()} accent="#22c55e" />
        <MetricCard label="Plano Actual" value={t.plan} accent="#f59e0b" />
      </div>

      {/* Segmentation */}
      <div style={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 10, padding: '20px 24px' }}>
        <div style={{ fontSize: 13, color: '#818cf8', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Segmentação Disponível</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Departamento', 'Cargo', 'Localização', 'Senioridade', 'Unidade/Região', 'País', 'Gestor'].map((seg) => (
            <span key={seg} style={{
              background: '#1e1b4b', border: '1px solid #312e81', borderRadius: 20,
              padding: '4px 14px', fontSize: 12, color: '#a5b4fc', fontWeight: 600,
            }}>{seg}</span>
          ))}
        </div>
      </div>

      {/* Role grid */}
      <div style={{ background: '#111827', border: '1px solid #1e2a3a', borderRadius: 10, padding: '20px 24px' }}>
        <div style={{ fontSize: 13, color: '#818cf8', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Perfis de Acesso (RBAC)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { role: 'Admin', desc: 'Acesso total à plataforma', color: '#ef4444' },
            { role: 'RH', desc: 'Gestão de utilizadores e relatórios', color: '#f59e0b' },
            { role: 'Gestor', desc: 'Equipa e relatórios de departamento', color: '#8b5cf6' },
            { role: 'Instrutor', desc: 'Criação e gestão de conteúdo', color: '#3b82f6' },
            { role: 'Colaborador', desc: 'Acesso a cursos e trilhas', color: '#22c55e' },
            { role: 'Auditor', desc: 'Leitura de logs e compliance', color: '#6b7280' },
          ].map((r) => (
            <div key={r.role} style={{
              background: '#0f172a', border: `1px solid ${r.color}22`,
              borderLeft: `2px solid ${r.color}`, borderRadius: 6, padding: '10px 14px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.color, marginBottom: 3 }}>{r.role}</div>
              <div style={{ fontSize: 11, color: '#475569' }}>{r.desc}</div>
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
      <SectionHeader title="Conteúdo & CDN" sub="Distribuição global de vídeos, SCORM e PDFs com bitrate adaptativo" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {[
          { title: 'CDN Activo', value: 'Cloudfront (AWS)', icon: '▣', active: true },
          { title: 'Bitrate Adaptativo', value: '360p / 480p / 720p / 1080p', icon: '⚡', active: true },
          { title: 'Modo Offline', value: 'Mobile app — 30 dias de cache', icon: '⬡', active: true },
          { title: 'Compressão', value: 'Activada — GZIP/Brotli', icon: '◈', active: true },
          { title: 'Formatos Suportados', value: 'MP4, PDF, SCORM, xAPI', icon: '◉', active: true },
          { title: 'Tamanho Máx. Vídeo', value: '500 MB por ficheiro', icon: '✦', active: false },
        ].map((item) => (
          <div key={item.title} style={{
            background: '#111827', border: '1px solid #1e2a3a', borderRadius: 10,
            padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 8, background: '#1e1b4b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#818cf8',
            }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                background: item.active ? '#14532d' : '#1a1a2e',
                color: item.active ? '#4ade80' : '#6b7280',
              }}>{item.active ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SHARED MICRO-COMPONENTS ──────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>{title}</h2>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569' }}>{sub}</p>
    </div>
  );
}

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      border: 'none', borderRadius: 8, padding: '9px 18px',
      fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
      letterSpacing: '0.02em', transition: 'opacity 0.15s',
    }}
      onMouseOver={e => (e.currentTarget.style.opacity = '0.85')}
      onMouseOut={e => (e.currentTarget.style.opacity = '1')}
    >{label}</button>
  );
}

function SmallButton({ label, onClick, variant = 'primary' }: { label: string; onClick: () => void; variant?: 'primary' | 'ghost' }) {
  return (
    <button onClick={onClick} style={{
      background: variant === 'ghost' ? 'transparent' : '#1e1b4b',
      border: `1px solid ${variant === 'ghost' ? '#374151' : '#312e81'}`,
      borderRadius: 6, padding: '5px 12px',
      fontSize: 12, fontWeight: 600,
      color: variant === 'ghost' ? '#6b7280' : '#a5b4fc',
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button style={{
      background: active ? '#1e1b4b' : 'transparent',
      border: `1px solid ${active ? '#4f46e5' : '#1e2a3a'}`,
      borderRadius: 20, padding: '4px 14px',
      fontSize: 12, fontWeight: 600,
      color: active ? '#a5b4fc' : '#475569',
      cursor: 'pointer',
    }}>{label}</button>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────

export default function ScalabilityPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<DashboardData>(MOCK_DASHBOARD);
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [integrations, setIntegrations] = useState<Integration[]>(MOCK_INTEGRATIONS);
  const [automations, setAutomations] = useState<AutomationRule[]>(MOCK_AUTOMATIONS);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(() => {
    // Em produção: await fetch('/api/scalability/dashboard/{tenantId}')
    setLastRefresh(new Date());
  }, []);

  // Auto-refresh a cada 60s
  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab data={dashboard} />;
      case 'performance': return <PerformanceTab data={dashboard} />;
      case 'integrations': return <IntegrationsTab integrations={integrations} />;
      case 'automations': return <AutomationsTab rules={automations} />;
      case 'alerts': return <AlertsTab alerts={alerts} />;
      case 'sla': return <SlaTab data={dashboard} />;
      case 'users': return <UsersTab data={dashboard} />;
      case 'content': return <ContentTab />;
      default: return null;
    }
  };

  const openAlertCount = alerts.filter((a) => !a.isResolved).length;
  const criticalCount = alerts.filter((a) => !a.isResolved && a.severity === 'CRITICAL').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080d19',
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      color: '#f1f5f9',
    }}>
      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111827; }
        ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 3px; }
      `}</style>

      {/* Top Header */}
      <div style={{
        borderBottom: '1px solid #0f1c30',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#080d19',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff',
          }}>I</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>INNOVA</div>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Módulo de Escalabilidade</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {criticalCount > 0 && (
            <div style={{
              background: '#7f1d1d', border: '1px solid #ef444466', borderRadius: 20,
              padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#fca5a5',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              {criticalCount} Alerta{criticalCount > 1 ? 's' : ''} Crítico{criticalCount > 1 ? 's' : ''}
            </div>
          )}
          <div style={{ fontSize: 12, color: '#374151' }}>
            Actualizado: {lastRefresh.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={refresh} style={{
            background: '#111827', border: '1px solid #1e2a3a', borderRadius: 6,
            padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#64748b',
            cursor: 'pointer',
          }}>⟳ Actualizar</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        borderBottom: '1px solid #0f1c30', padding: '0 32px',
        display: 'flex', gap: 4, overflowX: 'auto',
        background: '#08101f',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const hasAlert = tab.id === 'alerts' && openAlertCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none',
                padding: '14px 18px',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#a5b4fc' : '#475569',
                cursor: 'pointer',
                borderBottom: `2px solid ${isActive ? '#6366f1' : 'transparent'}`,
                whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 12 }}>{tab.icon}</span>
              {tab.label}
              {hasAlert && (
                <span style={{
                  background: criticalCount > 0 ? '#7f1d1d' : '#7c2d12',
                  color: criticalCount > 0 ? '#fca5a5' : '#fdba74',
                  fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10,
                }}>{openAlertCount}</span>
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