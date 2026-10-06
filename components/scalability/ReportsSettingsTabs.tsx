// components/scalability/ReportsSettingsTabs.tsx
// modulo_scalability.md §23-24 — abas Relatórios e Configurações.
// Apresentacionais: dados e callbacks chegam por props do container
// (app/(platform)/scalability/page.tsx). Configurações só são editáveis por ADMIN.

'use client';

import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header, Note } from './InfraTabs';
import type {
  AlertRuleGroup,
  MaintenanceWindow,
  ReportCatalogData,
  ReportCell,
  ReportData,
  ReportFormat,
  SettingsData,
  SettingsUpdate,
  ThresholdField,
} from './types';

const MAX_PREVIEW_ROWS = 50;

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function cellText(v: ReportCell): string {
  if (v === null || v === undefined || v === '') return '—';
  return typeof v === 'number' ? v.toLocaleString('pt-PT') : v;
}

// ─── §23 Relatórios ────────────────────────────────────────

const FORMATS: Array<{ value: ReportFormat; label: string }> = [
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'csv', label: 'CSV' },
];

export interface ReportsTabProps {
  catalog: ReportCatalogData | null;
  report: ReportData | null;
  selected: string | null;
  loadingReport?: boolean;
  /** formato em exportação (para desactivar botões) ou null */
  exporting?: ReportFormat | null;
  onSelect: (type: string) => void;
  onExport: (type: string, format: ReportFormat) => void;
}

