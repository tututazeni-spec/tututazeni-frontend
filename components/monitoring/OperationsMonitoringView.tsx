// modulo_monitoring.md §10-12 — vistas apresentacionais (Jobs, SLA & SLO,
// Histórico). Os dados chegam por props do container (app/(platform)/monitoring).

import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, Tile, tone } from './PlatformMonitoringView';
import type { Intent } from './PlatformMonitoringView';
import type {
  HistoryData,
  HistoryKind,
  JobRow,
  JobsData,
  JobState,
  SlaData,
  SlaState,
} from './slaJobsHistoryTypes';

const pct = (v: number | null) => (v === null ? null : `${v}%`);

const fmtMs = (ms: number | null) =>
  ms === null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;

const fmtMin = (m: number | null) => {
  if (m === null) return '—';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
};

const SLA_STATE: Record<SlaState, { label: string; intent: Intent }> = {
  CUMPRIDO: { label: 'Cumprido', intent: 'success' },
  EM_RISCO: { label: 'Em risco', intent: 'warning' },
  VIOLADO: { label: 'Violado', intent: 'danger' },
  SEM_DADOS: { label: 'Sem dados', intent: 'neutral' },
};

const SEVERITY: Record<string, Intent> = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'danger',
};

function SlaBadge({ state }: { state: SlaState }) {
  const s = SLA_STATE[state];
  return <Badge intent={s.intent}>{s.label}</Badge>;
}

// ── §10 Jobs & Background Tasks ──────────────────────────────────────────────

const JOB_TITLES: { key: keyof Pick<
  JobsData,
  'running' | 'failed' | 'scheduled' | 'waiting' | 'executed'
>; title: string; state: JobState }[] = [
  { key: 'failed', title: 'Jobs falhados', state: 'failed' },
  { key: 'running', title: 'Jobs em execução', state: 'active' },
  { key: 'scheduled', title: 'Jobs agendados', state: 'delayed' },
  { key: 'waiting', title: 'Jobs em espera', state: 'waiting' },
  { key: 'executed', title: 'Últimos jobs executados', state: 'completed' },
];

