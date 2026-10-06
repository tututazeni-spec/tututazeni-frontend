// modulo_monitoring.md §1-3 — vistas apresentacionais (Visão Geral, Módulos,
// Processos). Os dados chegam por props do container (app/(platform)/monitoring).

import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Activity } from 'lucide-react';
import type {
  ModulesData,
  MonitoringStatus,
  OverviewData,
  ProcessesData,
  ProcessInstanceRow,
} from './platformTypes';

export type Intent = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const STATUS: Record<MonitoringStatus, { label: string; intent: Intent }> = {
  NORMAL: { label: 'Normal', intent: 'success' },
  ATENCAO: { label: 'Atenção', intent: 'warning' },
  DEGRADADO: { label: 'Degradado', intent: 'warning' },
  CRITICO: { label: 'Crítico', intent: 'danger' },
  INDISPONIVEL: { label: 'Indisponível', intent: 'danger' },
};

const SEVERITY: Record<string, Intent> = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'danger',
};

function StatusBadge({ status }: { status: MonitoringStatus }) {
  const s = STATUS[status];
  return <Badge intent={s.intent}>{s.label}</Badge>;
}

export function Tile({
  label,
  value,
  sub,
  intent,
}: {
  label: string;
  value: string | number | null;
  sub?: string;
  intent?: Intent;
}) {
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
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <Activity size={20} />
            <h2 className="font-display text-lg font-bold text-ink">
              Estado geral da plataforma
            </h2>
            <StatusBadge status={p.status} />
            <span className="font-body text-sm text-ink-muted">
              BD:{' '}
              {p.database.available
                ? `${p.database.latencyMs} ms`
                : 'sem resposta'}{' '}
              · {p.modules.total} módulos
            </span>
          </div>
          {p.reasons.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 font-body text-sm text-ink-muted">
              {p.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Alertas críticos"
          value={data.criticalAlerts.critical}
          sub={`${data.criticalAlerts.open} por resolver`}
          intent={tone(data.criticalAlerts.critical)}
        />
        <Tile
          label="Processos em atraso"
          value={data.processes.overdue}
          sub={`${data.processes.urgentInProgress} urgentes em curso`}
          intent={tone(data.processes.overdue, 'warning')}
        />
        <Tile
          label="Automações com erro (24h)"
          value={data.automations.failed24h}
          sub={
            data.automations.failureRatePercent === null
              ? 'sem execuções'
              : `${data.automations.failureRatePercent}% de ${data.automations.total24h}`
          }
          intent={tone(data.automations.failed24h, 'warning')}
        />
        <Tile
          label="Integrações indisponíveis"
          value={data.integrations.unavailable}
          sub={`${data.integrations.active} activas · ${data.integrations.syncFailed24h} sync falhadas (24h)`}
          intent={tone(data.integrations.unavailable, 'warning')}
        />
        <Tile
          label="Jobs em execução"
          value={data.jobs.running}
          sub={`${data.jobs.queues.waiting} em fila · ${data.jobs.queues.failed} falhados`}
        />
        <Tile
          label="Utilizadores activos"
          value={data.activeUsers.count}
          sub={`sessões dos últimos ${data.activeUsers.windowMinutes} min`}
        />
        <Tile
          label="SLA em risco"
          value={data.sla.atRisk}
          sub={`${data.sla.breached} já violados`}
          intent={tone(data.sla.atRisk, 'warning')}
        />
        <Tile
          label="Incidentes abertos"
          value={data.incidents.open}
          sub={`${data.incidents.critical} críticos · ${data.incidents.security} de segurança`}
          intent={tone(data.incidents.critical)}
        />
      </div>

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Pendências críticas
          </h3>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              label="Etapas bloqueadas"
              value={data.pendingCritical.blockedSteps}
            />
            <Tile
              label="Processos em atraso"
              value={data.pendingCritical.overdueProcesses}
            />
            <Tile
              label="Automações falhadas"
              value={data.pendingCritical.failedAutomations}
            />
            <Tile
              label="Jobs de fila falhados"
              value={data.pendingCritical.failedQueueJobs}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Últimas ocorrências
          </h3>
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

export function ModulesTab({ data }: { data: ModulesData }) {
  const c = data.summary.counts;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {(Object.keys(STATUS) as MonitoringStatus[]).map((s) => (
          <Tile
            key={s}
            label={STATUS[s].label}
            value={c[s]}
            intent={c[s] > 0 && s !== 'NORMAL' ? STATUS[s].intent : undefined}
          />
        ))}
      </div>
      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Módulo</th>
                  <th className="pr-3">Estado</th>
                  <th className="pr-3">Disponib.</th>
                  <th className="pr-3">Operações 24h</th>
                  <th className="pr-3">7d</th>
                  <th className="pr-3">Erros 24h</th>
                  <th className="pr-3">Latência</th>
                  <th>Dependências</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.modules.map((m) => (
                  <tr key={m.key} className="align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-ink">{m.module}</div>
                      <div className="text-xs text-ink-faint">{m.metric}</div>
                    </td>
                    <td className="pr-3">
                      <StatusBadge status={m.status} />
                      {m.reasons.map((r) => (
                        <div key={r} className="mt-1 text-xs text-ink-muted">
                          {r}
                        </div>
                      ))}
                    </td>
                    <td className="pr-3">{m.availability ? 'Sim' : 'Não'}</td>
                    <td className="pr-3 tabular-nums">
                      {m.operations.last24h ?? '—'}
                      {m.operations.previous24h !== null && (
                        <span className="ml-1 text-xs text-ink-faint">
                          (dia anterior {m.operations.previous24h})
                        </span>
                      )}
                    </td>
                    <td className="pr-3 tabular-nums">
                      {m.operations.last7d ?? '—'}
                    </td>
                    <td className="pr-3 tabular-nums">
                      {m.errors.tracked
                        ? `${m.errors.last24h ?? '—'}${
                            m.errors.ratePercent !== null
                              ? ` (${m.errors.ratePercent}%)`
                              : ''
                          }`
                        : 'n/d'}
                    </td>
                    <td className="pr-3 tabular-nums">
                      {m.latencyMs === null ? '—' : `${m.latencyMs} ms`}
                    </td>
                    <td>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-body text-xs text-ink-faint">
            n/d = o módulo não regista falhas de forma fiável, por isso não é
            apresentada taxa de erros.
          </p>
        </CardBody>
      </Card>
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
    <Card>
      <CardBody>
        <h3 className="mb-3 font-display text-base font-bold text-ink">
          {title}
        </h3>
        {rows.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">Nenhum.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left font-body text-sm">
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Em execução"
          value={s.running}
          sub={`${s.onHold} em pausa`}
        />
        <Tile
          label="Concluídos (30d)"
          value={s.completed30d}
          sub={`${s.cancelled30d} cancelados`}
        />
        <Tile
          label="Atrasados"
          value={s.overdue}
          sub={`${s.atRisk} em risco nas próximas 24h`}
          intent={tone(s.overdue, 'warning')}
        />
        <Tile
          label="Bloqueados"
          value={s.blocked}
          sub={`${s.blockedSteps} etapas bloqueadas`}
          intent={tone(s.blocked, 'warning')}
        />
        <Tile label="Etapas pendentes" value={s.pendingSteps} />
        <Tile
          label="SLA cumprido (30d)"
          value={pct(s.slaCompliancePercent)}
          sub="dos concluídos com prazo"
        />
        <Tile
          label="Tempo médio"
          value={
            s.avgCompletionHours === null ? null : `${s.avgCompletionHours} h`
          }
          sub="processos concluídos (30d)"
        />
        <Tile
          label="Taxa de conclusão"
          value={pct(s.completionRatePercent)}
          sub={`${s.started30d} iniciados (30d)`}
        />
        <Tile
          label="Falhas (30d)"
          value={s.failures.total30d}
          sub={`${s.failures.rejectedSteps30d} etapas rejeitadas · ${s.failures.integrationFailures30d} integrações`}
          intent={tone(s.failures.total30d, 'warning')}
        />
      </div>

      {data.overdueByResponsible.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 font-display text-base font-bold text-ink">
              Responsáveis com mais atrasos
            </h3>
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