export function ReportsTab({
  catalog,
  report,
  selected,
  loadingReport = false,
  exporting = null,
  onSelect,
  onExport,
}: ReportsTabProps) {
  if (!catalog) {
    return (
      <EmptyState
        title="Relatórios indisponíveis"
        description="Não foi possível carregar o catálogo — o seu perfil pode não estar autorizado (ver Configurações)."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Relatórios"
        sub="Capacidade, performance, crescimento, custos e mais — a partir dos mesmos dados das outras abas. Cada exportação fica registada no Audit."
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {catalog.reports.map((r) => {
          const active = r.type === selected;
          return (
            <button
              key={r.type}
              type="button"
              onClick={() => onSelect(r.type)}
              aria-pressed={active}
              className={`rounded-lg border p-4 text-left transition-colors ${
                active
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              <p className="font-body text-sm font-semibold text-ink">
                {r.title}
              </p>
              <p className="mt-1 font-body text-xs text-ink-muted">
                {r.description}
              </p>
            </button>
          );
        })}
      </div>

      {!selected ? (
        <EmptyState
          title="Escolha um relatório"
          description="Seleccione um dos relatórios acima para pré-visualizar e exportar."
        />
      ) : loadingReport || !report ? (
        <EmptyState
          title="A gerar relatório"
          description="A recolher os dados…"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                {report.title}
              </h3>
              <p className="font-body text-xs text-ink-faint">
                Gerado em {dateTime(report.generatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {FORMATS.map((f) => (
                <Button
                  key={f.value}
                  intent="secondary"
                  size="sm"
                  disabled={exporting !== null}
                  onClick={() => onExport(report.type, f.value)}
                >
                  {exporting === f.value ? 'A exportar…' : `Exportar ${f.label}`}
                </Button>
              ))}
            </div>
          </div>

          {report.summary.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.summary.map((s) => (
                <Card key={s.label}>
                  <CardBody>
                    <p className="font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
                      {s.label}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold tabular-nums text-ink">
                      {cellText(s.value)}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {report.tables.map((t) => (
            <Card key={t.title}>
              <CardBody>
                <p className="mb-3 font-body text-sm font-semibold text-ink">
                  {t.title}
                </p>
                {t.rows.length === 0 ? (
                  <p className="font-body text-sm text-ink-muted">
                    Sem registos.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full font-body text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                          {t.columns.map((c) => (
                            <th key={c} className="py-1.5 pr-3 font-semibold">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t.rows.slice(0, MAX_PREVIEW_ROWS).map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            {t.columns.map((c) => (
                              <td
                                key={c}
                                className="py-2 pr-3 tabular-nums text-ink-muted"
                              >
                                {cellText(r[c])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {t.rows.length > MAX_PREVIEW_ROWS && (
                  <p className="mt-2 font-body text-xs text-ink-faint">
                    A mostrar {MAX_PREVIEW_ROWS} de {t.rows.length} linhas — a
                    exportação inclui todas.
                  </p>
                )}
              </CardBody>
            </Card>
          ))}

          {report.notes.map((n) => (
            <Note key={n}>{n}</Note>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── §24 Configurações ─────────────────────────────────────

const GROUP_LABEL: Record<AlertRuleGroup, string> = {
  CAPACITY: 'Capacidade',
  PERFORMANCE: 'Performance',
  GROWTH: 'Crescimento',
  RESILIENCE: 'Resiliência',
};

const ROLE_LABEL: Record<string, string> = {
  AUDITOR: 'Auditor',
  DIRECTOR: 'Director',
  GESTOR: 'Gestor',
  RH: 'Recursos Humanos',
};

/** Limiares editáveis, na ordem do spec §24, com rótulo e unidade. */
function thresholdRows(s: SettingsData): Array<{
  group: string;
  field: ThresholdField;
  label: string;
  unit: string;
}> {
  return [
    { group: 'Limites', field: s.limits.cpu, label: 'CPU', unit: '%' },
    { group: 'Limites', field: s.limits.memory, label: 'Memória (RAM)', unit: '%' },
    { group: 'Limites', field: s.limits.storage, label: 'Storage', unit: '% do plano' },
    { group: 'Limites', field: s.limits.dbConnections, label: 'Ligações à BD', unit: '%' },
    { group: 'Latência', field: s.limits.latencyP95Ms, label: 'Latência P95', unit: 'ms' },
    { group: 'Latência', field: s.limits.latencyP99Ms, label: 'Latência P99', unit: 'ms' },
    { group: 'Erros', field: s.limits.errorRate, label: 'Taxa de erros 5xx', unit: '%' },
    { group: 'Erros', field: s.limits.slowQueryShare, label: 'Queries lentas', unit: '% das queries' },
    { group: 'Erros', field: s.limits.slowEndpoints, label: 'Endpoints críticos', unit: 'endpoints' },
    { group: 'Filas', field: s.limits.queuePending, label: 'Jobs pendentes', unit: 'jobs' },
    { group: 'Crescimento', field: s.growth.growthFactor, label: 'Crescimento de utilizadores', unit: '× a média' },
    { group: 'Crescimento', field: s.growth.storageGrowthFactor, label: 'Crescimento de storage', unit: '× a média' },
    { group: 'Crescimento', field: s.growth.usersNearLimitMonths, label: 'Aviso de limite de utilizadores', unit: 'meses' },
  ];
}

export interface SettingsTabProps {
  data: SettingsData | null;
  canEdit: boolean;
  saving?: boolean;
  onSave: (v: SettingsUpdate, done: () => void) => void;
}

interface WindowDraft {
  id: string;
  name: string;
  startsAt: string; // valor de <input type="datetime-local">
  endsAt: string;
  note: string;
}

/** ISO → "YYYY-MM-DDTHH:mm" no fuso local, para <input type="datetime-local">. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function SettingsTab({
  data,
  canEdit,
  saving = false,
  onSave,
}: SettingsTabProps) {
  if (!data) {
    return (
      <EmptyState
        title="Configurações indisponíveis"
        description="Não foi possível carregar as configurações — o seu perfil pode não estar autorizado."
      />
    );
  }
  return (
    <SettingsForm
      key={data.updatedAt}
      data={data}
      canEdit={canEdit}
      saving={saving}
      onSave={onSave}
    />
  );
}

function SettingsForm({
  data,
  canEdit,
  saving,
  onSave,
}: {
  data: SettingsData;
  canEdit: boolean;
  saving: boolean;
  onSave: SettingsTabProps['onSave'];
}) {
  const rows = thresholdRows(data);
  const [thresholds, setThresholds] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.field.key, String(r.field.value)])),
  );
  const [maxUsers, setMaxUsers] = useState(String(data.limits.maxConcurrentUsers));
  const [maxRps, setMaxRps] = useState(String(data.limits.maxApiRps));
  const [retention, setRetention] = useState(
    String(data.retention.metricRetentionDays),
  );
  const [interval, setIntervalMin] = useState(
    String(data.collection.intervalMinutes),
  );
  const [disabled, setDisabled] = useState<Set<string>>(
    () => new Set(data.alertRules.filter((r) => !r.enabled).map((r) => r.key)),
  );
  const [roles, setRoles] = useState<Set<string>>(
    () => new Set(data.authorizedRoles),
  );
  const [windows, setWindows] = useState<WindowDraft[]>(() =>
    data.maintenanceWindows.map((w: MaintenanceWindow) => ({
      id: w.id,
      name: w.name,
      startsAt: toLocalInput(w.startsAt),
      endsAt: toLocalInput(w.endsAt),
      note: w.note ?? '',
    })),
  );
  const [error, setError] = useState<string | null>(null);

  const toggle = (set: Set<string>, key: string): Set<string> => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  };

  const submit = () => {
    setError(null);
    const num = (v: string) => (v.trim() === '' ? NaN : Number(v));

    const changed: Record<string, number> = {};
    for (const r of rows) {
      const v = num(thresholds[r.field.key]);
      if (!Number.isFinite(v) || v < r.field.min || v > r.field.max) {
        setError(`${r.label}: valor entre ${r.field.min} e ${r.field.max}.`);
        return;
      }
      changed[r.field.key] = v;
    }
    if (changed.p99Ms < changed.p95Ms) {
      setError('O limite de P99 não pode ser inferior ao de P95.');
      return;
    }
    const users = num(maxUsers);
    const rps = num(maxRps);
    const ret = num(retention);
    const freq = num(interval);
    if (!Number.isInteger(users) || users < 1)
      return setError('Concorrência máxima: inteiro ≥ 1.');
    if (!Number.isInteger(rps) || rps < 1)
      return setError('RPS máximo: inteiro ≥ 1.');
    if (!Number.isInteger(ret) || ret < 7 || ret > 3650)
      return setError('Retenção: entre 7 e 3650 dias.');
    if (!Number.isInteger(freq) || freq < 1 || freq > 60)
      return setError('Frequência de recolha: entre 1 e 60 minutos.');

    const wins: NonNullable<SettingsUpdate['maintenanceWindows']> = [];
    for (const w of windows) {
      if (!w.name.trim() || !w.startsAt || !w.endsAt)
        return setError('Cada janela precisa de nome, início e fim.');
      const start = new Date(w.startsAt);
      const end = new Date(w.endsAt);
      if (!(end.getTime() > start.getTime()))
        return setError(`Janela "${w.name}": o fim tem de ser posterior ao início.`);
      wins.push({
        id: w.id.startsWith('new-') ? undefined : w.id,
        name: w.name.trim(),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        note: w.note.trim() || undefined,
      });
    }

    onSave(
      {
        maxConcurrentUsers: users,
        maxApiRps: rps,
        thresholds: changed,
        disabledRules: [...disabled],
        maintenanceWindows: wins,
        metricRetentionDays: ret,
        collectionIntervalMinutes: freq,
        authorizedRoles: [...roles],
      },
      () => undefined,
    );
  };

  const groups = [...new Set(rows.map((r) => r.group))];
  const ro = !canEdit;
  const ruleGroups = (
    ['CAPACITY', 'PERFORMANCE', 'GROWTH', 'RESILIENCE'] as AlertRuleGroup[]
  ).map((g) => ({
    group: g,
    rules: data.alertRules.filter((r) => r.group === g),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header
          title="Configurações"
          sub={
            canEdit
              ? 'Limites, regras de alerta, janelas de manutenção, retenção, frequência e perfis autorizados.'
              : 'Só leitura — apenas ADMIN altera as configurações.'
          }
        />
        {canEdit && (
          <Button onClick={submit} disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar configurações'}
          </Button>
        )}
      </div>

      {data.activeMaintenance && (
        <Badge intent="warning" dot={false}>
          Janela de manutenção activa: {data.activeMaintenance.name} (até{' '}
          {dateTime(data.activeMaintenance.endsAt)}) — sem alertas novos.
        </Badge>
      )}
      {error && (
        <p role="alert" className="font-body text-sm text-danger">
          {error}
        </p>
      )}

      {/* Limites */}
      <Card>
        <CardBody>
          <p className="mb-3 font-body text-sm font-semibold text-ink">
            Limites e limiares
          </p>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Concorrência máxima (utilizadores)"
              htmlFor="set-max-users"
              hint="Partilhado com a aba Capacidade"
            >
              <Input
                id="set-max-users"
                type="number"
                min={1}
                value={maxUsers}
                disabled={ro}
                onChange={(e) => setMaxUsers(e.target.value)}
              />
            </FormField>
            <FormField
              label="Concorrência máxima (API RPS)"
              htmlFor="set-max-rps"
              hint="Partilhado com a aba Capacidade"
            >
              <Input
                id="set-max-rps"
                type="number"
                min={1}
                value={maxRps}
                disabled={ro}
                onChange={(e) => setMaxRps(e.target.value)}
              />
            </FormField>
          </div>
          {groups.map((g) => (
            <div key={g} className="mb-4 last:mb-0">
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {g}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows
                  .filter((r) => r.group === g)
                  .map((r) => (
                    <FormField
                      key={r.field.key}
                      label={`${r.label} (${r.unit})`}
                      htmlFor={`set-${r.field.key}`}
                      hint={`Padrão ${r.field.default}${r.field.customised ? ' · personalizado' : ''}`}
                    >
                      <Input
                        id={`set-${r.field.key}`}
                        type="number"
                        step="any"
                        min={r.field.min}
                        max={r.field.max}
                        value={thresholds[r.field.key]}
                        disabled={ro}
                        onChange={(e) =>
                          setThresholds((t) => ({
                            ...t,
                            [r.field.key]: e.target.value,
                          }))
                        }
                      />
                    </FormField>
                  ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Regras de alertas */}
      <Card>
        <CardBody>
          <p className="mb-1 font-body text-sm font-semibold text-ink">
            Regras de alertas
          </p>
          <p className="mb-3 font-body text-xs text-ink-muted">
            Desactive as regras que não interessam. Os limiares acima definem o
            ponto em que cada regra dispara.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ruleGroups.map((g) => (
              <div key={g.group}>
                <p className="mb-1 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {GROUP_LABEL[g.group]}
                </p>
                <ul className="divide-y divide-border">
                  {g.rules.map((r) => (
                    <li key={r.key} className="py-2">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={!disabled.has(r.key)}
                          disabled={ro}
                          onChange={() => setDisabled((d) => toggle(d, r.key))}
                        />
                        <span className="min-w-0">
                          <span className="block font-body text-sm text-ink">
                            {r.label}
                          </span>
                          <span className="block font-body text-[11px] text-ink-faint">
                            {r.condition}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Auto scaling (resumo) */}
      <Card>
        <CardBody>
          <p className="mb-2 font-body text-sm font-semibold text-ink">
            Regras de auto scaling
          </p>
          <p className="font-body text-sm text-ink-muted">
            {data.autoScaling.enabled ? 'Activo' : 'Desactivado'} ·{' '}
            {data.autoScaling.minInstances}–{data.autoScaling.maxInstances}{' '}
            instâncias · CPU alvo {data.autoScaling.targetCpu}% · memória alvo{' '}
            {data.autoScaling.targetMemory}% · emergência{' '}
            {data.autoScaling.emergencyEnabled ? 'activa' : 'desactivada'}
          </p>
          <Note>{data.autoScaling.note}</Note>
        </CardBody>
      </Card>

      {/* Janelas de manutenção */}
      <Card>
        <CardBody>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-body text-sm font-semibold text-ink">
              Janelas de manutenção
            </p>
            {canEdit && (
              <Button
                intent="secondary"
                size="sm"
                onClick={() =>
                  setWindows((w) => [
                    ...w,
                    {
                      id: `new-${Date.now()}`,
                      name: '',
                      startsAt: '',
                      endsAt: '',
                      note: '',
                    },
                  ])
                }
              >
                Adicionar janela
              </Button>
            )}
          </div>
          {windows.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">
              Nenhuma janela definida.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {windows.map((w, i) => (
                <li
                  key={w.id}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3 md:grid-cols-4"
                >
                  <FormField label="Nome" htmlFor={`win-name-${i}`}>
                    <Input
                      id={`win-name-${i}`}
                      value={w.name}
                      disabled={ro}
                      maxLength={120}
                      onChange={(e) =>
                        setWindows((all) =>
                          all.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </FormField>
                  <FormField label="Início" htmlFor={`win-start-${i}`}>
                    <Input
                      id={`win-start-${i}`}
                      type="datetime-local"
                      value={w.startsAt}
                      disabled={ro}
                      onChange={(e) =>
                        setWindows((all) =>
                          all.map((x, j) =>
                            j === i ? { ...x, startsAt: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </FormField>
                  <FormField label="Fim" htmlFor={`win-end-${i}`}>
                    <Input
                      id={`win-end-${i}`}
                      type="datetime-local"
                      value={w.endsAt}
                      disabled={ro}
                      onChange={(e) =>
                        setWindows((all) =>
                          all.map((x, j) =>
                            j === i ? { ...x, endsAt: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </FormField>
                  <div className="flex items-end">
                    {canEdit && (
                      <Button
                        intent="secondary"
                        size="sm"
                        onClick={() =>
                          setWindows((all) => all.filter((_, j) => j !== i))
                        }
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  <div className="md:col-span-4">
                    <FormField label="Nota" htmlFor={`win-note-${i}`}>
                      <Textarea
                        id={`win-note-${i}`}
                        rows={2}
                        value={w.note}
                        disabled={ro}
                        maxLength={300}
                        onChange={(e) =>
                          setWindows((all) =>
                            all.map((x, j) =>
                              j === i ? { ...x, note: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </FormField>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Retenção e frequência */}
      <Card>
        <CardBody>
          <p className="mb-3 font-body text-sm font-semibold text-ink">
            Recolha de métricas
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Retenção de métricas (dias)"
              htmlFor="set-retention"
              hint="Amostras mais antigas são apagadas diariamente (03:00)"
            >
              <Input
                id="set-retention"
                type="number"
                min={7}
                max={3650}
                value={retention}
                disabled={ro}
                onChange={(e) => setRetention(e.target.value)}
              />
            </FormField>
            <FormField
              label="Frequência de recolha (minutos)"
              htmlFor="set-interval"
              hint="1 = uma amostra por minuto"
            >
              <Input
                id="set-interval"
                type="number"
                min={1}
                max={60}
                value={interval}
                disabled={ro}
                onChange={(e) => setIntervalMin(e.target.value)}
              />
            </FormField>
          </div>
        </CardBody>
      </Card>

      {/* Perfis autorizados */}
      <Card>
        <CardBody>
          <p className="mb-1 font-body text-sm font-semibold text-ink">
            Perfis autorizados
          </p>
          <p className="mb-3 font-body text-xs text-ink-muted">
            Perfis, além de ADMIN (sempre autorizado), que podem ver Relatórios
            e Configurações. Só ADMIN altera configurações.
          </p>
          <div className="flex flex-wrap gap-4">
            {data.grantableRoles.map((r) => (
              <label key={r} className="flex items-center gap-2 font-body text-sm text-ink">
                <input
                  type="checkbox"
                  checked={roles.has(r)}
                  disabled={ro}
                  onChange={() => setRoles((s) => toggle(s, r))}
                />
                {ROLE_LABEL[r] ?? r}
              </label>
            ))}
          </div>
        </CardBody>
      </Card>

      <Note>{data.note}</Note>
    </div>
  );
}