function JobTable({ title, rows, state }: { title: string; rows: JobRow[]; state: JobState }) {
  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 font-display text-base font-bold text-ink">{title}</h3>
        {rows.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">Nenhum.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Job</th>
                  <th className="pr-3">Fila</th>
                  <th className="pr-3">Tentativas</th>
                  <th className="pr-3">Duração</th>
                  <th className="pr-3">
                    {state === 'delayed' ? 'Próxima execução' : 'Quando'}
                  </th>
                  <th>Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((j) => {
                  const when =
                    state === 'delayed'
                      ? j.nextRunAt
                      : (j.finishedAt ?? j.startedAt ?? j.createdAt);
                  return (
                    <tr key={`${j.queue}-${j.id}`} className="align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-ink">{j.name}</div>
                        <div className="text-xs text-ink-faint">#{j.id}</div>
                      </td>
                      <td className="pr-3">{j.queue}</td>
                      <td className="pr-3 tabular-nums">
                        {j.attemptsMade}/{j.attemptsMax}
                        {j.retrying && (
                          <Badge intent="warning" dot={false}>
                            retry
                          </Badge>
                        )}
                      </td>
                      <td className="pr-3 tabular-nums">{fmtMs(j.durationMs)}</td>
                      <td className="pr-3 tabular-nums">{when ? fmtDate(when) : '—'}</td>
                      <td className="max-w-xs text-xs text-danger-ink">{j.error ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function JobsTab({ data }: { data: JobsData }) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Em execução" value={s.running} sub={`${s.waiting} em espera`} />
        <Tile
          label="Falhados"
          value={s.failed}
          sub={`${s.retrying} com retry`}
          intent={tone(s.failed)}
        />
        <Tile
          label="Agendados"
          value={s.scheduled}
          sub={s.nextExecutionAt ? `próximo ${fmtDate(s.nextExecutionAt)}` : 'sem agendamentos'}
        />
        <Tile
          label="Executados (retidos)"
          value={s.executed}
          sub={`sucesso ${s.successRatePercent === null ? '—' : `${s.successRatePercent}%`}`}
        />
        <Tile label="Duração média" value={fmtMs(s.avgDurationMs)} sub="jobs concluídos" />
        <Tile
          label="Cron jobs"
          value={s.cronJobs}
          sub={`${s.cronJobsStopped} parado(s)`}
          intent={tone(s.cronJobsStopped, 'warning')}
        />
        <Tile
          label="Automações"
          value={data.automations.running}
          sub={`${data.automations.pending} pendentes · ${data.automations.failed24h} falhadas (24h)`}
          intent={tone(data.automations.failed24h, 'warning')}
        />
        <Tile
          label="Filas inacessíveis"
          value={s.queuesUnavailable}
          intent={tone(s.queuesUnavailable, 'warning')}
        />
      </div>

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">Filas</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Fila</th>
                  <th className="pr-3">Activos</th>
                  <th className="pr-3">Em espera</th>
                  <th className="pr-3">Agendados</th>
                  <th className="pr-3">Falhados</th>
                  <th>Concluídos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.queues.map((q) => (
                  <tr key={q.key}>
                    <td className="py-2 pr-3 font-medium text-ink">
                      {q.key}
                      {!q.available && (
                        <Badge intent="danger" dot={false}>
                          inacessível
                        </Badge>
                      )}
                    </td>
                    <td className="pr-3 tabular-nums">{q.counts.active}</td>
                    <td className="pr-3 tabular-nums">{q.counts.waiting}</td>
                    <td className="pr-3 tabular-nums">{q.counts.delayed}</td>
                    <td className="pr-3 tabular-nums">{q.counts.failed}</td>
                    <td className="tabular-nums">{q.counts.completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {JOB_TITLES.map((t) => (
        <JobTable key={t.key} title={t.title} rows={data[t.key]} state={t.state} />
      ))}

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Cron jobs (esta instância)
          </h3>
          {data.crons.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">Sem cron jobs registados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left font-body text-sm">
                <thead className="text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2 pr-3">Nome</th>
                    <th className="pr-3">Estado</th>
                    <th className="pr-3">Última execução</th>
                    <th>Próxima execução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.crons.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2 pr-3 font-medium text-ink">{c.name}</td>
                      <td className="pr-3">
                        <Badge intent={c.running ? 'success' : 'warning'}>
                          {c.running ? 'Activo' : 'Parado'}
                        </Badge>
                      </td>
                      <td className="pr-3 tabular-nums">
                        {c.lastRunAt ? fmtDate(c.lastRunAt) : '—'}
                      </td>
                      <td className="tabular-nums">
                        {c.nextRunAt ? fmtDate(c.nextRunAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
      <p className="font-body text-xs text-ink-faint">{data.note}</p>
    </div>
  );
}

// ── §11 SLA & SLO ────────────────────────────────────────────────────────────

export function SlaTab({
  data,
  days,
  onDaysChange,
}: {
  data: SlaData;
  days: number;
  onDaysChange: (d: number) => void;
}) {
  const c = data.current;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 font-body text-sm">
        <span className="text-ink-muted">Janela:</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onDaysChange(d)}
            className={`rounded-md border px-3 py-1 ${
              d === days
                ? 'border-brand bg-brand-soft text-ink'
                : 'border-border text-ink-muted hover:bg-surface-muted'
            }`}
          >
            {d} dias
          </button>
        ))}
        <span className="ml-2 text-xs text-ink-faint">
          {data.sla.name}
          {!data.sla.configured && ' (por omissão — sem SLA configurado)'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Disponibilidade"
          value={`${c.availabilityPercent}%`}
          sub={`objectivo ${data.sla.uptimePercent}%`}
          intent={
            c.state === 'VIOLADO' ? 'danger' : c.state === 'EM_RISCO' ? 'warning' : undefined
          }
        />
        <Tile
          label="Indisponibilidade"
          value={fmtMin(c.downtimeMinutes)}
          sub={`permitido ${fmtMin(Math.round(c.allowedDowntimeMinutes))}`}
          intent={tone(c.downtimeMinutes, 'warning')}
        />
        <Tile
          label="Orçamento de erro usado"
          value={pct(c.errorBudgetUsedPercent)}
          sub={`restam ${fmtMin(Math.round(c.errorBudgetRemainingMinutes))}`}
        />
        <Tile
          label="Tempo médio de resolução"
          value={fmtMin(c.mttrMinutes)}
          sub={`${c.resolvedIncidents} incidente(s) resolvido(s)`}
        />
        <Tile
          label="Latência dentro do limite"
          value={pct(c.latencyCompliancePercent)}
          sub={`≤ ${data.sla.maxLatencyMs} ms`}
        />
        <Tile
          label="Erros dentro do limite"
          value={pct(c.errorCompliancePercent)}
          sub={`≤ ${data.sla.maxErrorRatePercent}%`}
        />
        <Tile
          label="Incidentes críticos"
          value={data.violations.criticalIncidents}
          intent={tone(data.violations.criticalIncidents)}
        />
        <Tile
          label="Respostas fora de prazo"
          value={data.violations.responseMissed}
          sub={`prazo ${data.sla.incidentResponseMinutes} min`}
          intent={tone(data.violations.responseMissed, 'warning')}
        />
      </div>

      {data.atRisk.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 font-display text-base font-bold text-ink">
              Serviços em risco
            </h3>
            <ul className="space-y-2 font-body text-sm">
              {data.atRisk.map((s) => (
                <li key={s.key} className="flex flex-wrap items-center gap-3">
                  <SlaBadge state={s.state} />
                  <span className="font-medium text-ink">{s.label}</span>
                  <span className="text-ink-muted">{s.detail}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Cumprimento por serviço
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Serviço</th>
                  <th className="pr-3">Estado</th>
                  <th className="pr-3">Actual</th>
                  <th className="pr-3">Objectivo</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.services.map((s) => (
                  <tr key={s.key} className="align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-ink">{s.label}</div>
                      <div className="text-xs text-ink-faint">{s.metric}</div>
                    </td>
                    <td className="pr-3">
                      <SlaBadge state={s.state} />
                    </td>
                    <td className="pr-3 tabular-nums">{pct(s.actual) ?? '—'}</td>
                    <td className="pr-3 tabular-nums">
                      {s.target}%
                      <span className="ml-1 text-xs text-ink-faint">
                        ({s.targetSource === 'SLA' ? 'SLA' : 'interno'})
                      </span>
                    </td>
                    <td className="text-xs text-ink-muted">{s.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Indisponibilidade por componente
          </h3>
          {data.components.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">
              Sem incidentes críticos na janela.
            </p>
          ) : (
            <ul className="divide-y divide-border font-body text-sm">
              {data.components.map((x) => (
                <li key={x.component} className="flex justify-between gap-3 py-2">
                  <span className="text-ink">{x.component}</span>
                  <span className="tabular-nums text-ink-muted">
                    {x.incidents} incidente(s) · {fmtMin(x.downtimeMinutes)} ·{' '}
                    {x.availabilityPercent}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Violações de SLA
          </h3>
          {data.violations.slaAlerts.length === 0 ? (
            <EmptyState
              title="Sem violações registadas"
              description="Nenhum alerta de SLA na janela seleccionada."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.violations.slaAlerts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center gap-3 py-2 font-body text-sm"
                >
                  <span className="w-28 shrink-0 tabular-nums text-ink-muted">
                    {fmtDate(a.at)}
                  </span>
                  <Badge intent={SEVERITY[a.severity] ?? 'neutral'}>{a.severity}</Badge>
                  <span className="min-w-0 flex-1 text-ink">
                    {a.title}
                    <span className="block text-xs text-ink-muted">{a.message}</span>
                  </span>
                  <span className="text-xs text-ink-faint">
                    {a.resolved ? 'resolvido' : 'por resolver'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <p className="font-body text-xs text-ink-faint">{data.note}</p>
    </div>
  );
}

// ── §12 Histórico de Monitorização ───────────────────────────────────────────

const KIND_LABEL: Record<HistoryKind, string> = {
  ALERTA: 'Alertas',
  INCIDENTE: 'Incidentes',
  AUTOMACAO: 'Automações',
  INTEGRACAO: 'Integrações',
};

export function HistoryTab({
  data,
  days,
  kind,
  onDaysChange,
  onKindChange,
}: {
  data: HistoryData;
  days: number;
  kind: HistoryKind | null;
  onDaysChange: (d: number) => void;
  onKindChange: (k: HistoryKind | null) => void;
}) {
  const chip = (active: boolean) =>
    `rounded-md border px-3 py-1 ${
      active
        ? 'border-brand bg-brand-soft text-ink'
        : 'border-border text-ink-muted hover:bg-surface-muted'
    }`;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 font-body text-sm">
        <span className="text-ink-muted">Janela:</span>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            type="button"
            className={chip(d === days)}
            onClick={() => onDaysChange(d)}
          >
            {d} dias
          </button>
        ))}
        <span className="ml-3 text-ink-muted">Tipo:</span>
        <button type="button" className={chip(kind === null)} onClick={() => onKindChange(null)}>
          Todos
        </button>
        {(Object.keys(KIND_LABEL) as HistoryKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={chip(kind === k)}
            onClick={() => onKindChange(k)}
          >
            {KIND_LABEL[k]}
            {data.summary.byKind[k] !== undefined && ` (${data.summary.byKind[k]})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Ocorrências" value={data.summary.events} sub={`últimos ${data.windowDays} dias`} />
        <Tile
          label="Críticas"
          value={data.summary.critical}
          intent={tone(data.summary.critical)}
        />
        <Tile
          label="Retenção"
          value={`${data.retention.retentionDays} d`}
          sub={`horárias ${data.retention.hourlyRetentionDays} d`}
        />
        <Tile
          label="Mais antigo (horário)"
          value={data.retention.oldestHourlyAt ? fmtDate(data.retention.oldestHourlyAt) : null}
          sub={`${data.retention.hourlyRows} linhas horárias`}
        />
      </div>

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Linha do tempo
          </h3>
          {data.events.length === 0 ? (
            <EmptyState
              title="Sem ocorrências"
              description="Nada registado na janela seleccionada."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.events.map((e, i) => (
                <li
                  key={`${e.at}-${e.ref}-${i}`}
                  className="flex flex-wrap items-center gap-3 py-2 font-body text-sm"
                >
                  <span className="w-28 shrink-0 tabular-nums text-ink-muted">
                    {fmtDate(e.at)}
                  </span>
                  <Badge intent={SEVERITY[e.severity] ?? 'neutral'}>{e.kind}</Badge>
                  <span className="min-w-0 flex-1 text-ink">
                    <span className="text-ink-muted">{e.event}: </span>
                    {e.title}
                  </span>
                  <span className="text-xs text-ink-faint">{e.source}</span>
                </li>
              ))}
            </ul>
          )}
          {data.truncated && (
            <p className="mt-2 font-body text-xs text-ink-faint">
              Lista limitada às ocorrências mais recentes; reduz a janela ou filtra por tipo.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="mb-3 font-display text-base font-bold text-ink">
            Plataforma por dia
          </h3>
          {data.platform.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">Sem métricas na janela.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left font-body text-sm">
                <thead className="text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2 pr-3">Dia</th>
                    <th className="pr-3">Latência média</th>
                    <th className="pr-3">P95 máx.</th>
                    <th className="pr-3">Erros</th>
                    <th className="pr-3">CPU máx.</th>
                    <th className="pr-3">Memória máx.</th>
                    <th>Pedidos/min máx.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...data.platform].reverse().map((d) => (
                    <tr key={d.day}>
                      <td className="py-2 pr-3 tabular-nums">{d.day}</td>
                      <td className="pr-3 tabular-nums">{fmtMs(d.avgLatencyMs)}</td>
                      <td className="pr-3 tabular-nums">{fmtMs(d.maxP95Ms)}</td>
                      <td className="pr-3 tabular-nums">
                        {d.avgErrorRatePercent === null ? '—' : `${d.avgErrorRatePercent}%`}
                      </td>
                      <td className="pr-3 tabular-nums">{d.maxCpuPercent}%</td>
                      <td className="pr-3 tabular-nums">{d.maxMemoryPercent}%</td>
                      <td className="tabular-nums">{d.maxRequestsPerMinute}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {data.queues.length > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 font-display text-base font-bold text-ink">
              Filas por dia (picos)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left font-body text-sm">
                <thead className="text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2 pr-3">Dia</th>
                    <th className="pr-3">Fila</th>
                    <th className="pr-3">Pendentes (máx.)</th>
                    <th>Falhados (máx.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...data.queues].reverse().map((q) => (
                    <tr key={`${q.day}-${q.queue}`}>
                      <td className="py-2 pr-3 tabular-nums">{q.day}</td>
                      <td className="pr-3">{q.queue}</td>
                      <td className="pr-3 tabular-nums">{q.maxPending}</td>
                      <td className="tabular-nums">{q.maxFailed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
      <p className="font-body text-xs text-ink-faint">{data.note}</p>
    </div>
  );
}
