// modulo_monitoring.md §4-6 — vistas apresentacionais (Automações, Integrações,
// Performance). Os dados chegam por props do container (app/(platform)/monitoring).

import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, STATUS, StatusBadge, Tile, tone } from './PlatformMonitoringView';
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
    <Card>
      <CardBody>
        <h3 className="mb-3 font-display text-base font-bold text-ink">
          {title}
        </h3>
        {children}
      </CardBody>
    </Card>
  );
}

// ── §4 Automações ────────────────────────────────────────────────────────────

export function AutomationsTab({ data }: { data: AutomationsData }) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Execuções (24h)"
          value={s.executed24h}
          sub={`${s.activeRules} regras activas`}
        />
        <Tile
          label="Taxa de sucesso"
          value={pct(s.successRatePercent)}
          sub={`${s.success24h} sucesso · ${s.failed24h} falhas`}
          intent={tone(s.failed24h, 'warning')}
        />
        <Tile
          label="Em execução"
          value={s.running}
          sub={`${s.pending} pendentes · ${s.waitingFlows} fluxos em espera`}
        />
        <Tile
          label="Retries (24h)"
          value={s.retries24h}
          sub={`${s.retriesScheduled} agendados`}
          intent={tone(s.retries24h, 'warning')}
        />
        <Tile
          label="Tempo médio"
          value={fmtMs(s.avgExecutionMs)}
          sub="execuções terminadas"
        />
        <Tile
          label="Dead letters abertas"
          value={s.deadLettersOpen}
          intent={tone(s.deadLettersOpen)}
        />
        <Tile
          label="Agendamentos com erro"
          value={s.schedulesInError}
          intent={tone(s.schedulesInError, 'warning')}
        />
        <Tile
          label="Próxima execução"
          value={s.nextExecutionAt ? fmtDate(s.nextExecutionAt) : null}
          sub={
            s.lastExecutionAt
              ? `última ${fmtDate(s.lastExecutionAt)}`
              : 'sem execuções'
          }
        />
      </div>

      {data.failuresByRule.length > 0 && (
        <Section title="Regras com mais falhas (24h)">
          <ul className="divide-y divide-border font-body text-sm">
            {data.failuresByRule.map((r) => (
              <li key={r.ruleId} className="flex justify-between gap-3 py-2">
                <span className="text-ink">{r.name ?? `Regra #${r.ruleId}`}</span>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left font-body text-sm">
              <thead className="text-xs uppercase text-ink-muted">
                <tr>
                  <th className="py-2 pr-3">Quando</th>
                  <th className="pr-3">Regra</th>
                  <th className="pr-3">Tentativa</th>
                  <th className="pr-3">Próximo retry</th>
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left font-body text-sm">
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
                  {d.success} sucesso · {d.failed} falha · {d.successRatePercent}
                  %
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
  q: { waiting: number; active: number; failed: number; delayed: number } | null;
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
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3 font-body text-sm">
            <h2 className="font-display text-lg font-bold text-ink">
              Estado das integrações
            </h2>
            <StatusBadge status={s.overall} />
            <span className="text-ink-muted">
              {s.active} activas de {s.total}
            </span>
            {data.sso && (
              <Badge intent={data.sso.enabled ? 'success' : 'neutral'}>
                SSO {data.sso.enabled ? (data.sso.provider ?? 'activo') : 'desligado'}
              </Badge>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Indisponíveis"
          value={s.unavailable}
          sub={`${s.stale} sem sincronização recente`}
          intent={tone(s.unavailable)}
        />
        <Tile
          label="Sincronizações (24h)"
          value={s.syncs24h}
          sub={`${s.failures24h} falhas`}
          intent={tone(s.failures24h, 'warning')}
        />
        <Tile
          label="Registos processados (24h)"
          value={s.recordsProcessed24h}
          sub={`${s.recordsFailed24h} com falha`}
          intent={tone(s.recordsFailed24h, 'warning')}
        />
        <Tile label="Tempo de resposta" value={fmtMs(s.avgResponseMs)} />
      </div>

      <Section title="Por família">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left font-body text-sm">
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
            {data.email.connections} ligação(ões),{' '}
            {data.email.lastTestFailed} com último teste falhado
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left font-body text-sm">
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
const tileIntent = (s: MonitoringStatus | null | undefined) => {
  const i = statusIntent(s);
  return i === 'danger' || i === 'warning' ? i : undefined;
};

function EndpointTable({ title, rows }: { title: string; rows: EndpointRow[] }) {
  return (
    <Section title={title}>
      {rows.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">Nenhum.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left font-body text-sm">
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
            <Tile
              label="Latência média"
              value={fmtMs(api.avgLatencyMs)}
              sub={`P95 ${fmtMs(api.p95Ms)} · P99 ${fmtMs(api.p99Ms)}`}
              intent={tileIntent(api.status)}
            />
            <Tile
              label="Taxa de erros"
              value={pct(api.errorRatePercent)}
              sub={`${api.http4xx} × 4xx · ${api.http5xx} × 5xx`}
              intent={tone(api.http5xx, 'warning')}
            />
            <Tile
              label="Pedidos"
              value={api.requests}
              sub={
                api.requestsPerMinute === null
                  ? undefined
                  : `${api.requestsPerMinute}/min`
              }
            />
            <Tile
              label="Lentos / timeouts"
              value={api.slowRequests}
              sub={`> ${api.slowThresholdMs} ms · ${api.timeouts} timeouts`}
              intent={tone(api.timeouts, 'warning')}
            />
          </div>
        ) : (
          <p className="font-body text-sm text-ink-muted">Sem dados da API.</p>
        )}
      </Section>

      <Section title="Servidor e base de dados">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Tile
            label="CPU"
            value={pct(system.cpuPercent)}
            sub={system.stale ? 'amostra desactualizada' : undefined}
            intent={tileIntent(system.status)}
          />
          <Tile label="Memória" value={pct(system.memoryPercent)} />
          <Tile label="Disco" value={pct(system.diskPercent)} />
          {db.available ? (
            <Tile
              label="Ligações à BD"
              value={`${db.connections.total}/${db.connections.max}`}
              sub={`${db.connections.usagePercent}% · ${db.connections.active} activas`}
              intent={tileIntent(db.status)}
            />
          ) : (
            <Tile label="Ligações à BD" value={null} sub="sem dados" />
          )}
        </div>
        {db.available && (
          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              label="Query média (app)"
              value={fmtMs(db.appAvgQueryMs)}
              sub={`P95 ${fmtMs(db.appP95QueryMs)}`}
            />
            <Tile
              label="Queries lentas"
              value={db.slowQueries}
              sub={`> ${db.slowThresholdMs} ms`}
              intent={tone(db.slowQueries, 'warning')}
            />
            <Tile
              label="Locks / deadlocks"
              value={`${db.waitingLocks} / ${db.deadlocks}`}
              intent={tone(db.waitingLocks, 'warning')}
            />
            <Tile
              label="Cache hit"
              value={db.cacheHitRatio === null ? null : `${db.cacheHitRatio}%`}
              sub={`${db.sizeGb} GB · ${db.queriesPerSecond ?? '—'} q/s`}
            />
          </div>
        )}
      </Section>

      <Section title="Filas e armazenamento">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {queues.available ? (
            <>
              <Tile
                label="Em fila"
                value={queues.totals.pending}
                sub={`${queues.totals.running} em execução`}
                intent={tileIntent(queues.status)}
              />
              <Tile
                label="Falhados"
                value={queues.totals.failed}
                sub={`${queues.totals.delayed} agendados`}
                intent={tone(queues.totals.failed, 'warning')}
              />
            </>
          ) : (
            <Tile label="Filas" value={null} sub="sem dados" />
          )}
          {storage.available ? (
            <>
              <Tile
                label="Armazenamento"
                value={`${storage.usedGb} GB`}
                sub={
                  storage.usagePercent === null
                    ? 'capacidade desconhecida'
                    : `${storage.usagePercent}% de ${storage.totalGb} GB`
                }
                intent={tileIntent(storage.status)}
              />
              <Tile
                label="Crescimento mensal"
                value={
                  storage.monthlyGrowthMb === null
                    ? null
                    : `${storage.monthlyGrowthMb} MB`
                }
                sub={storage.files === null ? undefined : `${storage.files} ficheiros`}
              />
            </>
          ) : (
            <Tile label="Armazenamento" value={null} sub="sem dados" />
          )}
        </div>
        {queues.available && queues.queues.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left font-body text-sm">
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
                    <td className="pr-3 tabular-nums">{fmtMs(q.avgDurationMs)}</td>
                    <td className="tabular-nums">{q.throughputPerMin ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {storage.available && storage.note && (
          <p className="mt-3 font-body text-xs text-ink-faint">{storage.note}</p>
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
