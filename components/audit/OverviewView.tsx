// components/audit/OverviewView.tsx
// Aba 01 "Visão Geral" (docs/modulo_audit.md §3): indicadores, gráficos,
// atividade recente, eventos críticos e atalhos. Substitui a antiga vista
// "Estatísticas". "Módulo" = entidade auditada (AuditLog não tem coluna
// `module`); "Alertas por analisar" = anomalias detectadas (ainda não há
// modelo de incidentes — aba 05).

'use client';

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
import { SEVERITY_CFG, actionLabel, entityLabel } from './constants';
import { fmtTs } from './utils';
import type { AuditLog, AuditOverview, Severity, View } from './types';

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
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

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardBody>
        <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          {title}
        </div>
        {children}
      </CardBody>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                days === p.days
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-ink-muted hover:text-ink'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Atalhos */}
        <div className="flex flex-wrap gap-2">
          <Button
            intent="secondary"
            size="sm"
            onClick={() => onNavigate('logs')}
          >
            Pesquisar registos
          </Button>
          <Button
            intent="secondary"
            size="sm"
            onClick={() => onNavigate('audits')}
          >
            Nova auditoria
          </Button>
          <Button
            intent="secondary"
            size="sm"
            onClick={() => onNavigate('reports')}
          >
            Gerar relatório
          </Button>
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
              categories={data.byModule.map((m) => entityLabel(m.module))}
              series={[
                {
                  label: 'Eventos',
                  values: data.byModule.map((m) => m.count),
                },
              ]}
              height={Math.max(160, data.byModule.length * 32 + 16)}
            />
          )}
        </Panel>

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
          <div className="border-b border-danger/30 px-4 py-3 font-body text-xs font-semibold text-danger-ink">
            Últimos eventos críticos
          </div>
          {data.recentCritical.map((log) => (
            <EventRow key={log.id} log={log} />
          ))}
        </div>
      )}

      {/* Atividade recente */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 font-body text-xs font-semibold text-ink">
          Atividade recente
        </div>
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
