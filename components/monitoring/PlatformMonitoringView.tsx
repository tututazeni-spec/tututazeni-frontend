// modulo_monitoring.md §1-3 — vistas apresentacionais (Visão Geral, Módulos,
// Processos). Os dados chegam por props do container (app/(platform)/monitoring).

import { Card, CardBody } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  AlarmClock,
  Gauge,
  Hourglass,
  ListTodo,
  PlayCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingDown,
  WifiOff,
  type LucideIcon,
  Ban,
  Clock,
  Cog,
  Flame,
  ListX,
  Plug,
  Siren,
  Timer,
  Users,
  Zap,
  ZapOff,
} from 'lucide-react';
import {
  NavyStatCard,
  type NavyIconTone,
  type NavyStatTone,
} from '@/components/ui/NavyStatCard';
import { PlatformStatusCard } from './PlatformStatusCard';
import type {
  ModulesData,
  MonitoringStatus,
  OverviewData,
  ProcessesData,
  ProcessInstanceRow,
} from './platformTypes';

export type Intent = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const STATUS: Record<
  MonitoringStatus,
  { label: string; intent: Intent }
> = {
  NORMAL: { label: 'Normal', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  DEGRADADO: { label: 'Degradado', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
  INDISPONIVEL: { label: 'Indisponível', intent: 'danger' },
};

export const SEVERITY: Record<string, Intent> = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'danger',
};

export function StatusBadge({ status }: { status: MonitoringStatus }) {
  const s = STATUS[status];
  return <Badge intent={s.intent}>{s.label}</Badge>;
}

export interface TileProps {
  label: string;
  value: string | number | null;
  sub?: string;
  intent?: Intent;
}

export function Tile({ label, value, sub, intent }: TileProps) {
  const valueTone =
    intent === 'danger'
      ? 'text-danger-ink'
      : intent === 'warning'
        ? 'text-warning-ink'
        : 'text-ink';
  return (
    <Card>
      <CardBody>
        <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </p>
        <p
          className={`mt-1 font-display text-2xl font-bold tabular-nums ${valueTone}`}
        >
          {value ?? '—'}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </CardBody>
    </Card>
  );
}

export const tone = (n: number, kind: Intent = 'danger'): Intent | undefined =>
  n > 0 ? kind : undefined;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

// ── §1 Visão Geral ───────────────────────────────────────────────────────────

export function OverviewTab({ data }: { data: OverviewData }) {
  const p = data.platform;
  return (
    <div className="space-y-6">
      <PlatformStatusCard platform={p} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          tab="alerts"
          icon={Siren}
          label="Alertas críticos"
          value={data.criticalAlerts.critical}
          sub={`${data.criticalAlerts.open} por resolver`}
          tone="red"
        />
        <NavyStatCard
          tab="processes"
          icon={Clock}
          label="Processos em atraso"
          value={data.processes.overdue}
          sub={`${data.processes.urgentInProgress} urgentes em curso`}
          tone="orange"
        />
        <NavyStatCard
          tab="automations"
          icon={Zap}
          label="Automações com erro (24h)"
          value={data.automations.failed24h}
          sub={
            data.automations.failureRatePercent === null
              ? 'sem execuções'
              : `${data.automations.failureRatePercent}% de ${data.automations.total24h}`
          }
          tone="orange"
        />
        <NavyStatCard
          tab="integrations"
          icon={Plug}
          label="Integrações disponíveis"
          value={data.integrations.active}
          sub={`${data.integrations.unavailable} indisponíveis · ${data.integrations.syncFailed24h} sync falhadas (24h)`}
          tone="green"
        />
        <NavyStatCard
          tab="jobs"
          icon={Cog}
          label="Tarefas em execução"
          value={data.jobs.running}
          sub={`${data.jobs.queues.waiting} em fila · ${data.jobs.queues.failed} falhados`}
          tone="blue"
        />
        <NavyStatCard
          icon={Users}
          label="Utilizadores activos"
          value={data.activeUsers.count}
          sub={`sessões dos últimos ${data.activeUsers.windowMinutes} min`}
          tone="blue"
        />
        <NavyStatCard
          tab="sla"
          icon={Timer}
          label="SLA em risco"
          value={data.sla.atRisk}
          sub={`${data.sla.breached} já violados`}
          tone="orange"
        />
        <NavyStatCard
          tab="incidents"
          icon={Flame}
          label="Incidentes abertos"
          value={data.incidents.open}
          sub={`${data.incidents.critical} críticos · ${data.incidents.security} de segurança`}
          tone="orange"
          iconTone="yellow"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Pendências críticas
        </div>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NavyStatCard
              tab="processes"
              icon={Ban}
              label="Etapas bloqueadas"
              value={data.pendingCritical.blockedSteps}
              tone="red"
            />
            <NavyStatCard
              tab="processes"
              icon={AlarmClock}
              label="Processos em atraso"
              value={data.pendingCritical.overdueProcesses}
              tone="orange"
            />
            <NavyStatCard
              tab="automations"
              icon={ZapOff}
              label="Automações falhadas"
              value={data.pendingCritical.failedAutomations}
              tone="red"
            />
            <NavyStatCard
              tab="jobs"
              icon={ListX}
              label="Tarefas de fila falhadas"
              value={data.pendingCritical.failedQueueJobs}
              tone={data.pendingCritical.failedQueueJobs > 0 ? 'red' : 'blue'}
            />
          </div>
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Últimas ocorrências
        </div>
        <CardBody>
          {data.latestOccurrences.length === 0 ? (
            <EmptyState
              title="Sem ocorrências"
              description="Nada a reportar nas últimas 24 horas."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.latestOccurrences.map((o, i) => (
                <li
                  key={`${o.at}-${i}`}
                  className="flex flex-wrap items-center gap-3 py-2 font-body text-sm"
                >
                  <span className="w-28 shrink-0 tabular-nums text-ink-muted">
                    {fmtDate(o.at)}
                  </span>
                  <Badge intent={SEVERITY[o.severity] ?? 'neutral'}>
                    {o.kind}
                  </Badge>
                  <span className="min-w-0 flex-1 text-ink">{o.title}</span>
                  <span className="text-xs text-ink-faint">{o.source}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ── §2 Módulos ───────────────────────────────────────────────────────────────

const MODULE_STATUS_CARD: Record<
  MonitoringStatus,
  { icon: LucideIcon; tone: NavyStatTone; iconTone?: NavyIconTone }
> = {
  NORMAL: { icon: CheckCircle2, tone: 'green' },
  ATENCAO: { icon: AlertTriangle, tone: 'orange', iconTone: 'yellow' },
  DEGRADADO: { icon: TrendingDown, tone: 'orange' },
  CRITICO: { icon: ShieldAlert, tone: 'red' },
  INDISPONIVEL: { icon: WifiOff, tone: 'red', iconTone: 'gray' },
};

export function ModulesTab({ data }: { data: ModulesData }) {
  const c = data.summary.counts;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {(Object.keys(STATUS) as MonitoringStatus[]).map((s) => (
          <NavyStatCard
            key={s}
            icon={MODULE_STATUS_CARD[s].icon}
            label={STATUS[s].label}
            value={c[s]}
            tone={MODULE_STATUS_CARD[s].tone}
            iconTone={MODULE_STATUS_CARD[s].iconTone}
          />
        ))}
      </div>
      <div className="overflow-hidden rounded-panel bg-gradient-to-br from-brand/65 via-[#0B3A75]/65 to-[#0A2A57]/65 pb-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="px-5 py-3">
          <h4 className="font-display text-sm font-semibold text-white">
            Módulos monitorizados
          </h4>
        </div>
        <div className="mx-4 rounded-card bg-surface p-4 text-ink [&_.overflow-x-auto]:overflow-x-hidden [&_td]:break-words [&_td]:px-2 [&_td]:align-top [&_th]:px-2 [&_th]:text-[11px]">
          <Table>
            <TableHead className="bg-brand/60">
              <TableRow className="hover:bg-transparent">
                {[
                  'Módulo',
                  'Estado',
                  'Disponib.',
                  'Operações 24h',
                  '7d',
                  'Erros 24h',
                  'Latência',
                  'Dependências',
                ].map((h) => (
                  <TableHeaderCell key={h} className="text-white">
                    {h}
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.modules.map((m) => (
                <TableRow key={m.key}>
                  <TableCell>
                    <p className="font-medium text-ink">{m.module}</p>
                    <p className="text-xs text-ink-faint">{m.metric}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={m.status} />
                    {m.reasons.map((r) => (
                      <p key={r} className="mt-1 text-xs text-ink-muted">
                        {r}
                      </p>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      intent={m.availability ? 'success' : 'danger'}
                      dot={false}
                    >
                      {m.availability ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    <span className="font-semibold text-ink">
                      {m.operations.last24h ?? '—'}
                    </span>
                    {m.operations.previous24h !== null && (
                      <p className="text-xs text-ink-faint">
                        dia anterior {m.operations.previous24h}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {m.operations.last7d ?? '—'}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {m.errors.tracked ? (
                      <>
                        <span className="font-semibold text-ink">
                          {m.errors.last24h ?? '—'}
                        </span>
                        {m.errors.ratePercent !== null && (
                          <p className="text-xs text-ink-faint">
                            {m.errors.ratePercent}%
                          </p>
                        )}
                      </>
                    ) : (
                      'n/d'
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {m.latencyMs === null ? '—' : `${m.latencyMs} ms`}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.dependencies.length === 0 && (
                        <span className="text-ink-faint">—</span>
                      )}
                      {m.dependencies.map((d) => (
                        <Badge
                          key={d.key}
                          intent={STATUS[d.status].intent}
                          dot={false}
                        >
                          {d.module}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-3 font-body text-xs text-ink-faint">
            n/d = o módulo não regista falhas de forma fiável, por isso não é
            apresentada taxa de erros.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── §3 Processos ─────────────────────────────────────────────────────────────

function InstanceTable({
  title,
  rows,
}: {
  title: string;
  rows: ProcessInstanceRow[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
        {title}
      </div>
      <CardBody>
        {rows.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">Nenhum.</p>
        ) : (
          <div className="w-full">
            <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Processo</th>
                  <th className="pr-3">Responsável</th>
                  <th className="pr-3">Prioridade</th>
                  <th className="pr-3">Prazo SLA</th>
                  <th>Atraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-3">
                      <div className="font-medium text-ink">{r.title}</div>
                      <div className="text-xs text-ink-faint">
                        {r.code ?? `#${r.id}`} · {r.status}
                      </div>
                    </td>
                    <td className="pr-3">{r.responsible?.name ?? '—'}</td>
                    <td className="pr-3">{r.priority}</td>
                    <td className="pr-3 tabular-nums">
                      {r.slaDeadline ? fmtDate(r.slaDeadline) : '—'}
                    </td>
                    <td className="tabular-nums">
                      {r.hoursOverdue === null ? '—' : `${r.hoursOverdue} h`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function ProcessesTab({ data }: { data: ProcessesData }) {
  const s = data.summary;
  const pct = (v: number | null) => (v === null ? null : `${v}%`);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <NavyStatCard
          icon={PlayCircle}
          label="Em execução"
          value={s.running}
          sub={`${s.onHold} em pausa`}
          tone="blue"
        />
        <NavyStatCard
          icon={CheckCircle2}
          label="Concluídos (30d)"
          value={s.completed30d}
          sub={`${s.cancelled30d} cancelados`}
          tone="green"
        />
        <NavyStatCard
          icon={AlarmClock}
          label="Atrasados"
          value={s.overdue}
          sub={`${s.atRisk} em risco nas próximas 24h`}
          tone="orange"
        />
        <NavyStatCard
          icon={Ban}
          label="Bloqueados"
          value={s.blocked}
          sub={`${s.blockedSteps} etapas bloqueadas`}
          tone="red"
        />
        <NavyStatCard
          tab="processes"
          icon={ListTodo}
          label="Etapas pendentes"
          value={s.pendingSteps}
          tone="blue"
        />
        <NavyStatCard
          tab="sla"
          icon={Timer}
          label="SLA cumprido (30d)"
          value={pct(s.slaCompliancePercent) ?? '—'}
          sub="dos concluídos com prazo"
          tone="green"
        />
        <NavyStatCard
          icon={Hourglass}
          label="Tempo médio"
          value={
            s.avgCompletionHours === null ? '—' : `${s.avgCompletionHours} h`
          }
          sub="processos concluídos (30d)"
          tone="blue"
        />
        <NavyStatCard
          icon={Gauge}
          label="Taxa de conclusão"
          value={pct(s.completionRatePercent) ?? '—'}
          sub={`${s.started30d} iniciados (30d)`}
          tone="green"
        />
        <NavyStatCard
          icon={AlertTriangle}
          label="Falhas (30d)"
          value={s.failures.total30d}
          sub={`${s.failures.rejectedSteps30d} etapas rejeitadas · ${s.failures.integrationFailures30d} integrações`}
          tone="red"
        />
      </div>

      {data.overdueByResponsible.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
            Responsáveis com mais atrasos
          </div>
          <CardBody>
            <ul className="space-y-1 font-body text-sm">
              {data.overdueByResponsible.map((r) => (
                <li key={r.userId} className="flex justify-between">
                  <span>{r.name ?? `Utilizador #${r.userId}`}</span>
                  <span className="tabular-nums text-ink-muted">
                    {r.overdue}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <InstanceTable title="Processos atrasados" rows={data.overdue} />
      <InstanceTable title="Processos bloqueados" rows={data.blocked} />
    </div>
  );
}
