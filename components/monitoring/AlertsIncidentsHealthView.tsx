// modulo_monitoring.md §7-9 — vistas de Alertas, Incidentes e Health Check.
// Os dados e as mutações chegam por props do container (app/(platform)/monitoring);
// aqui só há estado de UI (filtros, modais).

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { fmtDate, SEVERITY, STATUS, StatusBadge, Tile, tone } from './PlatformMonitoringView';
import type { Intent } from './PlatformMonitoringView';
import type {
  AlertArea,
  AlertRow,
  AlertsData,
  AlertState,
  CreateIncidentPayload,
  HealthData,
  IncidentDetail,
  IncidentRow,
  IncidentsData,
  UpdateIncidentPayload,
} from './coreMonitoringTypes';

const fmtMin = (m: number | null) => {
  if (m === null) return '—';
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.floor(m / 60)} h ${m % 60} min`;
  return `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h`;
};

const chip = (active: boolean) =>
  `rounded-md border px-3 py-1 font-body text-sm ${
    active
      ? 'border-brand bg-brand-soft text-ink'
      : 'border-border text-ink-muted hover:bg-surface-muted'
  }`;

const selectCls =
  'w-full rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink';

// ── §7 Alertas ───────────────────────────────────────────────────────────────

const AREA_LABEL: Record<AlertArea, string> = {
  SISTEMA: 'Sistema',
  PROCESSOS: 'Processos',
  INTEGRACAO: 'Integração',
  AUTOMACAO: 'Automação',
  SLA: 'SLA',
  SEGURANCA: 'Segurança',
};

const STATE_LABEL: Record<AlertState, { label: string; intent: Intent }> = {
  ABERTO: { label: 'Aberto', intent: 'danger' },
  RECONHECIDO: { label: 'Reconhecido', intent: 'warning' },
  EM_TRATAMENTO: { label: 'Em tratamento', intent: 'info' },
  RESOLVIDO: { label: 'Resolvido', intent: 'success' },
};

export type AlertCommand =
  | { kind: 'acknowledge'; id: string }
  | { kind: 'note'; id: string; note: string }
  | { kind: 'resolve'; id: string; note?: string }
  | { kind: 'incident'; id: string };

export interface AlertsFilters {
  area: AlertArea | null;
  state: AlertState | null;
}

function NoteModal({
  title,
  required,
  busy,
  onSubmit,
  onClose,
}: {
  title: string;
  required: boolean;
  busy: boolean;
  onSubmit: (note: string) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const invalid = required && note.trim().length === 0;
  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title={title}>
        <div className="mt-4 space-y-4">
          <FormField
            label={required ? 'Nota' : 'Nota (opcional)'}
            htmlFor="mon-note"
          >
            <Textarea
              id="mon-note"
              rows={4}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              loading={busy}
              disabled={invalid}
              onClick={() => onSubmit(note.trim())}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

function AlertItem({
  a,
  canAct,
  busy,
  onCommand,
}: {
  a: AlertRow;
  canAct: boolean;
  busy: boolean;
  onCommand: (c: AlertCommand) => void;
}) {
  const [dialog, setDialog] = useState<'note' | 'resolve' | null>(null);
  const st = STATE_LABEL[a.state];
  const open = a.state !== 'RESOLVIDO';
  return (
    <li className="space-y-2 py-3 font-body text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge intent={SEVERITY[a.severity] ?? 'neutral'}>{a.severity}</Badge>
        <Badge intent={st.intent} dot={false}>
          {st.label}
        </Badge>
        <Badge intent="neutral" dot={false}>
          {a.areaLabel}
        </Badge>
        <span className="font-medium text-ink">{a.title}</span>
        <span className="ml-auto tabular-nums text-xs text-ink-faint">
          {fmtDate(a.createdAt)} · {fmtMin(a.ageMinutes)}
        </span>
      </div>
      <p className="text-ink-muted">{a.message}</p>
      <p className="text-xs text-ink-faint">
        Origem: {a.origin}
        {a.automatic && ' (regra automática)'}
        {a.assigneeName && ` · Responsável: ${a.assigneeName}`}
        {a.resolvedAt &&
          ` · Resolvido ${fmtDate(a.resolvedAt)} por ${a.resolvedBy ?? '—'}`}
      </p>
      {a.actions.length > 0 && (
        <ul className="space-y-0.5 border-l-2 border-border pl-3 text-xs text-ink-muted">
          {a.actions.map((x, i) => (
            <li key={`${x.at}-${i}`}>
              <span className="tabular-nums">{fmtDate(x.at)}</span> · {x.kind}
              {x.byName && ` (${x.byName})`}
              {x.note && `: ${x.note}`}
            </li>
          ))}
        </ul>
      )}
      {canAct && open && (
        <div className="flex flex-wrap gap-2">
          {!a.acknowledgedAt && (
            <Button
              size="sm"
              intent="secondary"
              disabled={busy}
              onClick={() => onCommand({ kind: 'acknowledge', id: a.id })}
            >
              Reconhecer
            </Button>
          )}
          <Button
            size="sm"
            intent="secondary"
            disabled={busy}
            onClick={() => setDialog('note')}
          >
            Registar ação
          </Button>
          <Button
            size="sm"
            intent="secondary"
            disabled={busy}
            onClick={() => onCommand({ kind: 'incident', id: a.id })}
          >
            Abrir incidente
          </Button>
          <Button
            size="sm"
            intent="success"
            disabled={busy}
            onClick={() => setDialog('resolve')}
          >
            Resolver
          </Button>
        </div>
      )}
      {dialog && (
        <NoteModal
          title={dialog === 'note' ? 'Registar ação tomada' : 'Resolver alerta'}
          required={dialog === 'note'}
          busy={busy}
          onClose={() => setDialog(null)}
          onSubmit={(note) => {
            onCommand(
              dialog === 'note'
                ? { kind: 'note', id: a.id, note }
                : { kind: 'resolve', id: a.id, note: note || undefined },
            );
            setDialog(null);
          }}
        />
      )}
    </li>
  );
}

export function AlertsTab({
  data,
  filters,
  onFiltersChange,
  canAct,
  busy,
  onCommand,
}: {
  data: AlertsData;
  filters: AlertsFilters;
  onFiltersChange: (f: AlertsFilters) => void;
  canAct: boolean;
  busy: boolean;
  onCommand: (c: AlertCommand) => void;
}) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Alertas abertos" value={s.open} />
        <Tile
          label="Críticos abertos"
          value={s.openCritical}
          intent={tone(s.openCritical)}
        />
        <Tile
          label="Sem responsável"
          value={s.unassigned}
          sub="abertos ou só reconhecidos"
          intent={tone(s.unassigned, 'warning')}
        />
        <Tile label="Em tratamento" value={s.byState.EM_TRATAMENTO} />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-sm text-ink-muted">Área:</span>
          <button
            type="button"
            className={chip(filters.area === null)}
            onClick={() => onFiltersChange({ ...filters, area: null })}
          >
            Todas
          </button>
          {(Object.keys(AREA_LABEL) as AlertArea[]).map((a) => (
            <button
              key={a}
              type="button"
              className={chip(filters.area === a)}
              onClick={() => onFiltersChange({ ...filters, area: a })}
            >
              {AREA_LABEL[a]} ({s.byArea[a]})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-sm text-ink-muted">Estado:</span>
          <button
            type="button"
            className={chip(filters.state === null)}
            onClick={() => onFiltersChange({ ...filters, state: null })}
          >
            Todos
          </button>
          {(Object.keys(STATE_LABEL) as AlertState[]).map((st) => (
            <button
              key={st}
              type="button"
              className={chip(filters.state === st)}
              onClick={() => onFiltersChange({ ...filters, state: st })}
            >
              {STATE_LABEL[st].label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardBody>
          {data.alerts.length === 0 ? (
            <EmptyState
              title="Sem alertas"
              description="Nenhum alerta corresponde aos filtros."
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.alerts.map((a) => (
                <AlertItem
                  key={a.id}
                  a={a}
                  canAct={canAct}
                  busy={busy}
                  onCommand={onCommand}
                />
              ))}
            </ul>
          )}
          {!canAct && (
            <p className="mt-3 font-body text-xs text-ink-faint">
              Só administradores podem reconhecer, tratar e resolver alertas.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ── §8 Incidentes ────────────────────────────────────────────────────────────

const INCIDENT_CATEGORIES = [
  'OVERLOAD',
  'SLOW_API',
  'DB_SATURATED',
  'STORAGE_FULL',
  'QUEUE_CONGESTED',
  'TIMEOUT',
  'MEMORY_LEAK',
  'HIGH_CPU',
  'SCALING_FAILURE',
  'DEGRADATION',
];
const INCIDENT_COMPONENTS = [
  'API',
  'DATABASE',
  'STORAGE',
  'QUEUE',
  'FRONTEND',
  'INTEGRATIONS',
  'INFRASTRUCTURE',
];
const OP_STATUSES = ['OPEN', 'INVESTIGATING', 'MITIGATING', 'RESOLVED', 'CLOSED'];

const UNIFIED_INTENT: Record<string, Intent> = {
  CRITICAL: 'danger',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'info',
};

function NewIncidentModal({
  busy,
  onCreate,
  onClose,
}: {
  busy: boolean;
  onCreate: (p: CreateIncidentPayload) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CreateIncidentPayload>({
    title: '',
    category: 'DEGRADATION',
    component: 'API',
    severity: 'WARNING',
    impact: '',
  });
  const set = <K extends keyof CreateIncidentPayload>(
    k: K,
    v: CreateIncidentPayload[K],
  ) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title="Novo incidente" className="max-w-lg">
        <div className="mt-4 space-y-4">
          <FormField label="Título" htmlFor="inc-title">
            <Input
              id="inc-title"
              maxLength={200}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Categoria" htmlFor="inc-cat">
              <select
                id="inc-cat"
                className={selectCls}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Serviço afectado" htmlFor="inc-comp">
              <select
                id="inc-comp"
                className={selectCls}
                value={form.component}
                onChange={(e) => set('component', e.target.value)}
              >
                {INCIDENT_COMPONENTS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Severidade" htmlFor="inc-sev">
              <select
                id="inc-sev"
                className={selectCls}
                value={form.severity}
                onChange={(e) =>
                  set('severity', e.target.value as CreateIncidentPayload['severity'])
                }
              >
                <option value="INFO">Baixa</option>
                <option value="WARNING">Média</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </FormField>
          </div>
          <FormField label="Impacto" htmlFor="inc-impact">
            <Textarea
              id="inc-impact"
              rows={3}
              maxLength={4000}
              value={form.impact ?? ''}
              onChange={(e) => set('impact', e.target.value)}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              loading={busy}
              disabled={form.title.trim().length === 0}
              onClick={() =>
                onCreate({
                  ...form,
                  title: form.title.trim(),
                  impact: form.impact?.trim() || undefined,
                })
              }
            >
              Criar incidente
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

function IncidentDetailModal({
  detail,
  loading,
  canAct,
  busy,
  onUpdate,
  onClose,
}: {
  detail: IncidentDetail | undefined;
  loading: boolean;
  canAct: boolean;
  busy: boolean;
  onUpdate: (p: UpdateIncidentPayload) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState('');
  const [cause, setCause] = useState('');
  const [resolution, setResolution] = useState('');
  const editable = canAct && detail?.kind === 'OPERATIONAL';
  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={detail ? `${detail.code} — ${detail.title}` : 'Incidente'}
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        {loading || !detail ? (
          <Skeleton rows={4} />
        ) : (
          <div className="mt-4 space-y-4 font-body text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge intent={UNIFIED_INTENT[detail.severity]}>
                {detail.severity}
              </Badge>
              <Badge intent="neutral" dot={false}>
                {detail.status}
              </Badge>
              <span className="text-ink-muted">
                {detail.component} · responsável {detail.ownerName ?? '—'}
              </span>
            </div>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-ink-muted">Impacto</dt>
                <dd>
                  {detail.impact ?? '—'}
                  {detail.affectedUsers !== null &&
                    ` (${detail.affectedUsers} utilizadores)`}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink-muted">
                  Tempo de resolução
                </dt>
                <dd>{fmtMin(detail.resolutionMinutes)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink-muted">Causa</dt>
                <dd>{detail.cause ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-ink-muted">Resolução</dt>
                <dd>{detail.resolution ?? '—'}</dd>
              </div>
            </dl>

            <div>
              <h4 className="mb-1 font-display text-sm font-bold text-ink">
                Timeline
              </h4>
              <ul className="space-y-1 border-l-2 border-border pl-3 text-xs text-ink-muted">
                {detail.timeline.map((t, i) => (
                  <li key={`${t.at}-${i}`}>
                    <span className="tabular-nums">{fmtDate(t.at)}</span> ·{' '}
                    {t.label}
                    {t.actor && ` (${t.actor})`}
                  </li>
                ))}
              </ul>
            </div>

            {editable && (
              <div className="space-y-3 border-t border-border pt-4">
                <FormField label="Mudar estado" htmlFor="inc-status">
                  <select
                    id="inc-status"
                    className={selectCls}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">— manter ({detail.status}) —</option>
                    {OP_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Causa" htmlFor="inc-cause">
                  <Textarea
                    id="inc-cause"
                    rows={2}
                    maxLength={4000}
                    value={cause}
                    onChange={(e) => setCause(e.target.value)}
                  />
                </FormField>
                <FormField label="Resolução / ação tomada" htmlFor="inc-res">
                  <Textarea
                    id="inc-res"
                    rows={2}
                    maxLength={4000}
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button
                    loading={busy}
                    disabled={!status && !cause.trim() && !resolution.trim()}
                    onClick={() =>
                      onUpdate({
                        status: status || undefined,
                        rootCause: cause.trim() || undefined,
                        actionTaken: resolution.trim() || undefined,
                      })
                    }
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            )}
            {detail.kind === 'SECURITY' && (
              <p className="text-xs text-ink-faint">
                Incidente de segurança: gerido no módulo Audit.
              </p>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

export function IncidentsTab({
  data,
  group,
  onGroupChange,
  canAct,
  busy,
  creating,
  onCreateClick,
  onCreate,
  onCloseCreate,
  selected,
  detail,
  detailLoading,
  onSelect,
  onUpdate,
}: {
  data: IncidentsData;
  group: 'ACTIVE' | 'RESOLVED' | null;
  onGroupChange: (g: 'ACTIVE' | 'RESOLVED' | null) => void;
  canAct: boolean;
  busy: boolean;
  creating: boolean;
  onCreateClick: () => void;
  onCreate: (p: CreateIncidentPayload) => void;
  onCloseCreate: () => void;
  selected: IncidentRow | null;
  detail: IncidentDetail | undefined;
  detailLoading: boolean;
  onSelect: (i: IncidentRow | null) => void;
  onUpdate: (p: UpdateIncidentPayload) => void;
}) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Incidentes activos"
          value={s.active}
          sub={`${s.byKind.OPERATIONAL} operacionais · ${s.byKind.SECURITY} segurança`}
          intent={tone(s.active, 'warning')}
        />
        <Tile
          label="Críticos activos"
          value={s.activeCritical}
          intent={tone(s.activeCritical)}
        />
        <Tile label="Resolvidos" value={s.resolved} />
        <Tile
          label="Tempo médio de resolução"
          value={fmtMin(s.meanTimeToResolveMinutes)}
          sub={`últimos ${s.mttrWindowDays} dias`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={chip(group === null)}
          onClick={() => onGroupChange(null)}
        >
          Todos
        </button>
        <button
          type="button"
          className={chip(group === 'ACTIVE')}
          onClick={() => onGroupChange('ACTIVE')}
        >
          Activos
        </button>
        <button
          type="button"
          className={chip(group === 'RESOLVED')}
          onClick={() => onGroupChange('RESOLVED')}
        >
          Resolvidos
        </button>
        {canAct && (
          <Button className="ml-auto" size="sm" onClick={onCreateClick}>
            Novo incidente
          </Button>
        )}
      </div>

      <Card>
        <CardBody>
          {data.incidents.length === 0 ? (
            <EmptyState
              title="Sem incidentes"
              description="Nenhum incidente corresponde ao filtro."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left font-body text-sm">
                <thead className="text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2 pr-3">Incidente</th>
                    <th className="pr-3">Severidade</th>
                    <th className="pr-3">Estado</th>
                    <th className="pr-3">Serviço</th>
                    <th className="pr-3">Responsável</th>
                    <th className="pr-3">Início</th>
                    <th>Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.incidents.map((i) => (
                    <tr
                      key={i.key}
                      className="cursor-pointer align-top hover:bg-surface-muted"
                      onClick={() => onSelect(i)}
                    >
                      <td className="py-2 pr-3">
                        <div className="font-medium text-ink">{i.title}</div>
                        <div className="text-xs text-ink-faint">
                          {i.code}
                          {i.kind === 'SECURITY' && ' · segurança'}
                        </div>
                      </td>
                      <td className="pr-3">
                        <Badge intent={UNIFIED_INTENT[i.severity]}>
                          {i.severity}
                        </Badge>
                      </td>
                      <td className="pr-3">{i.status}</td>
                      <td className="pr-3">{i.component}</td>
                      <td className="pr-3">{i.ownerName ?? '—'}</td>
                      <td className="pr-3 tabular-nums">
                        {fmtDate(i.occurredAt)}
                      </td>
                      <td className="tabular-nums">
                        {fmtMin(i.resolutionMinutes ?? i.ageMinutes)}
                        {i.group === 'ACTIVE' && ' (em curso)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 font-body text-xs text-ink-faint">{data.note}</p>
        </CardBody>
      </Card>

      {creating && (
        <NewIncidentModal busy={busy} onCreate={onCreate} onClose={onCloseCreate} />
      )}
      {selected && (
        <IncidentDetailModal
          key={selected.key}
          detail={detail}
          loading={detailLoading}
          canAct={canAct}
          busy={busy}
          onUpdate={onUpdate}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  );
}

// ── §9 Health Check ──────────────────────────────────────────────────────────

const GROUP_LABEL: Record<string, string> = {
  APLICACAO: 'Aplicação',
  DADOS: 'Dados',
  INFRAESTRUTURA: 'Infraestrutura',
  EXTERNO: 'Serviços externos',
  PROCESSAMENTO: 'Processamento',
};

export function HealthTab({
  data,
  refreshing,
  onRefresh,
}: {
  data: HealthData;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const groups = Object.keys(GROUP_LABEL);
  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3 font-body text-sm">
            <h2 className="font-display text-lg font-bold text-ink">
              Estado dos componentes
            </h2>
            <StatusBadge status={data.overall.status} />
            <span className="text-ink-muted">
              {data.summary.monitored} monitorizados
              {data.summary.notMonitored > 0 &&
                ` · ${data.summary.notMonitored} não monitorizados`}
            </span>
            <span className="text-xs text-ink-faint">
              verificado {fmtDate(data.generatedAt)}
            </span>
            <Button
              className="ml-auto"
              size="sm"
              intent="secondary"
              loading={refreshing}
              onClick={onRefresh}
            >
              Verificar agora
            </Button>
          </div>
          {data.overall.reasons.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 font-body text-sm text-ink-muted">
              {data.overall.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {groups.map((g) => {
        const items = data.components.filter((c) => c.group === g);
        if (items.length === 0) return null;
        return (
          <div key={g} className="space-y-3">
            <h3 className="font-display text-base font-bold text-ink">
              {GROUP_LABEL[g]}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <Card key={c.key}>
                  <CardBody>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{c.label}</span>
                      {c.status ? (
                        <Badge intent={STATUS[c.status].intent}>
                          {c.statusLabel}
                        </Badge>
                      ) : (
                        <Badge intent="neutral" dot={false}>
                          Não monitorizado
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 font-body text-sm text-ink-muted">
                      {c.detail}
                    </p>
                    <p className="mt-2 font-body text-xs text-ink-faint">
                      {c.latencyMs !== null && `${c.latencyMs} ms · `}
                      {c.uptimePercent24h !== null
                        ? `disponibilidade 24h ${c.uptimePercent24h}% (${c.samples24h} amostras)`
                        : 'sem histórico 24h'}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
      <p className="font-body text-xs text-ink-faint">{data.note}</p>
    </div>
  );
}
