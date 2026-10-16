// modulo_monitoring.md §4-6 — vistas apresentacionais (Automações, Integrações,
// Performance). Os dados chegam por props do container (app/(platform)/monitoring).

import {
  Activity,
  Cpu,
  Gauge,
  HardDrive,
  ListTodo,
  Lock,
  MemoryStick,
  Network,
  Snail,
  TrendingUp,
  XCircle,
  CalendarClock,
  CalendarX,
  Database,
  Timer,
  WifiOff,
  Plug,
  Hourglass,
  PlayCircle,
  RefreshCw,
  Skull,
  Zap,
} from 'lucide-react';
import { ThermometerStatCard } from '@/components/ui/charts/ThermometerStatCard';
import { INVERSE_RATE_BANDS } from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { StatusHeroCard } from './StatusHeroCard';
import { NavyStatCard, type NavyStatTone } from '@/components/ui/NavyStatCard';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, STATUS, StatusBadge, tone } from './PlatformMonitoringView';
import type { Intent } from './PlatformMonitoringView';
import type {
  AutomationsData,
  EndpointRow,
  IntegrationsData,
  PerformanceData,
} from './coreMonitoringTypes';
import type { MonitoringStatus } from './platformTypes';

const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? null : `${v}%`;

const fmtMs = (ms: number | null | undefined) =>
  ms === null || ms === undefined
    ? '—'
    : ms >= 1000
      ? `${(ms / 1000).toFixed(1)} s`
      : `${Math.round(ms)} ms`;

