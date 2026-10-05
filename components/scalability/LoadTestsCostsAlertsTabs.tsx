// components/scalability/LoadTestsCostsAlertsTabs.tsx
// modulo_scalability.md §20-22 — abas Testes de Carga, Custos e as regras
// automáticas da aba Alertas. Apresentacionais: dados e callbacks de gravação
// chegam por props do container (app/(platform)/scalability/page.tsx).
// Só ADMIN escreve (canEdit).

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
  AlertRule,
  AlertRuleGroup,
  AlertRulesData,
  CostCategory,
  CostsData,
  CostsSave,
  LoadTest,
  LoadTestCreate,
  LoadTestEnvironment,
  LoadTestStatus,
  LoadTestType,
  LoadTestUpdate,
  LoadTestVerdict,
  LoadTestsData,
} from './types';

type Intent = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

function dateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

// ─── §20 Testes de Carga ───────────────────────────────────

const TYPES: Array<{ value: LoadTestType; label: string }> = [
  { value: 'LOAD', label: 'Load test' },
  { value: 'STRESS', label: 'Stress test' },
  { value: 'SPIKE', label: 'Spike test' },
  { value: 'ENDURANCE', label: 'Endurance test' },
  { value: 'VOLUME', label: 'Volume test' },
  { value: 'FAILOVER', label: 'Failover test' },
];

const ENVIRONMENTS: Array<{ value: LoadTestEnvironment; label: string }> = [
  { value: 'LOCAL', label: 'Local' },
  { value: 'STAGING', label: 'Staging' },
  { value: 'PRODUCTION', label: 'Produção' },
];

const TEST_STATUS: Record<LoadTestStatus, { label: string; intent: Intent }> = {
  PLANNED: { label: 'Planeado', intent: 'neutral' },
  RUNNING: { label: 'Em curso', intent: 'info' },
  COMPLETED: { label: 'Concluído', intent: 'success' },
  CANCELLED: { label: 'Cancelado', intent: 'warning' },
};

const STATUS_ITEMS = (
  Object.entries(TEST_STATUS) as Array<[LoadTestStatus, { label: string }]>
).map(([value, v]) => ({ value, label: v.label }));

const VERDICT: Record<LoadTestVerdict, { label: string; intent: Intent }> = {
  APPROVED: { label: 'Aprovado', intent: 'success' },
  APPROVED_WITH_NOTES: { label: 'Aprovado com observações', intent: 'warning' },
  FAILED: { label: 'Reprovado', intent: 'danger' },
};

const VERDICT_ITEMS = [
  { value: '', label: 'Sem veredicto' },
  ...(
    Object.entries(VERDICT) as Array<[LoadTestVerdict, { label: string }]>
  ).map(([value, v]) => ({ value, label: v.label })),
];

const MODULE_OPTIONS = [
  'Auth',
  'Academia (cursos/lições)',
  'Inscrições',
  'Certificados',
  'RH / Utilizadores',
  'PDI',
  'Presenças',
  'Notificações',
  'Auditoria',
  'Integrações',
];

const labelOf = <T extends string>(
  list: Array<{ value: T; label: string }>,
  v: T,
) => list.find((i) => i.value === v)?.label ?? v;

interface LoadTestForm {
  name: string;
  type: LoadTestType;
  environment: LoadTestEnvironment;
  appVersion: string;
  scenario: string;
  modules: string[];
  simulatedUsers: string;
  targetRps: string;
  durationSec: string;
  status: LoadTestStatus;
  throughputRps: string;
  p95Ms: string;
  p99Ms: string;
  errorRate: string;
  cpuPeak: string;
  ramPeak: string;
  dbPeakConn: string;
  queuePeak: string;
  peakConcurrent: string;
  verdict: LoadTestVerdict | '';
  observations: string;
}

const str = (n: number | null | undefined) => (n == null ? '' : String(n));

