// components/audit/OverviewView.tsx
// Aba 01 "Visão Geral" (docs/modulo_audit.md §3): indicadores, gráficos,
// atividade recente, eventos críticos e atalhos. Substitui a antiga vista
// "Estatísticas". "Módulo" = entidade auditada (AuditLog não tem coluna
// `module`); "Alertas por analisar" = anomalias detectadas (ainda não há
// modelo de incidentes — aba 05).

'use client';

import { cn } from '@/lib/cn';
import { AlertCard } from '@/components/ui/AlertCard';
import { useState } from 'react';
import { Activity, AlertTriangle, ShieldAlert, UserX } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import {
  SEVERITY_CFG,
  actionLabel,
  entityLabel,
  moduleColor,
  moduleLabel,
} from './constants';
import { fmtTs } from './utils';
import type {
  AuditLog,
  AuditOverview,
  AuditWriteHealth,
  Severity,
  View,
} from './types';

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
];

// Pílulas no desenho dos separadores do History (Linha de tempo / Marcos / Actividade).
const PILL =
  'rounded-pill border-[1.5px] px-3.5 py-1.5 font-body text-sm font-semibold transition-colors';
const PILL_ACTIVE = 'border-[#0F1F3D] bg-[#0F1F3D] text-white';
const PILL_IDLE =
  'border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken';

// Atalhos: ao passar o cursor ficam navy #0F1F3D com letra branca.
const PILL_HOVER_NAVY =
  'hover:border-[#0F1F3D] hover:bg-[#0F1F3D] hover:text-white';

const SHORTCUTS: Array<{ view: View; label: string }> = [
  { view: 'logs', label: 'Pesquisar registos' },
  { view: 'audits', label: 'Nova auditoria' },
  { view: 'reports', label: 'Gerar relatório' },
];

const SEVERITY_ORDER: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function EventRow({ log }: { log: AuditLog }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <span className="font-body text-xs font-medium text-ink">
          {actionLabel(log.action)}
        </span>
        <span className="font-body text-xs text-ink-muted">
          {' '}
          em {entityLabel(log.entity)}
        </span>
        {log.user && (
          <span className="font-body text-xs text-ink-faint">
            {' '}
            por {log.user.fullName}
          </span>
        )}
      </div>
      <span className="flex-shrink-0 font-body text-xs text-ink-faint">
        {fmtTs(log.timestamp)}
      </span>
    </div>
  );
}

