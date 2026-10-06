// components/scalability/IncidentsForecastsTabs.tsx
// modulo_scalability.md §18-19 — abas Incidentes de Capacidade e Previsões.
// Apresentacionais: dados e callbacks de gravação chegam por props do
// container (app/(platform)/scalability/page.tsx). Só ADMIN escreve (canEdit).

'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { Header, Note, Tile, fmt } from './InfraTabs';
import type {
  CapacityIncident,
  ForecastConfidence,
  ForecastResource,
  ForecastsData,
  IncidentCreate,
  IncidentSeverity,
  IncidentsData,
  IncidentStatus,
  IncidentUpdate,
} from './types';

// ─── §18 Incidentes ────────────────────────────────────────

const STATUS: Record<
  IncidentStatus,
  {
    label: string;
    intent: 'danger' | 'warning' | 'info' | 'success' | 'neutral';
  }
> = {
  OPEN: { label: 'Aberto', intent: 'danger' },
  INVESTIGATING: { label: 'Investigação', intent: 'warning' },
  MITIGATING: { label: 'Mitigação', intent: 'info' },
  RESOLVED: { label: 'Resolvido', intent: 'success' },
  CLOSED: { label: 'Encerrado', intent: 'neutral' },
};

const STATUS_ORDER: IncidentStatus[] = [
  'OPEN',
  'INVESTIGATING',
  'MITIGATING',
  'RESOLVED',
  'CLOSED',
];

const SEVERITY: Record<
  IncidentSeverity,
  { label: string; intent: 'danger' | 'warning' | 'info' }
> = {
  CRITICAL: { label: 'Crítica', intent: 'danger' },
  WARNING: { label: 'Média', intent: 'warning' },
  INFO: { label: 'Baixa', intent: 'info' },
};

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'OVERLOAD', label: 'Sobrecarga' },
  { value: 'SLOW_API', label: 'API lenta' },
  { value: 'DB_SATURATED', label: 'Base de dados saturada' },
  { value: 'STORAGE_FULL', label: 'Storage cheio' },
  { value: 'QUEUE_CONGESTED', label: 'Queue congestionada' },
  { value: 'TIMEOUT', label: 'Timeout' },
  { value: 'MEMORY_LEAK', label: 'Memory leak' },
  { value: 'HIGH_CPU', label: 'CPU elevada' },
  { value: 'SCALING_FAILURE', label: 'Falha de scaling' },
  { value: 'DEGRADATION', label: 'Degradação de performance' },
];

const COMPONENTS: Array<{ value: string; label: string }> = [
  { value: 'API', label: 'API' },
  { value: 'DATABASE', label: 'Base de dados' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'QUEUE', label: 'Filas' },
  { value: 'FRONTEND', label: 'Frontend' },
  { value: 'INTEGRATIONS', label: 'Integrações' },
  { value: 'INFRASTRUCTURE', label: 'Infraestrutura' },
];

const SEVERITY_ITEMS = (
  Object.entries(SEVERITY) as Array<[IncidentSeverity, { label: string }]>
).map(([value, v]) => ({ value, label: v.label }));

const STATUS_ITEMS = STATUS_ORDER.map((value) => ({
  value,
  label: STATUS[value].label,
}));

const labelOf = (list: Array<{ value: string; label: string }>, v: string) =>
  list.find((i) => i.value === v)?.label ?? v;