const EXEC_INTENT: Record<string, Intent> = {
  SUCCESS: 'success',
  FAILED: 'danger',
  RUNNING: 'info',
  PENDING: 'warning',
  WAITING_APPROVAL: 'warning',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
        {title}
      </div>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// ── §4 Automações ────────────────────────────────────────────────────────────

export function AutomationsTab({ data }: { data: AutomationsData }) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={Zap}
          label="Execuções (24h)"
          value={s.executed24h}
          sub={`${s.activeRules} regras activas`}
          tone="blue"
        />
        <DonutStatCard
          label="Taxa de sucesso"
          value={s.successRatePercent ?? 0}
          sub={`${s.success24h} sucesso · ${s.failed24h} falhas`}
          color="#218653"
        />
        <NavyStatCard
          icon={PlayCircle}
          label="Em execução"
          value={s.running}
          sub={`${s.pending} pendentes · ${s.waitingFlows} fluxos em espera`}
          tone="blue"
        />
        <NavyStatCard
          icon={RefreshCw}
          label="Novas tentativas (24h)"
          value={s.retries24h}
          sub={`${s.retriesScheduled} agendados`}
          tone="orange"
        />
        <NavyStatCard
          icon={Hourglass}
          label="Tempo médio"
          value={fmtMs(s.avgExecutionMs)}
          sub="execuções terminadas"
          tone="blue"
        />
        <NavyStatCard
          icon={Skull}
          label="Falhas irrecuperáveis abertas"
          value={s.deadLettersOpen}
          tone="red"
        />
        <NavyStatCard
          icon={CalendarX}
          label="Agendamentos com erro"
          value={s.schedulesInError}
          tone="orange"
        />
        <NavyStatCard
          icon={CalendarClock}
          label="Próxima execução"
          value={s.nextExecutionAt ? fmtDate(s.nextExecutionAt) : '—'}
          sub={
            s.lastExecutionAt
              ? `última ${fmtDate(s.lastExecutionAt)}`
              : 'sem execuções'
          }
          tone="blue"
        />
      </div>

      {data.failuresByRule.length > 0 && (
        <Section title="Regras com mais falhas (24h)">
          <ul className="divide-y divide-border font-body text-sm">
            {data.failuresByRule.map((r) => (
              <li key={r.ruleId} className="flex justify-between gap-3 py-2">
                <span className="text-ink">
                  {r.name ?? `Regra #${r.ruleId}`}
                </span>
                <span className="tabular-nums text-ink-muted">
                  {r.failed24h} falha(s)
                  {r.lastRunAt && ` · última ${fmtDate(r.lastRunAt)}`}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Erros recentes">
        {data.errors.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">
            Sem falhas nas últimas 24 horas.
          </p>
        ) : (
          <div className="w-full">
            <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Quando</th>
                  <th className="pr-3">Regra</th>
                  <th className="pr-3">Tentativa</th>
                  <th className="pr-3">Próxima tentativa</th>
                  <th>Erro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.errors.map((e) => (
                  <tr key={e.executionId} className="align-top">
                    <td className="py-2 pr-3 tabular-nums">{fmtDate(e.at)}</td>
                    <td className="pr-3">
                      <div className="font-medium text-ink">{e.rule}</div>
                      {e.module && (
                        <div className="text-xs text-ink-faint">{e.module}</div>
                      )}
                    </td>
                    <td className="pr-3 tabular-nums">{e.attempt}</td>
                    <td className="pr-3 tabular-nums">
                      {e.nextRetryAt ? fmtDate(e.nextRetryAt) : '—'}
                    </td>
                    <td className="max-w-sm text-xs text-danger-ink">
                      {[e.errorCode, e.errorStep, e.message]
                        .filter(Boolean)
                        .join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Próximas execuções agendadas">
        {data.upcoming.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">
            Sem agendamentos activos.
          </p>
        ) : (
          <ul className="divide-y divide-border font-body text-sm">
            {data.upcoming.map((u) => (
              <li
                key={u.scheduleId}
                className="flex flex-wrap justify-between gap-3 py-2"
              >
                <span className="text-ink">
                  {u.name}
                  <span className="ml-2 text-xs text-ink-faint">{u.rule}</span>
                </span>
                <span className="tabular-nums text-ink-muted">
                  {u.nextRunAt ? fmtDate(u.nextRunAt) : '—'}
                  {u.lastRunStatus && ` · última: ${u.lastRunStatus}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Últimas execuções">
        <div className="w-full">
          <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
            <thead className="text-xs uppercase text-ink-muted">
              <tr>
                <th className="py-2 pr-3">Início</th>
                <th className="pr-3">Regra</th>
                <th className="pr-3">Estado</th>
                <th className="pr-3">Duração</th>
                <th>Etapa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.history.map((h) => (
                <tr key={h.executionId}>
                  <td className="py-2 pr-3 tabular-nums">
                    {fmtDate(h.startedAt)}
                  </td>
                  <td className="pr-3 text-ink">{h.rule}</td>
                  <td className="pr-3">
                    <Badge intent={EXEC_INTENT[h.status] ?? 'neutral'}>
                      {h.status}
                    </Badge>
                  </td>
                  <td className="pr-3 tabular-nums">{fmtMs(h.durationMs)}</td>
                  <td className="text-xs text-ink-muted">
                    {h.currentStep ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {data.daily.length > 0 && (
        <Section title="Sucesso vs falha por dia (7d)">
          <ul className="divide-y divide-border font-body text-sm">
            {[...data.daily].reverse().map((d) => (
              <li key={d.day} className="flex justify-between gap-3 py-2">
                <span className="tabular-nums text-ink">{d.day}</span>
                <span className="tabular-nums text-ink-muted">
                  {d.success} sucesso · {d.failed} falha ·{' '}
                  {d.successRatePercent}%
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

// ── §5 Integrações ───────────────────────────────────────────────────────────

function QueueLine({
  label,
  q,
}: {
  label: string;
  q: {
    waiting: number;
    active: number;
    failed: number;
    delayed: number;
  } | null;
}) {
  return (
    <span>
      {label}:{' '}
      {q
        ? `${q.waiting} em fila · ${q.active} activos · ${q.failed} falhados`
        : 'fila indisponível'}
    </span>
  );
}

export function IntegrationsTab({ data }: { data: IntegrationsData }) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <StatusHeroCard
        icon={Plug}
        title="Estado das integrações"
        headline="Integrações com sistemas externos"
        status={s.overall}
        percent={s.total > 0 ? (s.active / s.total) * 100 : 0}
        ringLabel={`${s.active} de ${s.total} integrações activas`}
        stats={[
          { label: 'Activas', value: `${s.active} / ${s.total}` },
          {
            label: 'SSO',
            value: data.sso
              ? data.sso.enabled
                ? (data.sso.provider ?? 'Activo')
                : 'Desligado'
              : '—',
          },
          { label: 'Tempo de resposta', value: fmtMs(s.avgResponseMs) },
        ]}
        info={
          s.unavailable > 0 || s.stale > 0
            ? `${s.unavailable} indisponíveis · ${s.stale} sem sincronização recente.`
            : 'Todas as integrações estão disponíveis e sincronizadas.'
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <NavyStatCard
          icon={WifiOff}
          label="Indisponíveis"
          value={s.unavailable}
          sub={`${s.stale} sem sincronização recente`}
          tone="red"
        />
        <NavyStatCard
          icon={RefreshCw}
          label="Sincronizações (24h)"
          value={s.syncs24h}
          sub={`${s.failures24h} falhas`}
          tone="blue"
        />
        <NavyStatCard
          icon={Database}
          label="Registos processados (24h)"
          value={s.recordsProcessed24h}
          sub={`${s.recordsFailed24h} com falha`}
          tone="green"
        />
        <NavyStatCard
          icon={Timer}
          label="Tempo de resposta"
          value={fmtMs(s.avgResponseMs)}
          tone="blue"
        />
      </div>

      <Section title="Por família">
        <div className="w-full">
          <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
            <thead className="text-xs uppercase text-ink-muted">
              <tr>
                <th className="py-2 pr-3">Família</th>
                <th className="pr-3">Estado</th>
                <th className="pr-3">Activas / total</th>
                <th className="pr-3">Indisponíveis</th>
                <th className="pr-3">Falhas 24h</th>
                <th>Resposta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.families.map((f) => (
                <tr key={f.family}>
                  <td className="py-2 pr-3 font-medium text-ink">{f.label}</td>
                  <td className="pr-3">
                    {f.active > 0 ? (
                      <StatusBadge status={f.status} />
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="pr-3 tabular-nums">
                    {f.active} / {f.total}
                  </td>
                  <td className="pr-3 tabular-nums">{f.unavailable}</td>
                  <td className="pr-3 tabular-nums">{f.failures24h}</td>
                  <td className="tabular-nums">{fmtMs(f.avgResponseMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-1 font-body text-xs text-ink-muted">
          <div>
            <QueueLine label="Email" q={data.email.queue} /> ·{' '}
            {data.email.connections} ligação(ões), {data.email.lastTestFailed}{' '}
            com último teste falhado
          </div>
          <div>
            <QueueLine label="Webhooks" q={data.webhooks.queue} /> ·{' '}
            {data.webhooks.configured} configurados,{' '}
            {data.webhooks.lastTestFailed} com último teste falhado
          </div>
        </div>
      </Section>

      <Section title="Integrações">
        {data.integrations.length === 0 ? (
          <EmptyState
            title="Sem integrações"
            description="Ainda não há integrações configuradas."
          />
        ) : (
          <div className="w-full">
            <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Integração</th>
                  <th className="pr-3">Estado</th>
                  <th className="pr-3">Ligação</th>
                  <th className="pr-3">Última sync</th>
                  <th className="pr-3">Sync 24h</th>
                  <th className="pr-3">Falhas 24h</th>
                  <th className="pr-3">Registos</th>
                  <th>Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.integrations.map((i) => (
                  <tr key={i.id} className="align-top">
                    <td className="py-2 pr-3">
                      <div className="font-medium text-ink">{i.name}</div>
                      <div className="text-xs text-ink-faint">
                        {i.familyLabel} · {i.type}
                      </div>
                    </td>
                    <td className="pr-3">
                      {i.active ? (
                        <StatusBadge status={i.status} />
                      ) : (
                        <Badge intent="neutral">Inactiva</Badge>
                      )}
                      {i.reasons.map((r) => (
                        <div key={r} className="mt-1 text-xs text-ink-muted">
                          {r}
                        </div>
                      ))}
                    </td>
                    <td className="pr-3">{i.connectionState}</td>
                    <td className="pr-3 tabular-nums">
                      {i.lastSyncAt ? fmtDate(i.lastSyncAt) : '—'}
                      {i.lastSyncStatus && (
                        <div className="text-xs text-ink-faint">
                          {i.lastSyncStatus}
                        </div>
                      )}
                    </td>
                    <td className="pr-3 tabular-nums">{i.syncs24h}</td>
                    <td className="pr-3 tabular-nums">{i.failures24h}</td>
                    <td className="pr-3 tabular-nums">
                      {i.recordsProcessed24h}
                      {i.recordsFailed24h > 0 && (
                        <span className="text-danger-ink">
                          {' '}
                          (−{i.recordsFailed24h})
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums">{fmtMs(i.avgResponseMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Falhas recentes (24h)">
        {data.failures.length === 0 ? (
          <p className="font-body text-sm text-ink-muted">Sem falhas.</p>
        ) : (
          <ul className="divide-y divide-border font-body text-sm">
            {data.failures.map((f) => (
              <li key={f.id} className="flex flex-wrap gap-3 py-2">
                <span className="w-28 shrink-0 tabular-nums text-ink-muted">
                  {fmtDate(f.at)}
                </span>
                <span className="font-medium text-ink">{f.integration}</span>
                <span className="min-w-0 flex-1 text-xs text-danger-ink">
                  {f.message ?? f.status}
                </span>
                <span className="text-xs text-ink-faint">
                  {f.recordsFailed} registo(s)
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

// ── §6 Performance ───────────────────────────────────────────────────────────

const statusIntent = (s: MonitoringStatus | null | undefined) =>
  s ? STATUS[s].intent : undefined;
const navyTone = (i: Intent | undefined, base: NavyStatTone): NavyStatTone =>
  i === 'danger' ? 'red' : i === 'warning' ? 'orange' : base;
const tileIntent = (s: MonitoringStatus | null | undefined) => {
  const i = statusIntent(s);
  return i === 'danger' || i === 'warning' ? i : undefined;
};

function EndpointTable({
  title,
  rows,
}: {
  title: string;
  rows: EndpointRow[];
}) {
  return (
    <Section title={title}>
      {rows.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">Nenhum.</p>
      ) : (
        <div className="w-full">
          <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
            <thead className="text-xs uppercase text-ink-muted">
              <tr>
                <th className="py-2 pr-3">Endpoint</th>
                <th className="pr-3">Pedidos</th>
                <th className="pr-3">Média</th>
                <th className="pr-3">P95</th>
                <th className="pr-3">Erros</th>
                <th>5xx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((e) => (
                <tr key={e.endpoint}>
                  <td className="py-2 pr-3 font-mono text-xs text-ink">
                    {e.endpoint}
                  </td>
                  <td className="pr-3 tabular-nums">{e.requests}</td>
                  <td className="pr-3 tabular-nums">{fmtMs(e.avgMs)}</td>
                  <td className="pr-3 tabular-nums">{fmtMs(e.p95Ms)}</td>
                  <td className="pr-3 tabular-nums">{e.errorRate}%</td>
                  <td className="tabular-nums">{e.errors5xx}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export function PerformanceTab({ data }: { data: PerformanceData }) {
  const { api, system, database: db, queues, storage } = data;
  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3 font-body text-sm">
            <h2 className="font-display text-lg font-bold text-ink">
              Performance geral
            </h2>
            <StatusBadge status={data.overall.status} />
            {data.overall.unavailableSources.length > 0 && (
              <span className="text-ink-muted">
                Sem dados: {data.overall.unavailableSources.join(', ')}
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      <Section title="API">
        {api.available ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NavyStatCard
              icon={Activity}
              label="Latência média"
              value={fmtMs(api.avgLatencyMs)}
              sub={`P95 ${fmtMs(api.p95Ms)} · P99 ${fmtMs(api.p99Ms)}`}
              tone={navyTone(tileIntent(api.status), 'blue')}
            />
            <ThermometerStatCard
              label="Taxa de erros"
              value={api.errorRatePercent ?? 0}
              bands={INVERSE_RATE_BANDS}
              display={pct(api.errorRatePercent) ?? '—'}
              caption={`${api.http4xx} × 4xx · ${api.http5xx} × 5xx`}
            />
            <NavyStatCard
              icon={Network}
              label="Pedidos"
              value={api.requests}
              sub={
                api.requestsPerMinute === null
                  ? undefined
                  : `${api.requestsPerMinute}/min`
              }
              tone="blue"
            />
            <NavyStatCard
              icon={Snail}
              label="Lentos / timeouts"
              value={api.slowRequests}
              sub={`> ${api.slowThresholdMs} ms · ${api.timeouts} timeouts`}
              tone={navyTone(tone(api.timeouts, 'warning'), 'orange')}
            />
          </div>
        ) : (
          <p className="font-body text-sm text-ink-muted">Sem dados da API.</p>
        )}
      </Section>

      <Section title="Servidor e base de dados">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <NavyStatCard
            icon={Cpu}
            label="CPU"
            value={pct(system.cpuPercent) ?? '—'}
            sub={system.stale ? 'amostra desactualizada' : undefined}
            tone={navyTone(tileIntent(system.status), 'blue')}
          />
          <NavyStatCard
            icon={MemoryStick}
            label="Memória"
            value={pct(system.memoryPercent) ?? '—'}
            tone="blue"
          />
          <NavyStatCard
            icon={HardDrive}
            label="Disco"
            value={pct(system.diskPercent) ?? '—'}
            tone="blue"
          />
          {db.available ? (
            <NavyStatCard
              icon={Database}
              label="Ligações à BD"
              value={`${db.connections.total}/${db.connections.max}`}
              sub={`${db.connections.usagePercent}% · ${db.connections.active} activas`}
              tone={navyTone(tileIntent(db.status), 'blue')}
            />
          ) : (
            <NavyStatCard
              icon={Database}
              label="Ligações à BD"
              value="—"
              sub="sem dados"
              tone="blue"
            />
          )}
        </div>
        {db.available && (
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <NavyStatCard
              icon={Gauge}
              label="Query média (app)"
              value={fmtMs(db.appAvgQueryMs)}
              sub={`P95 ${fmtMs(db.appP95QueryMs)}`}
              tone="blue"
            />
            <NavyStatCard
              icon={Hourglass}
              label="Queries lentas"
              value={db.slowQueries}
              sub={`> ${db.slowThresholdMs} ms`}
              tone={navyTone(tone(db.slowQueries, 'warning'), 'green')}
            />
            <NavyStatCard
              icon={Lock}
              label="Locks / deadlocks"
              value={`${db.waitingLocks} / ${db.deadlocks}`}
              tone={navyTone(tone(db.waitingLocks, 'warning'), 'green')}
            />
            <NavyStatCard
              icon={Zap}
              label="Cache hit"
              value={
                (db.cacheHitRatio === null ? null : `${db.cacheHitRatio}%`) ??
                '—'
              }
              sub={`${db.sizeGb} GB · ${db.queriesPerSecond ?? '—'} q/s`}
              tone="green"
            />
          </div>
        )}
      </Section>

      <Section title="Filas e armazenamento">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {queues.available ? (
            <>
              <NavyStatCard
                icon={ListTodo}
                label="Em fila"
                value={queues.totals.pending}
                sub={`${queues.totals.running} em execução`}
                tone={navyTone(tileIntent(queues.status), 'blue')}
              />
              <NavyStatCard
                icon={XCircle}
                label="Falhados"
                value={queues.totals.failed}
                sub={`${queues.totals.delayed} agendados`}
                tone={navyTone(tone(queues.totals.failed, 'warning'), 'green')}
              />
            </>
          ) : (
            <NavyStatCard
              icon={ListTodo}
              label="Filas"
              value="—"
              sub="sem dados"
              tone="blue"
            />
          )}
          {storage.available ? (
            <>
              <NavyStatCard
                icon={HardDrive}
                label="Armazenamento"
                value={`${storage.usedGb} GB`}
                sub={
                  storage.usagePercent === null
                    ? 'capacidade desconhecida'
                    : `${storage.usagePercent}% de ${storage.totalGb} GB`
                }
                tone={navyTone(tileIntent(storage.status), 'blue')}
              />
              <NavyStatCard
                icon={TrendingUp}
                label="Crescimento mensal"
                value={
                  (storage.monthlyGrowthMb === null
                    ? null
                    : `${storage.monthlyGrowthMb} MB`) ?? '—'
                }
                sub={
                  storage.files === null
                    ? undefined
                    : `${storage.files} ficheiros`
                }
                tone="blue"
              />
            </>
          ) : (
            <NavyStatCard
              icon={HardDrive}
              label="Armazenamento"
              value="—"
              sub="sem dados"
              tone="blue"
            />
          )}
        </div>
        {queues.available && queues.queues.length > 0 && (
          <div className="mt-4 w-full">
            <table className="w-full break-words [&_td]:break-words [&_th]:break-words text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Fila</th>
                  <th className="pr-3">Em espera</th>
                  <th className="pr-3">Activos</th>
                  <th className="pr-3">Falhados</th>
                  <th className="pr-3">Duração média</th>
                  <th>Débito/min</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {queues.queues.map((q) => (
                  <tr key={q.key}>
                    <td className="py-2 pr-3 text-ink">{q.label}</td>
                    <td className="pr-3 tabular-nums">{q.waiting}</td>
                    <td className="pr-3 tabular-nums">{q.active}</td>
                    <td className="pr-3 tabular-nums">{q.failed}</td>
                    <td className="pr-3 tabular-nums">
                      {fmtMs(q.avgDurationMs)}
                    </td>
                    <td className="tabular-nums">
                      {q.throughputPerMin ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {storage.available && storage.note && (
          <p className="mt-3 font-body text-xs text-ink-faint">
            {storage.note}
          </p>
        )}
      </Section>

      <EndpointTable
        title={`Endpoints mais lentos (P95) — ${data.endpoints.total} medidos`}
        rows={data.endpoints.slowest}
      />
      <EndpointTable
        title="Endpoints com erros 5xx"
        rows={data.endpoints.failing}
      />
    </div>
  );
}