function formFrom(t?: LoadTest): LoadTestForm {
  return {
    name: t?.name ?? '',
    type: t?.type ?? 'LOAD',
    environment: t?.environment ?? 'LOCAL',
    appVersion: t?.appVersion ?? '',
    scenario: t?.scenario ?? '',
    modules: t?.modules ?? [],
    simulatedUsers: str(t?.simulatedUsers),
    targetRps: str(t?.targetRps),
    durationSec: str(t?.durationSec),
    status: t?.status ?? 'PLANNED',
    throughputRps: str(t?.results.throughputRps),
    p95Ms: str(t?.results.p95Ms),
    p99Ms: str(t?.results.p99Ms),
    errorRate: str(t?.results.errorRate),
    cpuPeak: str(t?.results.cpuPeak),
    ramPeak: str(t?.results.ramPeak),
    dbPeakConn: str(t?.results.dbPeakConn),
    queuePeak: str(t?.results.queuePeak),
    peakConcurrent: str(t?.results.peakConcurrent),
    verdict: t?.verdict ?? '',
    observations: t?.observations ?? '',
  };
}

// '' → undefined; número inválido → NaN (apanhado em `problems`).
const num = (s: string): number | undefined =>
  s.trim() === '' ? undefined : Number(s);

interface LoadTestModalProps {
  test?: LoadTest;
  canEdit: boolean;
  saving: boolean;
  thresholds: LoadTestsData['thresholds'];
  onClose: () => void;
  onCreate: (v: LoadTestCreate) => void;
  onUpdate: (id: string, v: LoadTestUpdate) => void;
}