function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${fmt(minutes / 60)} h`;
  return `${fmt(minutes / 1440)} d`;
}

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// Date → valor para <input type="datetime-local"> (hora local).
function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

interface IncidentFormState {
  title: string;
  category: string;
  component: string;
  severity: IncidentSeverity;
  occurredAt: string;
  impact: string;
  affectedUsers: string;
  status: IncidentStatus;
  rootCause: string;
  actionTaken: string;
  postMortem: string;
}

function formFrom(i?: CapacityIncident): IncidentFormState {
  return {
    title: i?.title ?? '',
    category: i?.category ?? 'OVERLOAD',
    component: i?.component ?? 'API',
    severity: i?.severity ?? 'WARNING',
    occurredAt: toLocalInput(i ? new Date(i.occurredAt) : new Date()),
    impact: i?.impact ?? '',
    affectedUsers: i?.affectedUsers != null ? String(i.affectedUsers) : '',
    status: i?.status ?? 'OPEN',
    rootCause: i?.rootCause ?? '',
    actionTaken: i?.actionTaken ?? '',
    postMortem: i?.postMortem ?? '',
  };
}

interface IncidentModalProps {
  incident?: CapacityIncident;
  canEdit: boolean;
  saving: boolean;
  onClose: () => void;
  onCreate: (v: IncidentCreate) => void;
  onUpdate: (id: string, v: IncidentUpdate) => void;
}

function IncidentModal({
  incident,
  canEdit,
  saving,
  onClose,
  onCreate,
  onUpdate,
}: IncidentModalProps) {
  const [f, setF] = useState<IncidentFormState>(() => formFrom(incident));
  const set = <K extends keyof IncidentFormState>(
    k: K,
    v: IncidentFormState[K],
  ) => setF((s) => ({ ...s, [k]: v }));

  const readOnly = !canEdit;
  const closing = f.status === 'RESOLVED' || f.status === 'CLOSED';
  const needsPostMortem = f.status === 'CLOSED' && f.severity === 'CRITICAL';
  const affected =
    f.affectedUsers.trim() === '' ? undefined : Number(f.affectedUsers);

  const problems: string[] = [];
  if (!f.title.trim()) problems.push('Indique o título');
  if (affected !== undefined && (!Number.isInteger(affected) || affected < 0))
    problems.push('Utilizadores afectados inválido');
  if (incident && closing && (!f.rootCause.trim() || !f.actionTaken.trim()))
    problems.push(
      'Causa raiz e medida aplicada são obrigatórias para resolver',
    );
  if (incident && needsPostMortem && !f.postMortem.trim())
    problems.push('Incidentes críticos exigem post-mortem para encerrar');

  const submit = () => {
    if (problems.length) return;
    if (!incident) {
      onCreate({
        title: f.title.trim(),
        category: f.category,
        component: f.component,
        severity: f.severity,
        occurredAt: new Date(f.occurredAt).toISOString(),
        ...(f.impact.trim() && { impact: f.impact.trim() }),
        ...(affected !== undefined && { affectedUsers: affected }),
      });
      return;
    }
    onUpdate(incident.id, {
      title: f.title.trim(),
      category: f.category,
      component: f.component,
      severity: f.severity,
      status: f.status,
      impact: f.impact,
      ...(affected !== undefined && { affectedUsers: affected }),
      rootCause: f.rootCause,
      actionTaken: f.actionTaken,
      postMortem: f.postMortem,
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={incident ? 'Incidente de capacidade' : 'Novo incidente'}
        description={
          incident
            ? `ID ${incident.id}${incident.ownerName ? ` · Responsável: ${incident.ownerName}` : ''}`
            : 'Regista um problema de capacidade para acompanhamento.'
        }
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Título *" htmlFor="inc-title">
              <Input
                id="inc-title"
                value={f.title}
                maxLength={200}
                disabled={readOnly}
                onChange={(e) => set('title', e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Tipo" htmlFor="inc-category">
            <Select
              items={CATEGORIES}
              value={f.category}
              disabled={readOnly}
              onValueChange={(v) => set('category', v)}
              className="w-full"
            />
          </FormField>
          <FormField label="Componente" htmlFor="inc-component">
            <Select
              items={COMPONENTS}
              value={f.component}
              disabled={readOnly}
              onValueChange={(v) => set('component', v)}
              className="w-full"
            />
          </FormField>
          <FormField label="Severidade" htmlFor="inc-severity">
            <Select
              items={SEVERITY_ITEMS}
              value={f.severity}
              disabled={readOnly}
              onValueChange={(v) => set('severity', v as IncidentSeverity)}
              className="w-full"
            />
          </FormField>
          <FormField label="Data" htmlFor="inc-date">
            <Input
              id="inc-date"
              type="datetime-local"
              value={f.occurredAt}
              disabled={readOnly || !!incident}
              onChange={(e) => set('occurredAt', e.target.value)}
            />
          </FormField>
          {incident && (
            <FormField label="Estado" htmlFor="inc-status">
              <Select
                items={STATUS_ITEMS}
                value={f.status}
                disabled={readOnly}
                onValueChange={(v) => set('status', v as IncidentStatus)}
                className="w-full"
              />
            </FormField>
          )}
          <FormField label="Utilizadores afectados" htmlFor="inc-users">
            <Input
              id="inc-users"
              type="number"
              min={0}
              value={f.affectedUsers}
              disabled={readOnly}
              onChange={(e) => set('affectedUsers', e.target.value)}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Impacto" htmlFor="inc-impact">
              <Textarea
                id="inc-impact"
                rows={2}
                value={f.impact}
                maxLength={4000}
                disabled={readOnly}
                onChange={(e) => set('impact', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
          {incident && (
            <>
              <div className="sm:col-span-2">
                <FormField
                  label={`Causa raiz${closing ? ' *' : ''}`}
                  htmlFor="inc-root"
                >
                  <Textarea
                    id="inc-root"
                    rows={2}
                    value={f.rootCause}
                    maxLength={4000}
                    disabled={readOnly}
                    onChange={(e) => set('rootCause', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label={`Medida aplicada${closing ? ' *' : ''}`}
                  htmlFor="inc-action"
                >
                  <Textarea
                    id="inc-action"
                    rows={2}
                    value={f.actionTaken}
                    maxLength={4000}
                    disabled={readOnly}
                    onChange={(e) => set('actionTaken', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label={`Post-mortem${needsPostMortem ? ' *' : ''}`}
                  htmlFor="inc-pm"
                >
                  <Textarea
                    id="inc-pm"
                    rows={4}
                    value={f.postMortem}
                    maxLength={20000}
                    disabled={readOnly}
                    onChange={(e) => set('postMortem', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>
              <p className="font-body text-xs text-ink-faint sm:col-span-2">
                Duração: {duration(incident.durationMinutes)}
                {incident.ongoing ? ' (em curso)' : ''}
              </p>
            </>
          )}
        </div>

        {canEdit && problems.length > 0 && (
          <p className="mt-4 font-body text-xs text-danger-ink">
            {problems[0]}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            {canEdit ? 'Cancelar' : 'Fechar'}
          </Button>
          {canEdit && (
            <Button onClick={submit} disabled={problems.length > 0 || saving}>
              {saving ? 'A guardar…' : incident ? 'Guardar' : 'Registar'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

export interface IncidentsTabProps {
  data: IncidentsData | null;
  canEdit: boolean;
  saving?: boolean;
  /** `done` fecha o modal — o container chama-o só em caso de sucesso. */
  onCreate: (v: IncidentCreate, done: () => void) => void;
  onUpdate: (id: string, v: IncidentUpdate, done: () => void) => void;
}

export function IncidentsTab({
  data,
  canEdit,
  saving = false,
  onCreate,
  onUpdate,
}: IncidentsTabProps) {
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | IncidentStatus>('ALL');
  const [modal, setModal] = useState<
    { mode: 'new' } | { mode: 'view'; incident: CapacityIncident } | null
  >(null);

  if (!data) {
    return (
      <EmptyState
        title="A carregar incidentes"
        description="Ainda não há dados de incidentes."
      />
    );
  }
  const s = data.summary;
  const rows = data.incidents.filter((i) =>
    filter === 'ALL'
      ? true
      : filter === 'OPEN'
        ? i.ongoing
        : i.status === filter,
  );
  const close = () => setModal(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header
          title="Incidentes de capacidade"
          sub="Sobrecarga, lentidão, saturação e falhas de scaling, do aberto ao post-mortem"
        />
        {canEdit && (
          <Button onClick={() => setModal({ mode: 'new' })}>
            Novo incidente
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Em aberto" value={s.open} sub={`${s.total} no total`} />
        <Tile label="Críticos em aberto" value={s.openCritical} />
        <Tile label="Últimos 30 dias" value={s.last30d} />
        <Tile
          label="Tempo médio de resolução"
          value={
            s.meanTimeToResolveMinutes === null
              ? null
              : duration(s.meanTimeToResolveMinutes)
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['ALL', 'Todos'],
            ['OPEN', 'Em curso'],
            ['RESOLVED', 'Resolvidos'],
            ['CLOSED', 'Encerrados'],
          ] as Array<['ALL' | 'OPEN' | IncidentStatus, string]>
        ).map(([id, label]) => (
          <Button
            key={id}
            intent={filter === id ? 'primary' : 'ghost'}
            onClick={() => setFilter(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sem incidentes"
          description={
            data.incidents.length === 0
              ? 'Nenhum incidente de capacidade registado.'
              : 'Nenhum incidente neste filtro.'
          }
        />
      ) : (
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Incidente</th>
                    <th className="py-1.5 font-semibold">Componente</th>
                    <th className="py-1.5 font-semibold">Severidade</th>
                    <th className="py-1.5 font-semibold">Estado</th>
                    <th className="py-1.5 text-right font-semibold">
                      Afectados
                    </th>
                    <th className="py-1.5 text-right font-semibold">
                      Duração
                    </th>
                    <th className="py-1.5 pl-4 font-semibold">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => (
                    <tr
                      key={i.id}
                      className="cursor-pointer border-t border-border hover:bg-surface-sunken"
                      onClick={() => setModal({ mode: 'view', incident: i })}
                    >
                      <td className="py-2 pr-2 text-ink">
                        {i.title}
                        <span className="block text-[11px] text-ink-faint">
                          {labelOf(CATEGORIES, i.category)} ·{' '}
                          {dateTime(i.occurredAt)}
                        </span>
                      </td>
                      <td className="py-2 text-ink-muted">
                        {labelOf(COMPONENTS, i.component)}
                      </td>
                      <td className="py-2">
                        <Badge intent={SEVERITY[i.severity].intent}>
                          {SEVERITY[i.severity].label}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <Badge intent={STATUS[i.status].intent}>
                          {STATUS[i.status].label}
                        </Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {i.affectedUsers ?? '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {duration(i.durationMinutes)}
                      </td>
                      <td className="py-2 pl-4 text-ink-muted">
                        {i.ownerName ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {modal && (
        <IncidentModal
          incident={modal.mode === 'view' ? modal.incident : undefined}
          canEdit={canEdit}
          saving={saving}
          onClose={close}
          onCreate={(v) => onCreate(v, close)}
          onUpdate={(id, v) => onUpdate(id, v, close)}
        />
      )}
    </div>
  );
}

// ─── §19 Previsões ─────────────────────────────────────────

const CONFIDENCE: Record<
  ForecastConfidence,
  { label: string; intent: 'success' | 'warning' | 'neutral' }
> = {
  ALTA: { label: 'Alta', intent: 'success' },
  MEDIA: { label: 'Média', intent: 'warning' },
  BAIXA: { label: 'Baixa', intent: 'neutral' },
};

type AvailableForecast = Extract<ForecastResource, { available: true }>;

function reachCell(reach: AvailableForecast['reach80']) {
  if (!reach) return <span className="text-ink-faint">sem limite</span>;
  if (reach.months === null)
    return <span className="text-ink-faint">fora do horizonte</span>;
  return (
    <span className={reach.months === 0 ? 'font-semibold text-danger-ink' : ''}>
      {reach.label}
    </span>
  );
}

function ForecastChart({ r }: { r: AvailableForecast }) {
  const n = r.history.length;
  const history = r.history.map((y, i) => ({
    x: i - (n - 1),
    y,
    xLabel: i === n - 1 ? 'Hoje' : `${n - 1 - i} m atrás`,
  }));
  const future = [
    { x: 0, y: r.current, xLabel: 'Hoje' },
    ...r.projections.map((p) => ({
      x: p.months,
      y: p.value,
      xLabel: `+${p.months} m`,
    })),
  ];
  const series = [
    { label: 'Histórico', points: history },
    { label: 'Previsão', points: future },
    ...(r.capacity
      ? [
          {
            label: 'Capacidade',
            points: [
              { x: -(n - 1), y: r.capacity, xLabel: r.capacityLabel },
              { x: 12, y: r.capacity, xLabel: r.capacityLabel },
            ],
          },
        ]
      : []),
  ];
  return (
    <AreaLineChart
      series={series}
      height={240}
      yFormat={(v) => `${fmt(v, 1)}${r.unit ? ` ${r.unit}` : ''}`}
    />
  );
}

export interface ForecastsTabProps {
  data: ForecastsData | null;
  canEdit: boolean;
  saving?: boolean;
  onSaveDbCapacity: (gb: number | null) => void;
}

export function ForecastsTab({
  data,
  canEdit,
  saving = false,
  onSaveDbCapacity,
}: ForecastsTabProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dbCap, setDbCap] = useState<string | null>(null);

  if (!data) {
    return (
      <EmptyState
        title="A carregar previsões"
        description="Ainda não há dados para prever."
      />
    );
  }
  const available = data.resources.filter(
    (r): r is AvailableForecast => r.available,
  );
  const chosen =
    available.find((r) => r.key === selected) ??
    available.find((r) => r.key === data.earliestBottleneck?.key) ??
    available[0];
  const dbDraft =
    dbCap ?? (data.dbCapacityGb != null ? String(data.dbCapacityGb) : '');
  const dbParsed = dbDraft.trim() === '' ? null : Number(dbDraft);
  const dbValid =
    dbParsed === null || (Number.isFinite(dbParsed) && dbParsed >= 0.1);
  const dbDirty = dbCap !== null && dbParsed !== data.dbCapacityGb;

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Previsões de capacidade"
        sub="Tendência do histórico real extrapolada para 3, 6 e 12 meses"
      />

      <Card>
        <CardBody>
          <p className="font-display text-lg font-bold text-ink">
            {data.headline}
          </p>
          {data.users.monthlyGrowthPercent !== null &&
            data.users.in12Months !== null && (
              <p className="mt-2 font-body text-sm text-ink-muted">
                Utilizadores actuais: {fmt(data.users.current, 0)} · Crescimento
                médio mensal: {fmt(data.users.monthlyGrowthPercent)}% ·
                Previsão 12 meses: ~{fmt(data.users.in12Months, 0)}
              </p>
            )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Tile
          label="Instâncias actuais"
          value={data.infraNeeds.currentInstances}
        />
        <Tile
          label="Instâncias para CPU (12 m)"
          value={data.infraNeeds.instancesForCpu12m}
          sub="pela utilização-alvo da política"
        />
        <Tile
          label="Instâncias para RAM (12 m)"
          value={data.infraNeeds.instancesForRam12m}
          sub="pela utilização-alvo da política"
        />
      </div>

      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="py-1.5 font-semibold">Recurso</th>
                  <th className="py-1.5 text-right font-semibold">Actual</th>
                  <th className="py-1.5 text-right font-semibold">+3 m</th>
                  <th className="py-1.5 text-right font-semibold">+6 m</th>
                  <th className="py-1.5 text-right font-semibold">+12 m</th>
                  <th className="py-1.5 pl-4 font-semibold">80% em</th>
                  <th className="py-1.5 font-semibold">100% em</th>
                  <th className="py-1.5 font-semibold">Confiança</th>
                </tr>
              </thead>
              <tbody>
                {data.resources.map((r) =>
                  r.available ? (
                    <tr
                      key={r.key}
                      className={`cursor-pointer border-t border-border hover:bg-surface-sunken ${
                        chosen?.key === r.key ? 'bg-surface-sunken' : ''
                      }`}
                      onClick={() => setSelected(r.key)}
                    >
                      <td className="py-2 text-ink">
                        {r.label}
                        <span className="block text-[11px] text-ink-faint">
                          {r.monthlyGrowthPercent !== null
                            ? `${fmt(r.monthlyGrowthPercent)}%/mês`
                            : '—'}
                          {' · '}
                          {r.historyMonths} meses de histórico
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {fmt(r.current, 2)} {r.unit}
                      </td>
                      {r.projections.map((p) => (
                        <td
                          key={p.months}
                          className="py-2 text-right tabular-nums text-ink-muted"
                        >
                          {fmt(p.value, 2)}
                          {p.percentOfCapacity !== null && (
                            <span className="block text-[11px] text-ink-faint">
                              {p.percentOfCapacity}%
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="py-2 pl-4 text-ink-muted">
                        {reachCell(r.reach80)}
                      </td>
                      <td className="py-2 text-ink-muted">
                        {reachCell(r.reach100)}
                      </td>
                      <td className="py-2">
                        <Badge intent={CONFIDENCE[r.confidence].intent}>
                          {CONFIDENCE[r.confidence].label}
                        </Badge>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.key} className="border-t border-border">
                      <td className="py-2 text-ink">{r.label}</td>
                      <td colSpan={7} className="py-2 text-xs text-ink-faint">
                        {r.reason}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {chosen && (
        <Card>
          <CardBody>
            <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {chosen.label} — histórico e previsão ({chosen.capacityLabel})
            </p>
            <ForecastChart r={chosen} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Capacidade da base de dados
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 font-body text-xs font-medium text-ink-muted">
              Capacidade total (GB)
              <Input
                type="number"
                min={0.1}
                step="any"
                value={dbDraft}
                disabled={!canEdit}
                onChange={(e) => setDbCap(e.target.value)}
                className="w-36"
              />
            </label>
            {canEdit && (
              <Button
                disabled={!dbDirty || !dbValid || saving}
                onClick={() => onSaveDbCapacity(dbParsed)}
              >
                Guardar
              </Button>
            )}
          </div>
          <p className="mt-2 font-body text-xs text-ink-faint">
            O Postgres não expõe o espaço de disco disponível — sem este valor
            a previsão da BD mostra o crescimento mas não a data de
            esgotamento.
          </p>
        </CardBody>
      </Card>
      <Note>{data.note}</Note>
    </div>
  );
}
