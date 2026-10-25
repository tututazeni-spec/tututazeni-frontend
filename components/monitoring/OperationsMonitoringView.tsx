// modulo_monitoring.md §10-12 — vistas apresentacionais (Jobs, SLA & SLO,
// Histórico). Os dados chegam por props do container (app/(platform)/monitoring).

import {
  CalendarClock,
  AlarmClock,
  Archive,
  History,
  Bell,
  Flame,
  List,
  Plug,
  type LucideIcon,
  CalendarDays,
  CheckCircle2,
  Clock,
  Siren,
  Hourglass,
  PlayCircle,
  Timer,
  WifiOff,
  XCircle,
  Zap,
} from 'lucide-react';
import { CompactTabs, type CompactTabItem } from './CompactTabs';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  INVERSE_RATE_BANDS,
  RATE_BANDS,
  SpeedometerStatCard,
} from '@/components/ui/charts/SpeedometerStatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate } from './PlatformMonitoringView';
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

// Nomes legíveis das filas Bull (chaves técnicas vindas do backend).
const QUEUE_LABEL: Record<string, string> = {
  audit: 'Auditoria',
  email: 'Email',
  notifications: 'Notificações',
  webhooks: 'Webhooks',
};
const queueLabel = (key: string) => QUEUE_LABEL[key] ?? key;

const JOB_TITLES: {
  key: keyof Pick<
    JobsData,
    'running' | 'failed' | 'scheduled' | 'waiting' | 'executed'
  >;
  title: string;
  state: JobState;
}[] = [
  { key: 'failed', title: 'Tarefas falhadas', state: 'failed' },
  { key: 'running', title: 'Tarefas em execução', state: 'active' },
  { key: 'scheduled', title: 'Tarefas agendadas', state: 'delayed' },
  { key: 'waiting', title: 'Tarefas em espera', state: 'waiting' },
  { key: 'executed', title: 'Últimas tarefas executadas', state: 'completed' },
];

interface JobTableProps {
  title: string;
  rows: JobRow[];
  state: JobState;
}