function LoadTestModal({
  test,
  canEdit,
  saving,
  thresholds,
  onClose,
  onCreate,
  onUpdate,
}: LoadTestModalProps) {
  const [f, setF] = useState<LoadTestForm>(() => formFrom(test));
  const set = <K extends keyof LoadTestForm>(k: K, v: LoadTestForm[K]) =>
    setF((s) => ({ ...s, [k]: v }));
  const readOnly = !canEdit;
  const completed = f.status === 'COMPLETED';

  const ints: Array<[string, string, boolean]> = [
    ['Utilizadores simulados', f.simulatedUsers, true],
    ['Requests/sec', f.targetRps, true],
    ['Duração', f.durationSec, true],
    ['P95', f.p95Ms, true],
    ['P99', f.p99Ms, true],
    ['Ligações à BD', f.dbPeakConn, true],
    ['Queue', f.queuePeak, true],
    ['Concurrent users', f.peakConcurrent, true],
  ];
  const problems: string[] = [];
  if (!f.name.trim()) problems.push('Indique o nome do teste');
  for (const [label, v] of ints) {
    const n = num(v);
    if (n !== undefined && (!Number.isInteger(n) || n < 0))
      problems.push(`${label}: indique um inteiro ≥ 0`);
  }
  for (const [label, v, max] of [
    ['Throughput', f.throughputRps, undefined],
    ['Erros', f.errorRate, 100],
    ['CPU', f.cpuPeak, 100],
    ['RAM', f.ramPeak, 100],
  ] as Array<[string, string, number | undefined]>) {
    const n = num(v);
    if (n !== undefined && (!Number.isFinite(n) || n < 0 || (max && n > max)))
      problems.push(`${label}: valor inválido`);
  }
  if (test && completed) {
    if (
      [f.throughputRps, f.p95Ms, f.p99Ms, f.errorRate].some(
        (v) => v.trim() === '',
      )
    )
      problems.push('Para concluir indique throughput, P95, P99 e erros');
  }
  const p95 = num(f.p95Ms);
  const p99 = num(f.p99Ms);
  if (p95 !== undefined && p99 !== undefined && p99 < p95)
    problems.push('P99 não pode ser inferior ao P95');

  const base = () => ({
    name: f.name.trim(),
    type: f.type,
    environment: f.environment,
    ...(f.appVersion.trim() && { appVersion: f.appVersion.trim() }),
    ...(f.scenario.trim() && { scenario: f.scenario.trim() }),
    modules: f.modules,
    ...(num(f.simulatedUsers) !== undefined && {
      simulatedUsers: num(f.simulatedUsers),
    }),
    ...(num(f.targetRps) !== undefined && { targetRps: num(f.targetRps) }),
    ...(num(f.durationSec) !== undefined && {
      durationSec: num(f.durationSec),
    }),
  });

  const submit = () => {
    if (problems.length) return;
    if (!test) {
      onCreate(base());
      return;
    }
    const results: Array<[keyof LoadTestUpdate, string]> = [
      ['throughputRps', f.throughputRps],
      ['p95Ms', f.p95Ms],
      ['p99Ms', f.p99Ms],
      ['errorRate', f.errorRate],
      ['cpuPeak', f.cpuPeak],
      ['ramPeak', f.ramPeak],
      ['dbPeakConn', f.dbPeakConn],
      ['queuePeak', f.queuePeak],
      ['peakConcurrent', f.peakConcurrent],
    ];
    onUpdate(test.id, {
      ...base(),
      status: f.status,
      ...Object.fromEntries(
        results
          .filter(([, v]) => v.trim() !== '')
          .map(([k, v]) => [k, Number(v)]),
      ),
      ...(completed && f.verdict && { verdict: f.verdict }),
      observations: f.observations,
    });
  };

  const toggleModule = (m: string) =>
    set(
      'modules',
      f.modules.includes(m)
        ? f.modules.filter((x) => x !== m)
        : [...f.modules, m],
    );

  const numField = (
    label: string,
    key: keyof LoadTestForm,
    suffix?: string,
  ) => (
    <FormField
      label={suffix ? `${label} (${suffix})` : label}
      htmlFor={`lt-${key}`}
    >
      <Input
        id={`lt-${key}`}
        type="number"
        min={0}
        value={f[key] as string}
        disabled={readOnly}
        onChange={(e) => set(key, e.target.value as never)}
      />
    </FormField>
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={test ? 'Teste de carga' : 'Novo teste de carga'}
        description={
          test
            ? `ID ${test.id}`
            : 'Regista a configuração; os resultados são lançados depois de executar o teste.'
        }
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <FormField label="Nome *" htmlFor="lt-name">
              <Input
                id="lt-name"
                value={f.name}
                maxLength={200}
                disabled={readOnly}
                onChange={(e) => set('name', e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Tipo" htmlFor="lt-type">
            <Select
              items={TYPES}
              value={f.type}
              disabled={readOnly}
              onValueChange={(v) => set('type', v as LoadTestType)}
              className="w-full"
            />
          </FormField>
          <FormField label="Ambiente" htmlFor="lt-env">
            <Select
              items={ENVIRONMENTS}
              value={f.environment}
              disabled={readOnly}
              onValueChange={(v) =>
                set('environment', v as LoadTestEnvironment)
              }
              className="w-full"
            />
          </FormField>
          <FormField label="Versão da aplicação" htmlFor="lt-version">
            <Input
              id="lt-version"
              value={f.appVersion}
              maxLength={60}
              disabled={readOnly}
              onChange={(e) => set('appVersion', e.target.value)}
            />
          </FormField>
          {numField('Utilizadores simulados', 'simulatedUsers')}
          {numField('Requests/sec', 'targetRps', 'alvo')}
          {numField('Duração', 'durationSec', 's')}
          <div className="sm:col-span-3">
            <FormField label="Cenário" htmlFor="lt-scenario">
              <Textarea
                id="lt-scenario"
                rows={2}
                value={f.scenario}
                maxLength={4000}
                disabled={readOnly}
                onChange={(e) => set('scenario', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
          <div className="sm:col-span-3">
            <p className="mb-1.5 font-body text-xs font-medium text-ink-muted">
              Módulos envolvidos
            </p>
            <div className="flex flex-wrap gap-2">
              {MODULE_OPTIONS.map((m) => (
                <Button
                  key={m}
                  size="sm"
                  intent={f.modules.includes(m) ? 'primary' : 'ghost'}
                  disabled={readOnly}
                  onClick={() => toggleModule(m)}
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          {test && (
            <>
              <div className="sm:col-span-3">
                <FormField label="Estado" htmlFor="lt-status">
                  <Select
                    items={STATUS_ITEMS}
                    value={f.status}
                    disabled={readOnly}
                    onValueChange={(v) => set('status', v as LoadTestStatus)}
                    className="w-full sm:w-64"
                  />
                </FormField>
              </div>
              <p className="font-body text-sm font-semibold text-ink sm:col-span-3">
                Resultados{completed ? ' *' : ''}
              </p>
              {numField('Throughput', 'throughputRps', 'req/s')}
              {numField('P95', 'p95Ms', 'ms')}
              {numField('P99', 'p99Ms', 'ms')}
              {numField('Erros', 'errorRate', '%')}
              {numField('CPU máx.', 'cpuPeak', '%')}
              {numField('RAM máx.', 'ramPeak', '%')}
              {numField('Ligações à BD (pico)', 'dbPeakConn')}
              {numField('Queue (pico)', 'queuePeak', 'jobs')}
              {numField('Concurrent users (pico)', 'peakConcurrent')}
              <p className="font-body text-xs text-ink-faint sm:col-span-3">
                Limiares: P95 &lt; {thresholds.p95Ms} ms · P99 &lt;{' '}
                {thresholds.p99Ms} ms · erros &lt; {thresholds.errorRatePercent}
                %
              </p>
              {completed && (
                <div className="sm:col-span-3">
                  <FormField label="Resultado" htmlFor="lt-verdict">
                    <Select
                      items={VERDICT_ITEMS}
                      value={f.verdict}
                      disabled={readOnly}
                      onValueChange={(v) =>
                        set('verdict', v as LoadTestVerdict | '')
                      }
                      className="w-full sm:w-72"
                    />
                  </FormField>
                  {test.suggestedVerdict && (
                    <p className="mt-1 font-body text-xs text-ink-faint">
                      Sugestão pelos limiares:{' '}
                      {VERDICT[test.suggestedVerdict].label}
                      {test.breaches.length > 0 &&
                        ` (${test.breaches
                          .map(
                            (b) => `${b.metric} ${fmt(b.value)} > ${b.limit}`,
                          )
                          .join('; ')})`}
                    </p>
                  )}
                </div>
              )}
              <div className="sm:col-span-3">
                <FormField label="Observações" htmlFor="lt-notes">
                  <Textarea
                    id="lt-notes"
                    rows={3}
                    value={f.observations}
                    maxLength={4000}
                    disabled={readOnly}
                    onChange={(e) => set('observations', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>
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
              {saving ? 'A guardar…' : test ? 'Guardar' : 'Registar'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}

export interface LoadTestsTabProps {
  data: LoadTestsData | null;
  canEdit: boolean;
  saving?: boolean;
  /** `done` fecha o modal — o container chama-o só em caso de sucesso. */
  onCreate: (v: LoadTestCreate, done: () => void) => void;
  onUpdate: (id: string, v: LoadTestUpdate, done: () => void) => void;
}

export function LoadTestsTab({
  data,
  canEdit,
  saving = false,
  onCreate,
  onUpdate,
}: LoadTestsTabProps) {
  const [typeFilter, setTypeFilter] = useState<'ALL' | LoadTestType>('ALL');
  const [modal, setModal] = useState<
    { mode: 'new' } | { mode: 'view'; test: LoadTest } | null
  >(null);

  if (!data) {
    return (
      <EmptyState
        title="A carregar testes de carga"
        description="Ainda não há dados de testes."
      />
    );
  }
  const s = data.summary;
  const rows = data.tests.filter(
    (t) => typeFilter === 'ALL' || t.type === typeFilter,
  );
  const close = () => setModal(null);
  const last = s.lastTest;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header
          title="Testes de carga"
          sub="Load, stress, spike, endurance, volume e failover — configuração, resultados medidos e veredicto"
        />
        {canEdit && (
          <Button onClick={() => setModal({ mode: 'new' })}>Novo teste</Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile
          label="Concluídos"
          value={s.completed}
          sub={`${s.total} no total`}
        />
        <Tile label="Planeados" value={s.planned} />
        <Tile
          label="Taxa de aprovação"
          value={s.passRatePercent}
          unit={s.passRatePercent === null ? undefined : '%'}
          sub="com veredicto atribuído"
        />
        <Tile
          label="Último teste"
          value={last ? labelOf(TYPES, last.type) : null}
          sub={
            last
              ? `${dateTime(last.finishedAt)}${last.verdict ? ` · ${VERDICT[last.verdict].label}` : ''}`
              : undefined
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          intent={typeFilter === 'ALL' ? 'primary' : 'ghost'}
          onClick={() => setTypeFilter('ALL')}
        >
          Todos
        </Button>
        {TYPES.map((t) => (
          <Button
            key={t.value}
            size="sm"
            intent={typeFilter === t.value ? 'primary' : 'ghost'}
            onClick={() => setTypeFilter(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sem testes de carga"
          description={
            data.tests.length === 0
              ? 'Nenhum teste registado. Execute-o (ex.: npm run test:load) e registe aqui o plano e os resultados.'
              : 'Nenhum teste deste tipo.'
          }
        />
      ) : (
        <Card>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full font-body text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                    <th className="py-1.5 font-semibold">Teste</th>
                    <th className="py-1.5 font-semibold">Ambiente</th>
                    <th className="py-1.5 font-semibold">Estado</th>
                    <th className="py-1.5 text-right font-semibold">Users</th>
                    <th className="py-1.5 text-right font-semibold">Req/s</th>
                    <th className="py-1.5 text-right font-semibold">P95</th>
                    <th className="py-1.5 text-right font-semibold">P99</th>
                    <th className="py-1.5 text-right font-semibold">Erros</th>
                    <th className="py-1.5 pl-4 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr
                      key={t.id}
                      className="cursor-pointer border-t border-border hover:bg-surface-sunken"
                      onClick={() => setModal({ mode: 'view', test: t })}
                    >
                      <td className="py-2 pr-2 text-ink">
                        {t.name}
                        <span className="block text-[11px] text-ink-faint">
                          {labelOf(TYPES, t.type)}
                          {t.appVersion ? ` · v${t.appVersion}` : ''} ·{' '}
                          {dateTime(
                            t.finishedAt ?? t.scheduledAt ?? t.createdAt,
                          )}
                        </span>
                      </td>
                      <td className="py-2 text-ink-muted">
                        {labelOf(ENVIRONMENTS, t.environment)}
                      </td>
                      <td className="py-2">
                        <Badge intent={TEST_STATUS[t.status].intent}>
                          {TEST_STATUS[t.status].label}
                        </Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {t.simulatedUsers ?? '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {fmt(t.results.throughputRps) ?? '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {t.results.p95Ms != null
                          ? `${t.results.p95Ms} ms`
                          : '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {t.results.p99Ms != null
                          ? `${t.results.p99Ms} ms`
                          : '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink-muted">
                        {t.results.errorRate != null
                          ? `${fmt(t.results.errorRate, 2)}%`
                          : '—'}
                      </td>
                      <td className="py-2 pl-4">
                        {t.verdict ? (
                          <Badge intent={VERDICT[t.verdict].intent}>
                            {VERDICT[t.verdict].label}
                          </Badge>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <Note>
        A INNOVA não executa os testes — regista o plano e os resultados medidos
        (Artillery, k6…). O veredicto é do responsável; a sugestão deriva dos
        limiares do projecto.
      </Note>

      {modal && (
        <LoadTestModal
          test={modal.mode === 'view' ? modal.test : undefined}
          canEdit={canEdit}
          saving={saving}
          thresholds={data.thresholds}
          onClose={close}
          onCreate={(v) => onCreate(v, close)}
          onUpdate={(id, v) => onUpdate(id, v, close)}
        />
      )}
    </div>
  );
}

// ─── §21 Custos ────────────────────────────────────────────

const COST_LABEL: Record<CostCategory, string> = {
  DATABASE: 'Base de dados',
  STORAGE: 'Storage',
  COMPUTE: 'Compute',
  TRAFFIC: 'Tráfego',
  BACKUPS: 'Backups',
  EXTERNAL: 'Serviços externos',
};
const COST_ORDER = Object.keys(COST_LABEL) as CostCategory[];

function money(n: number | null, currency: string): string | null {
  if (n === null) return null;
  return n.toLocaleString('pt-PT', {
    style: 'currency',
    currency,
    maximumFractionDigits: n >= 100 ? 0 : 2,
  });
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('pt-PT', {
    month: 'short',
    year: '2-digit',
  });
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export interface CostsTabProps {
  data: CostsData | null;
  canEdit: boolean;
  saving?: boolean;
  onSave: (v: CostsSave, done: () => void) => void;
}

function CostsForm({
  data,
  saving,
  onSave,
  onCancel,
}: {
  data: CostsData;
  saving: boolean;
  onSave: (v: CostsSave) => void;
  onCancel: () => void;
}) {
  const [month, setMonth] = useState(data.month ?? currentMonth());
  const [currency, setCurrency] = useState(data.currency);
  const [amounts, setAmounts] = useState<Record<CostCategory, string>>(
    () =>
      Object.fromEntries(
        data.categories.map((c) => [
          c.category,
          c.amount == null ? '' : String(c.amount),
        ]),
      ) as Record<CostCategory, string>,
  );

  const entries = COST_ORDER.filter((c) => amounts[c].trim() !== '').map(
    (c) => ({ category: c, amount: Number(amounts[c]) }),
  );
  const invalid = entries.some(
    (e) => !Number.isFinite(e.amount) || e.amount < 0,
  );
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  const validCurrency = /^[A-Za-z]{3}$/.test(currency.trim());
  const ok = validMonth && validCurrency && entries.length > 0 && !invalid;

  return (
    <Card>
      <CardBody className="flex flex-col gap-4">
        <p className="font-body text-sm font-semibold text-ink">
          Custos mensais de infraestrutura
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField label="Mês" htmlFor="cost-month">
            <Input
              id="cost-month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </FormField>
          <FormField label="Moeda (ISO)" htmlFor="cost-currency">
            <Input
              id="cost-currency"
              value={currency}
              maxLength={3}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {COST_ORDER.map((c) => (
            <FormField key={c} label={COST_LABEL[c]} htmlFor={`cost-${c}`}>
              <Input
                id={`cost-${c}`}
                type="number"
                min={0}
                step="0.01"
                value={amounts[c]}
                onChange={(e) =>
                  setAmounts((a) => ({ ...a, [c]: e.target.value }))
                }
              />
            </FormField>
          ))}
        </div>
        {!ok && (
          <p className="font-body text-xs text-danger-ink">
            {!validMonth
              ? 'Escolha o mês'
              : !validCurrency
                ? 'Moeda: 3 letras (ex.: EUR)'
                : invalid
                  ? 'Valores têm de ser números ≥ 0'
                  : 'Indique pelo menos um custo'}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button intent="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            disabled={!ok || saving}
            onClick={() =>
              onSave({
                month,
                currency: currency.trim().toUpperCase(),
                entries,
              })
            }
          >
            {saving ? 'A guardar…' : 'Guardar custos'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function CostsTab({
  data,
  canEdit,
  saving = false,
  onSave,
}: CostsTabProps) {
  const [editing, setEditing] = useState(false);

  if (!data) {
    return (
      <EmptyState
        title="A carregar custos"
        description="Ainda não há dados de custos."
      />
    );
  }
  const cur = data.currency;
  const c = data.current;
  const hasData = data.month !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header
          title="Custos de infraestrutura"
          sub="Crescimento ligado ao custo — por utilizador, por categoria e por escalão"
        />
        {canEdit && !editing && (
          <Button onClick={() => setEditing(true)}>
            {hasData ? 'Actualizar custos' : 'Registar custos'}
          </Button>
        )}
      </div>

      {editing && (
        <CostsForm
          data={data}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={(v) => onSave(v, () => setEditing(false))}
        />
      )}

      {!hasData ? (
        <EmptyState
          title="Sem custos registados"
          description="A aplicação não lê facturas de cloud — registe o custo mensal por categoria para ver os indicadores e a previsão."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile
              label="Custo actual"
              value={money(c.total, cur)}
              sub={
                c.changePercent === null
                  ? data.month
                    ? monthLabel(data.month)
                    : undefined
                  : `${monthLabel(data.month!)} · ${c.changePercent > 0 ? '+' : ''}${fmt(c.changePercent)}% vs. mês anterior`
              }
            />
            <Tile
              label="Custo por utilizador"
              value={money(c.perUser, cur)}
              sub={`${c.totalUsers.toLocaleString('pt-PT')} registados`}
            />
            <Tile
              label="Custo por utilizador activo"
              value={money(c.perActiveUser, cur)}
              sub={`${c.activeUsers.toLocaleString('pt-PT')} activos`}
            />
            <Tile
              label="Maior categoria"
              value={(() => {
                const top = [...data.categories]
                  .filter((x) => x.amount !== null)
                  .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0];
                return top ? COST_LABEL[top.category] : null;
              })()}
            />
          </div>

          <Card>
            <CardBody>
              <p className="mb-3 font-body text-sm font-semibold text-ink">
                Por categoria
              </p>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                      <th className="py-1.5 font-semibold">Categoria</th>
                      <th className="py-1.5 text-right font-semibold">Custo</th>
                      <th className="py-1.5 text-right font-semibold">Peso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.map((x) => (
                      <tr key={x.category} className="border-t border-border">
                        <td className="py-2 text-ink">
                          {COST_LABEL[x.category]}
                        </td>
                        <td className="py-2 text-right tabular-nums text-ink-muted">
                          {money(x.amount, cur) ?? '—'}
                        </td>
                        <td className="py-2 text-right tabular-nums text-ink-muted">
                          {x.percent === null ? '—' : `${fmt(x.percent)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>

          {data.history.length >= 2 && (
            <Card>
              <CardBody>
                <p className="mb-3 font-body text-sm font-semibold text-ink">
                  Evolução do custo mensal
                </p>
                <AreaLineChart
                  series={[
                    {
                      label: `Custo mensal (${cur})`,
                      points: data.history.map((h, i) => ({
                        x: i,
                        y: h.total,
                        xLabel: monthLabel(h.month),
                      })),
                    },
                  ]}
                  height={220}
                  yFormat={(v) => money(v, cur) ?? ''}
                />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <p className="mb-3 font-body text-sm font-semibold text-ink">
                Previsão por número de utilizadores
              </p>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                      <th className="py-1.5 font-semibold">Utilizadores</th>
                      <th className="py-1.5 text-right font-semibold">
                        Custo estimado / mês
                      </th>
                      <th className="py-1.5 text-right font-semibold">
                        Por ano
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projection.map((p) => (
                      <tr key={p.users} className="border-t border-border">
                        <td className="py-2 tabular-nums text-ink">
                          {p.users.toLocaleString('pt-PT')}
                        </td>
                        <td className="py-2 text-right tabular-nums text-ink-muted">
                          {money(p.estimated, cur) ?? '—'}
                        </td>
                        <td className="py-2 text-right tabular-nums text-ink-muted">
                          {p.estimated === null
                            ? '—'
                            : money(p.estimated * 12, cur)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}
      <Note>{data.note}</Note>
    </div>
  );
}

// ─── §22 Alertas — regras automáticas ──────────────────────

const GROUP_LABEL: Record<AlertRuleGroup, string> = {
  CAPACITY: 'Capacidade',
  PERFORMANCE: 'Performance',
  GROWTH: 'Crescimento',
  RESILIENCE: 'Resiliência',
};

const RULE_STATE: Record<
  AlertRule['state'],
  { label: string; intent: Intent }
> = {
  OK: { label: 'OK', intent: 'success' },
  TRIGGERED: { label: 'Disparada', intent: 'danger' },
  UNAVAILABLE: { label: 'Sem dados', intent: 'neutral' },
};

export interface AlertRulesSectionProps {
  data: AlertRulesData | null;
  canEdit: boolean;
  evaluating?: boolean;
  onEvaluate: () => void;
}

export function AlertRulesSection({
  data,
  canEdit,
  evaluating = false,
  onEvaluate,
}: AlertRulesSectionProps) {
  if (!data) return null;
  const s = data.summary;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header
          title="Regras automáticas"
          sub={`${s.triggered} disparada(s) de ${s.total} · ${s.unavailable} sem dados · avaliado às ${new Date(data.evaluatedAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`}
        />
        {canEdit && (
          <Button intent="secondary" onClick={onEvaluate} disabled={evaluating}>
            {evaluating ? 'A avaliar…' : 'Avaliar agora'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.groups.map((g) => (
          <Card key={g.group}>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-body text-sm font-semibold text-ink">
                  {GROUP_LABEL[g.group]}
                </p>
                <Badge
                  intent={g.triggered > 0 ? 'danger' : 'success'}
                  dot={false}
                >
                  {g.triggered > 0 ? `${g.triggered} disparada(s)` : 'Tudo OK'}
                </Badge>
              </div>
              <ul className="flex flex-col divide-y divide-border">
                {g.rules.map((r) => (
                  <li
                    key={r.key}
                    className="flex items-start justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-body text-sm text-ink">{r.label}</p>
                      <p className="font-body text-[11px] text-ink-faint">
                        {r.condition} · {r.detail}
                      </p>
                    </div>
                    <Badge intent={RULE_STATE[r.state].intent} dot={false}>
                      {RULE_STATE[r.state].label}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>
      <Note>{data.note}</Note>
    </div>
  );
}