// Cabeçalho dos cards do painel: navy #0F1F3D a 60%, letra branca, sem
// qualquer efeito de cursor/hover (é só um rótulo).
const PANEL_HEADER =
  'cursor-default select-none bg-[#0F1F3D]/60 px-4 py-3 font-body text-xs font-semibold text-white';

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={PANEL_HEADER}>{title}</div>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export function OverviewView({
  onNavigate,
}: {
  onNavigate: (v: View) => void;
}) {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useApiQuery<AuditOverview>(
    queryKeys.audit.overview(days),
    '/audit/overview',
    { params: { days }, staleTime: STALE_TIME.DYNAMIC },
  );

  // §15.9/§18: falhas de gravação da auditoria têm de ser visíveis.
  const { data: health } = useApiQuery<AuditWriteHealth>(
    queryKeys.audit.health(),
    '/audit/health',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={6} />;

  const dayLabel = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);
  const eventsSeries = data.daily.map((d, i) => ({
    x: i,
    y: d.total,
    xLabel: dayLabel(d.date),
  }));
  const severityData = SEVERITY_ORDER.map((s) => ({
    label: SEVERITY_CFG[s].label,
    value: data.bySeverity[s] ?? 0,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {health && health.status !== 'OK' && (
        <AlertCard
          variant="danger"
          title={
            health.status === 'UNAVAILABLE'
              ? 'Fila de auditoria indisponível'
              : 'Eventos de auditoria por gravar'
          }
          message={
            health.status === 'UNAVAILABLE'
              ? 'Novos eventos podem não ser registados até a fila voltar a responder.'
              : `${health.failed} ${health.failed === 1 ? 'evento não foi gravado' : 'eventos não foram gravados'} no registo de auditoria.`
          }
          detail={
            health.lastFailure?.reason
              ? `Última falha${
                  health.lastFailure.entity
                    ? ` em ${health.lastFailure.entity}/${health.lastFailure.action}`
                    : ''
                }: ${health.lastFailure.reason.replace(/\s+/g, ' ').trim()}`
              : undefined
          }
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Período"
        >
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              role="tab"
              aria-selected={days === p.days}
              onClick={() => setDays(p.days)}
              className={cn(PILL, days === p.days ? PILL_ACTIVE : PILL_IDLE)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Atalhos */}
        <div className="flex flex-wrap gap-2">
          {SHORTCUTS.map((sc) => (
            <button
              key={sc.view}
              type="button"
              onClick={() => onNavigate(sc.view)}
              className={cn(PILL, PILL_IDLE, PILL_HOVER_NAVY)}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Activity}
          label="Eventos registados"
          value={data.totals.events}
          sub={`Últimos ${data.periodDays} dias`}
          intent="primary"
        />
        <KpiCard
          icon={UserX}
          label="Acessos falhados"
          value={data.totals.failedAccess}
          sub="Tentativas recusadas"
          intent={data.totals.failedAccess > 0 ? 'warning' : 'primary'}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Ações críticas"
          value={data.totals.criticalActions}
          sub="Gravidade alta ou crítica"
          intent={data.totals.criticalActions > 0 ? 'danger' : 'primary'}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Alertas por analisar"
          value={data.totals.pendingAlerts}
          sub="Anomalias detectadas"
          intent={data.totals.pendingAlerts > 0 ? 'warning' : 'primary'}
        />
      </div>

      {/* Gráficos */}
      <Panel title="Evolução dos eventos">
        <AreaLineChart
          series={[{ label: 'Eventos', points: eventsSeries }]}
          yFormat={(v) => String(Math.round(v))}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Eventos por módulo">
          {data.byModule.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem eventos no período.
            </p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={data.byModule.map((m) => moduleLabel(m.module))}
              series={[
                {
                  label: 'Eventos',
                  values: data.byModule.map((m) => m.count),
                  barColors: data.byModule.map((m) => moduleColor(m.module)),
                },
              ]}
              height={Math.max(160, data.byModule.length * 30 + 16)}
            />
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Distribuição por gravidade">
            {severityData.length === 0 ? (
              <p className="font-body text-xs text-ink-faint">
                Sem eventos no período.
              </p>
            ) : (
              <DonutChart data={severityData} centerLabel="Eventos" />
            )}
          </Panel>

          <Panel title="Acessos bem-sucedidos vs. falhados">
            <BarChart
              categories={['Bem-sucedidos', 'Falhados']}
              series={[
                {
                  label: 'Acessos',
                  values: [data.access.success, data.access.failed],
                  barColors: ['var(--color-success)', 'var(--color-danger)'],
                },
              ]}
              height={200}
            />
          </Panel>

          <Panel title="Atividade por utilizador">
            {data.topUsers.length === 0 ? (
              <p className="font-body text-xs text-ink-faint">
                Sem atividade no período.
              </p>
            ) : (
              data.topUsers.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center gap-2 border-b border-border py-1.5 last:border-0"
                >
                  <span className="flex-1 truncate font-body text-xs text-ink-muted">
                    {u.user?.fullName ?? `Utilizador #${u.userId}`}
                  </span>
                  <span className="font-data text-xs font-bold text-ink">
                    {u.count}
                  </span>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>

      {/* Alertas de segurança pendentes */}
      <div className="flex items-center justify-between rounded-card border border-border bg-surface p-4">
        <div>
          <div className="font-body text-sm font-semibold text-ink">
            Alertas de segurança pendentes
          </div>
          <div className="font-body text-xs text-ink-muted">
            {data.anomalies.suspiciousLogins.length} logins suspeitos ·{' '}
            {data.anomalies.massExports.length} exportações em massa ·{' '}
            {data.anomalies.massDeletes.length} eliminações em massa
          </div>
        </div>
        <Button
          intent="secondary"
          size="sm"
          onClick={() => onNavigate('security')}
        >
          Ver incidentes
        </Button>
      </div>

      {/* Últimos eventos críticos */}
      {data.recentCritical.length > 0 && (
        <div className="overflow-hidden rounded-card border border-danger bg-danger-subtle">
          <div className={PANEL_HEADER}>Últimos eventos críticos</div>
          {data.recentCritical.map((log) => (
            <EventRow key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Atividade recente */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className={PANEL_HEADER}>Atividade recente</div>
        {data.recent.length === 0 ? (
          <p className="px-4 py-3 font-body text-xs text-ink-faint">
            Sem eventos no período.
          </p>
        ) : (
          data.recent.map((log) => <EventRow key={log.id} log={log} />)
        )}
      </div>

      <p className="font-body text-xs text-ink-faint">
        «Auditorias em curso» fica disponível com a aba Auditorias e Inspeções.
      </p>
    </div>
  );
}