function JobTable({ title, rows, state }: JobTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
        {title}
      </div>
      <CardBody>
        {rows.length === 0 ? (
          <EmptyState variant="inline" title="Nenhum" />
        ) : (
          <div className="w-full">
            <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Tarefa</th>
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
                      <td className="pr-3">{queueLabel(j.queue)}</td>
                      <td className="pr-3 tabular-nums">
                        {j.attemptsMade}/{j.attemptsMax}
                        {j.retrying && (
                          <Badge intent="warning" dot={false}>
                            nova tentativa
                          </Badge>
                        )}
                      </td>
                      <td className="pr-3 tabular-nums">
                        {fmtMs(j.durationMs)}
                      </td>
                      <td className="pr-3 tabular-nums">
                        {when ? fmtDate(when) : '—'}
                      </td>
                      <td className="max-w-xs text-xs text-danger-ink">
                        {j.error ?? ''}
                      </td>
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

const DAYS_ITEMS: CompactTabItem<number>[] = [7, 30, 90].map((d) => ({
  value: d,
  label: `${d} dias`,
  icon: CalendarDays,
}));

export function JobsTab({ data }: { data: JobsData }) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={PlayCircle}
          label="Em execução"
          value={s.running}
          sub={`${s.waiting} em espera`}
          tone="blue"
        />
        <NavyStatCard
          icon={XCircle}
          label="Falhados"
          value={s.failed}
          sub={`${s.retrying} com nova tentativa`}
          tone="red"
        />
        <NavyStatCard
          tab="jobs"
          icon={CalendarClock}
          label="Agendados"
          value={s.scheduled}
          sub={
            s.nextExecutionAt
              ? `próximo ${fmtDate(s.nextExecutionAt)}`
              : 'sem agendamentos'
          }
          tone="blue"
        />
        <NavyStatCard
          icon={CheckCircle2}
          label="Executados (retidos)"
          value={s.executed}
          sub={`sucesso ${s.successRatePercent === null ? '—' : `${s.successRatePercent}%`}`}
          tone="green"
        />
        <NavyStatCard
          icon={Hourglass}
          label="Duração média"
          value={fmtMs(s.avgDurationMs)}
          sub="tarefas concluídas"
          tone="blue"
        />
        <NavyStatCard
          tab="jobs"
          icon={Timer}
          label="Tarefas periódicas"
          value={s.cronJobs}
          sub={`${s.cronJobsStopped} parado(s)`}
          tone="orange"
        />
        <NavyStatCard
          tab="automations"
          icon={Zap}
          label="Automações"
          value={data.automations.running}
          sub={`${data.automations.pending} pendentes · ${data.automations.failed24h} falhadas (24h)`}
          tone="blue"
        />
        <NavyStatCard
          icon={WifiOff}
          label="Filas inacessíveis"
          value={s.queuesUnavailable}
          tone="orange"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Filas
        </div>
        <CardBody>
          <div className="w-full">
            <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
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
                      {queueLabel(q.key)}
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
        <JobTable
          key={t.key}
          title={t.title}
          rows={data[t.key]}
          state={t.state}
        />
      ))}

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Tarefas periódicas (esta instância)
        </div>
        <CardBody>
          {data.crons.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Sem tarefas periódicas registadas"
            />
          ) : (
            <div className="w-full">
              <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
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
                      <td className="py-2 pr-3 font-medium text-ink">
                        {c.name}
                      </td>
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

export interface SlaTabProps {
  data: SlaData;
  days: number;
  onDaysChange: (d: number) => void;
}

export function SlaTab({ data, days, onDaysChange }: SlaTabProps) {
  const c = data.current;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-body text-sm text-ink-muted">Janela:</span>
        <CompactTabs items={DAYS_ITEMS} value={days} onChange={onDaysChange} />
        <span className="font-body text-xs text-ink-faint">
          {data.sla.name}
          {!data.sla.configured && ' (por omissão — sem SLA configurado)'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SpeedometerStatCard
          label="Disponibilidade"
          value={c.availabilityPercent}
          bands={RATE_BANDS}
          display={`${c.availabilityPercent}%`}
          caption={`objectivo ${data.sla.uptimePercent}%`}
        />
        <SpeedometerStatCard
          label="Orçamento de erro usado"
          value={Math.min(100, c.errorBudgetUsedPercent ?? 0)}
          bands={INVERSE_RATE_BANDS}
          display={pct(c.errorBudgetUsedPercent) ?? '—'}
          caption={`restam ${fmtMin(Math.round(c.errorBudgetRemainingMinutes))}`}
        />
        <SpeedometerStatCard
          label="Latência dentro do limite"
          value={c.latencyCompliancePercent ?? 0}
          bands={RATE_BANDS}
          display={pct(c.latencyCompliancePercent) ?? '—'}
          caption={`≤ ${data.sla.maxLatencyMs} ms`}
        />
        <SpeedometerStatCard
          label="Erros dentro do limite"
          value={c.errorCompliancePercent ?? 0}
          bands={RATE_BANDS}
          display={pct(c.errorCompliancePercent) ?? '—'}
          caption={`≤ ${data.sla.maxErrorRatePercent}%`}
        />
        <NavyStatCard
          icon={Clock}
          label="Indisponibilidade"
          value={fmtMin(c.downtimeMinutes)}
          sub={`permitido ${fmtMin(Math.round(c.allowedDowntimeMinutes))}`}
          tone="orange"
        />
        <NavyStatCard
          icon={Timer}
          label="Tempo médio de resolução"
          value={fmtMin(c.mttrMinutes)}
          sub={`${c.resolvedIncidents} incidente(s) resolvido(s)`}
          tone="blue"
        />
        <NavyStatCard
          tab="incidents"
          icon={Siren}
          label="Incidentes críticos"
          value={data.violations.criticalIncidents}
          tone="red"
        />
        <NavyStatCard
          icon={AlarmClock}
          label="Respostas fora de prazo"
          value={data.violations.responseMissed}
          sub={`prazo ${data.sla.incidentResponseMinutes} min`}
          tone="orange"
        />
      </div>

      {data.atRisk.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
            Serviços em risco
          </div>
          <CardBody>
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

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Cumprimento por serviço
        </div>
        <CardBody>
          <div className="w-full">
            <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
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
                    <td className="pr-3 tabular-nums">
                      {pct(s.actual) ?? '—'}
                    </td>
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

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Indisponibilidade por componente
        </div>
        <CardBody>
          {data.components.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Sem incidentes críticos na janela"
            />
          ) : (
            <ul className="divide-y divide-border font-body text-sm">
              {data.components.map((x) => (
                <li
                  key={x.component}
                  className="flex justify-between gap-3 py-2"
                >
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

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Violações de SLA
        </div>
        <CardBody>
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
                  <Badge intent={SEVERITY[a.severity] ?? 'neutral'}>
                    {a.severity}
                  </Badge>
                  <span className="min-w-0 flex-1 text-ink">
                    {a.title}
                    <span className="block text-xs text-ink-muted">
                      {a.message}
                    </span>
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

const KIND_ICON: Record<HistoryKind, LucideIcon> = {
  ALERTA: Bell,
  INCIDENTE: Flame,
  AUTOMACAO: Zap,
  INTEGRACAO: Plug,
};

export interface HistoryTabProps {
  data: HistoryData;
  days: number;
  kind: HistoryKind | null;
  onDaysChange: (d: number) => void;
  onKindChange: (k: HistoryKind | null) => void;
}

export function HistoryTab({
  data,
  days,
  kind,
  onDaysChange,
  onKindChange,
}: HistoryTabProps) {
  const kindItems: CompactTabItem<HistoryKind | null>[] = [
    { value: null, label: 'Todos', icon: List },
    ...(Object.keys(KIND_LABEL) as HistoryKind[]).map((k) => ({
      value: k,
      label: KIND_LABEL[k],
      icon: KIND_ICON[k],
      count: data.summary.byKind[k],
    })),
  ];
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-sm text-ink-muted">Janela:</span>
          <CompactTabs
            items={DAYS_ITEMS}
            value={days}
            onChange={onDaysChange}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-sm text-ink-muted">Tipo:</span>
          <CompactTabs items={kindItems} value={kind} onChange={onKindChange} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={History}
          label="Ocorrências"
          value={data.summary.events}
          sub={`últimos ${data.windowDays} dias`}
          tone="blue"
        />
        <NavyStatCard
          icon={Siren}
          label="Críticas"
          value={data.summary.critical}
          tone="red"
        />
        <NavyStatCard
          icon={Archive}
          label="Retenção"
          value={`${data.retention.retentionDays} d`}
          sub={`horárias ${data.retention.hourlyRetentionDays} d`}
          tone="green"
        />
        <NavyStatCard
          icon={CalendarClock}
          label="Mais antigo (horário)"
          value={
            data.retention.oldestHourlyAt
              ? fmtDate(data.retention.oldestHourlyAt)
              : '—'
          }
          sub={`${data.retention.hourlyRows} linhas horárias`}
          tone="orange"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Linha do tempo
        </div>
        <CardBody>
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
                  <Badge intent={SEVERITY[e.severity] ?? 'neutral'}>
                    {e.kind}
                  </Badge>
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
              Lista limitada às ocorrências mais recentes; reduz a janela ou
              filtra por tipo.
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Plataforma por dia
        </div>
        <CardBody>
          {data.platform.length === 0 ? (
            <EmptyState variant="inline" title="Sem métricas na janela" />
          ) : (
            <div className="w-full">
              <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
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
                      <td className="pr-3 tabular-nums">
                        {fmtMs(d.avgLatencyMs)}
                      </td>
                      <td className="pr-3 tabular-nums">{fmtMs(d.maxP95Ms)}</td>
                      <td className="pr-3 tabular-nums">
                        {d.avgErrorRatePercent === null
                          ? '—'
                          : `${d.avgErrorRatePercent}%`}
                      </td>
                      <td className="pr-3 tabular-nums">{d.maxCpuPercent}%</td>
                      <td className="pr-3 tabular-nums">
                        {d.maxMemoryPercent}%
                      </td>
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
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
            Filas por dia (picos)
          </div>
          <CardBody>
            <div className="w-full">
              <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
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
