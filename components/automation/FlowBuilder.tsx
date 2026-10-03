// components/automation/FlowBuilder.tsx
// Construtor de Fluxos (docs/modulo_automation.md §4): página dedicada — o
// spec recomenda página em vez de modal porque os fluxos envolvem vários
// módulos e muitas condições. Secções A–F: informações gerais, gatilho,
// condições, fluxo, regras de execução, validação e publicação.
//
// Backend: POST /automation/rules (cria) ou PUT /automation/rules/:id/full
// (edita), POST …/validate, …/:id/test (simulação, sem efeitos),
// …/:id/publish (regista versão + autor e activa), GET …/:id/versions.

'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  Plus,
  Rocket,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import {
  CATEGORY_LABEL,
  OPERATOR_ITEMS,
  VALUELESS_OPERATORS,
} from './constants';
import { FlowEditor } from './FlowEditor';
import {
  countSteps,
  normaliseFlow,
  serialiseFlow,
  type FlowStep,
} from './flow';
import type {
  AutomationRule,
  AutomationRuleDetail,
  EventCatalog,
  RuleVersion,
  TestResult,
  ValidationResult,
} from './types';

const NONE = '__none__';

// Prioridade do spec → inteiro do backend (menor corre primeiro).
const PRIORITY_ITEMS = [
  { value: '3', label: 'Baixa' },
  { value: '2', label: 'Normal' },
  { value: '1', label: 'Alta' },
  { value: '0', label: 'Crítica' },
];
const RETRY_ITEMS = [
  { value: 'NONE', label: 'Sem novas tentativas' },
  { value: 'FIXED', label: 'Intervalo fixo' },
  { value: 'EXPONENTIAL', label: 'Intervalo crescente (×2)' },
];
const ERROR_ITEMS = [
  { value: 'NOTIFY_OWNER', label: 'Notificar o responsável' },
  { value: 'LOG', label: 'Apenas registar' },
  { value: 'DISABLE_RULE', label: 'Desactivar a automação' },
];
const LOGIC_ITEMS = [
  { value: 'AND', label: 'E — todas as condições' },
  { value: 'OR', label: 'OU — qualquer condição' },
];
const CATEGORY_ITEMS = [
  { value: NONE, label: 'Sem categoria' },
  ...Object.entries(CATEGORY_LABEL)
    .filter(([k]) => k !== 'AUTOMATION')
    .map(([value, label]) => ({ value, label })),
];

const SAMPLE_PAYLOAD = '{\n  "userId": 1,\n  "departmentId": "10"\n}';

function Section({
  letter,
  title,
  hint,
  children,
}: {
  letter: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-baseline gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-data text-xs font-bold text-primary">
            {letter}
          </span>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              {title}
            </h3>
            {hint && <p className="font-body text-xs text-ink-muted">{hint}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
      </CardBody>
    </Card>
  );
}

interface ConditionRow {
  field: string;
  operator: string;
  value: string;
}

export interface FlowBuilderProps {
  /** Regra a editar; sem valor = nova automação. */
  ruleId?: number;
  onClose: () => void;
}

export function FlowBuilder({ ruleId, onClose }: FlowBuilderProps) {
  const notify = useToast();
  const [savedId, setSavedId] = useState<number | undefined>(ruleId);
  const editing = savedId !== undefined;

  const { data: detail, isLoading: loadingDetail } =
    useApiQuery<AutomationRuleDetail>(
      queryKeys.automation.rule(ruleId ?? 0),
      `/automation/rules/${ruleId}`,
      { enabled: ruleId !== undefined, staleTime: 0 },
    );
  const { data: catalog } = useApiQuery<EventCatalog>(
    queryKeys.automation.eventCatalog(),
    '/automation/events/catalog',
    { staleTime: STALE_TIME.STATIC },
  );
  const { data: allRules = [] } = useApiQuery<AutomationRule[]>(
    queryKeys.automation.rules({}),
    '/automation/rules',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: versions = [] } = useApiQuery<RuleVersion[]>(
    queryKeys.automation.versions(savedId ?? 0),
    `/automation/rules/${savedId}/versions`,
    { enabled: savedId !== undefined, staleTime: 0 },
  );

  // ── A. Informações gerais ──────────────────────────────────────
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(NONE);
  const [moduleName, setModuleName] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [priority, setPriority] = useState('2');
  const [tags, setTags] = useState('');
  // ── B. Gatilho / C. Condições ─────────────────────────────────
  const [trigger, setTrigger] = useState('');
  const [conditions, setConditions] = useState<ConditionRow[]>([]);
  const [conditionsLogic, setConditionsLogic] = useState('AND');
  // ── D. Fluxo ──────────────────────────────────────────────────
  const [steps, setSteps] = useState<FlowStep[]>([]);
  // ── E. Regras de execução ─────────────────────────────────────
  const [retryPolicy, setRetryPolicy] = useState('NONE');
  const [maxRetries, setMaxRetries] = useState('3');
  const [retryDelay, setRetryDelay] = useState('5');
  const [errorHandling, setErrorHandling] = useState('NOTIFY_OWNER');
  const [notifyOnError, setNotifyOnError] = useState(true);
  const [activeFrom, setActiveFrom] = useState('');
  const [activeUntil, setActiveUntil] = useState('');
  const [notes, setNotes] = useState('');
  // ── F. Validação ──────────────────────────────────────────────
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [samplePayload, setSamplePayload] = useState(SAMPLE_PAYLOAD);
  const [sampleError, setSampleError] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [publishNote, setPublishNote] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [wasDraft, setWasDraft] = useState(true);
  const [wasActive, setWasActive] = useState(false);

  useEffect(() => {
    if (!detail) return;
    setName(detail.name);
    setDescription(detail.description ?? '');
    setCategory(detail.category ?? NONE);
    setModuleName(detail.module ?? '');
    setOwnerId(detail.ownerId ?? '');
    setPriority(String(Math.min(detail.priority ?? 2, 3)));
    setTags((detail.tags ?? []).join(', '));
    setTrigger(detail.trigger);
    setConditions(
      (detail.conditions ?? []).map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value ?? '',
      })),
    );
    setConditionsLogic(detail.conditionsLogic ?? 'AND');
    setSteps(
      detail.flow
        ? normaliseFlow(detail.flow)
        : [
            {
              id: 'legacy',
              type: 'action',
              action: detail.action,
              params: detail.actionParams ?? {},
            },
          ],
    );
    setRetryPolicy(detail.retryPolicy ?? 'NONE');
    setMaxRetries(String(detail.maxRetries ?? 3));
    setRetryDelay(String(detail.retryDelayMinutes ?? 5));
    setErrorHandling(detail.errorHandling ?? 'NOTIFY_OWNER');
    setNotifyOnError(detail.notifyOnError ?? true);
    setActiveFrom(detail.activeFrom ? detail.activeFrom.slice(0, 10) : '');
    setActiveUntil(detail.activeUntil ? detail.activeUntil.slice(0, 10) : '');
    setNotes(detail.notes ?? '');
    setWasDraft(!!detail.draft);
    setWasActive(detail.active);
  }, [detail]);

  const triggerItems = useMemo(
    () =>
      (catalog?.modules ?? []).flatMap((m) =>
        m.events
          .filter((e) => e.implemented && e.trigger)
          .map((e) => ({
            value: e.trigger as string,
            label: `${m.label} — ${e.label}`,
          })),
      ),
    [catalog],
  );
  const proposedCount = catalog?.summary.proposed ?? 0;

  const ruleOptions = useMemo(
    () =>
      allRules
        .filter((r) => r.id !== savedId)
        .map((r) => ({ value: String(r.id), label: r.name })),
    [allRules, savedId],
  );

  const buildBody = (draft: boolean) => {
    const validConditions = conditions
      .filter((c) => c.field.trim())
      .map((c) => ({
        field: c.field.trim(),
        operator: c.operator,
        value: VALUELESS_OPERATORS.has(c.operator)
          ? undefined
          : c.value.trim() || undefined,
      }));
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      name: name.trim(),
      trigger,
      flow: serialiseFlow(steps),
      draft,
      // Editar uma automação já publicada não a pausa nem a reactiva.
      ...(editing && !wasDraft ? { active: wasActive } : {}),
      description: description.trim() || undefined,
      ...(category !== NONE ? { category } : {}),
      ...(moduleName.trim() ? { module: moduleName.trim() } : {}),
      ...(ownerId.trim() ? { ownerId: ownerId.trim() } : {}),
      priority: Number(priority),
      tags: tagList,
      ...(validConditions.length
        ? { conditions: validConditions, conditionsLogic }
        : {}),
      retryPolicy,
      ...(retryPolicy !== 'NONE'
        ? {
            maxRetries: Number(maxRetries) || 0,
            retryDelayMinutes: Number(retryDelay) || 5,
          }
        : {}),
      errorHandling,
      notifyOnError,
      ...(activeFrom ? { activeFrom } : {}),
      ...(activeUntil ? { activeUntil } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
  };

  const invalidate = [
    queryKeys.automation.rules(),
    queryKeys.automation.stats(),
    [...queryKeys.automation.all, 'overview'],
    ...(savedId !== undefined ? [queryKeys.automation.rule(savedId)] : []),
  ];

  const save = useApiMutation(
    async (draft: boolean) => {
      const body = buildBody(draft);
      if (savedId !== undefined) {
        return apiClient.put<{ id: number }>(
          `/automation/rules/${savedId}/full`,
          body,
        );
      }
      return apiClient.post<{ id: number }>('/automation/rules', body);
    },
    {
      invalidateKeys: invalidate,
      onError: (e: Error) => setSubmitError(e.message || 'Erro ao guardar.'),
    },
  );
  const publish = useApiMutation(
    ({ id, note }: { id: number; note: string }) =>
      apiClient.post(`/automation/rules/${id}/publish`, {
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    {
      invalidateKeys: [
        ...invalidate,
        queryKeys.automation.versions(savedId ?? 0),
      ],
      onError: (e: Error) => setSubmitError(e.message || 'Erro ao publicar.'),
    },
  );
  const validate = useApiMutation(
    () =>
      apiClient.post<ValidationResult>(
        '/automation/rules/validate',
        buildBody(true),
      ),
    {
      onSuccess: (r: ValidationResult) => setValidation(r),
      onError: (e: Error) => setSubmitError(e.message),
    },
  );
  const test = useApiMutation(
    (payload: Record<string, unknown>) =>
      apiClient.post<TestResult>(`/automation/rules/${savedId}/test`, {
        payload,
      }),
    {
      onSuccess: (r: TestResult) => setTestResult(r),
      onError: (e: Error) => setSubmitError(e.message),
    },
  );

  const canSave = name.trim().length > 0 && !!trigger && steps.length > 0;
  const busy = save.isPending || publish.isPending;

  const saveDraft = async () => {
    setSubmitError('');
    // Uma automação já publicada guarda-se sem voltar a rascunho.
    const draft = !editing || wasDraft;
    const out = await save.mutateAsync(draft).catch(() => null);
    if (!out) return null;
    setSavedId(out.id);
    notify({
      title: draft ? 'Rascunho guardado' : 'Alterações guardadas',
      intent: 'success',
    });
    return out.id;
  };

  const publishNow = async () => {
    setSubmitError('');
    const check = await validate.mutateAsync(undefined).catch(() => null);
    if (!check?.valid) return;
    const draft = !editing || wasDraft;
    const out = await save.mutateAsync(draft).catch(() => null);
    if (!out) return;
    setSavedId(out.id);
    const done = await publish
      .mutateAsync({ id: out.id, note: publishNote })
      .then(() => true)
      .catch(() => false);
    if (!done) return;
    notify({ title: 'Automação publicada', intent: 'success' });
    onClose();
  };

  const runTest = () => {
    setSampleError('');
    let payload: Record<string, unknown> = {};
    try {
      payload = samplePayload.trim() ? JSON.parse(samplePayload) : {};
    } catch {
      setSampleError('JSON inválido');
      return;
    }
    test.mutate(payload);
  };

  const setCondition = (i: number, p: Partial<ConditionRow>) =>
    setConditions((rows) => rows.map((r, k) => (k === i ? { ...r, ...p } : r)));

  if (ruleId !== undefined && loadingDetail) {
    return <Skeleton rows={5} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            label="Voltar"
            intent="ghost"
            onClick={onClose}
          />
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              {editing ? 'Editar automação' : 'Nova automação'}
            </h2>
            <p className="font-body text-xs text-ink-muted">
              Estado:{' '}
              <Badge intent={wasDraft || !editing ? 'warning' : 'success'}>
                {!editing || wasDraft
                  ? 'Rascunho'
                  : `Publicada v${detail?.version ?? ''}`}
              </Badge>
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink"
        >
          <AlertCircle size={16} strokeWidth={1.75} />
          {submitError}
        </div>
      )}

      <Section letter="A" title="Informações gerais">
        <FormField label="Nome da automação *" htmlFor="fb-name">
          <Input
            id="fb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            placeholder="Ex.: Lembrete de formação 24 h antes"
          />
        </FormField>
        <FormField
          label="Descrição e finalidade"
          htmlFor="fb-description"
          hint="O código é gerado automaticamente."
        >
          <Textarea
            id="fb-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full"
          />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Categoria" htmlFor="fb-category">
            <Select
              items={CATEGORY_ITEMS}
              value={category}
              onValueChange={setCategory}
              className="w-full"
            />
          </FormField>
          <FormField label="Módulo principal" htmlFor="fb-module">
            <Input
              id="fb-module"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="Ex.: PDI"
            />
          </FormField>
          <FormField label="Prioridade" htmlFor="fb-priority">
            <Select
              items={PRIORITY_ITEMS}
              value={priority}
              onValueChange={setPriority}
              className="w-full"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Responsável"
            htmlFor="fb-owner"
            hint="userId — por omissão, quem cria."
          >
            <Input
              id="fb-owner"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            />
          </FormField>
          <FormField
            label="Etiquetas"
            htmlFor="fb-tags"
            hint="Separadas por vírgulas."
          >
            <Input
              id="fb-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="lembrete, formação"
            />
          </FormField>
        </div>
      </Section>

      <Section
        letter="B"
        title="Gatilho — quando deve começar?"
        hint="Eventos publicados pelos módulos da INNOVA. Para execuções por data e hora, use o separador Agendamentos."
      >
        <FormField label="Evento *" htmlFor="fb-trigger">
          <Select
            items={triggerItems}
            value={trigger || undefined}
            onValueChange={setTrigger}
            placeholder="Escolher evento"
            className="w-full"
          />
        </FormField>
        {proposedCount > 0 && (
          <p className="font-body text-xs text-ink-muted">
            Há mais {proposedCount} eventos propostos no spec que ainda não são
            emitidos pelos módulos — ver o catálogo abaixo.
          </p>
        )}
      </Section>

      <Section
        letter="C"
        title="Condições — em que circunstâncias?"
        hint="Condições sobre os dados do evento. Sem linhas, corre sempre que o gatilho ocorre. Para decidir a meio do fluxo, use um bloco Condição Sim / Não."
      >
        {conditions.map((row, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[130px] flex-1">
              <FormField label="Campo" htmlFor={`fb-c-f-${i}`}>
                <Input
                  id={`fb-c-f-${i}`}
                  value={row.field}
                  onChange={(e) => setCondition(i, { field: e.target.value })}
                  placeholder="ex.: departmentId"
                />
              </FormField>
            </div>
            <div className="min-w-[150px] flex-1">
              <FormField label="Operador" htmlFor={`fb-c-o-${i}`}>
                <Select
                  items={OPERATOR_ITEMS}
                  value={row.operator}
                  onValueChange={(v) => setCondition(i, { operator: v })}
                  className="w-full"
                />
              </FormField>
            </div>
            {!VALUELESS_OPERATORS.has(row.operator) && (
              <div className="min-w-[130px] flex-1">
                <FormField label="Valor" htmlFor={`fb-c-v-${i}`}>
                  <Input
                    id={`fb-c-v-${i}`}
                    value={row.value}
                    onChange={(e) => setCondition(i, { value: e.target.value })}
                  />
                </FormField>
              </div>
            )}
            <IconButton
              icon={Trash2}
              label="Remover condição"
              intent="ghost"
              className="mb-0.5 hover:bg-danger-subtle hover:text-danger"
              onClick={() =>
                setConditions((rows) => rows.filter((_, k) => k !== i))
              }
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            intent="secondary"
            onClick={() =>
              setConditions((rows) => [
                ...rows,
                { field: '', operator: 'equals', value: '' },
              ])
            }
          >
            <Plus size={14} strokeWidth={1.75} />
            Adicionar condição
          </Button>
          {conditions.length > 1 && (
            <Select
              items={LOGIC_ITEMS}
              value={conditionsLogic}
              onValueChange={setConditionsLogic}
              className="min-w-[220px]"
            />
          )}
        </div>
      </Section>

      <Section
        letter="D"
        title="Fluxo — o que deve acontecer?"
        hint={`${countSteps(steps)} etapas. Acções, atrasos e ramificações Sim / Não, executadas por esta ordem.`}
      >
        <FlowEditor
          steps={steps}
          onChange={setSteps}
          ruleOptions={ruleOptions}
        />
      </Section>

      <Section
        letter="E"
        title="Regras de execução"
        hint="Repetições, tratamento de erros e vigência. Eventos repetidos (mesmo identificador) nunca executam duas vezes, e o sistema impede ciclos entre automações."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Novas tentativas" htmlFor="fb-retry">
            <Select
              items={RETRY_ITEMS}
              value={retryPolicy}
              onValueChange={setRetryPolicy}
              className="w-full"
            />
          </FormField>
          {retryPolicy !== 'NONE' && (
            <>
              <FormField label="Máximo de tentativas" htmlFor="fb-max-retries">
                <Input
                  id="fb-max-retries"
                  type="number"
                  min={0}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(e.target.value)}
                />
              </FormField>
              <FormField
                label="Intervalo (minutos)"
                htmlFor="fb-retry-delay"
                hint="Retoma na etapa que falhou — não repete as já concluídas."
              >
                <Input
                  id="fb-retry-delay"
                  type="number"
                  min={1}
                  value={retryDelay}
                  onChange={(e) => setRetryDelay(e.target.value)}
                />
              </FormField>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Em caso de falha persistente" htmlFor="fb-error">
            <Select
              items={ERROR_ITEMS}
              value={errorHandling}
              onValueChange={setErrorHandling}
              className="w-full"
            />
          </FormField>
          <FormField label="Vigência — de" htmlFor="fb-from" hint="Opcional.">
            <Input
              id="fb-from"
              type="date"
              value={activeFrom}
              onChange={(e) => setActiveFrom(e.target.value)}
            />
          </FormField>
          <FormField label="Vigência — até" htmlFor="fb-until" hint="Opcional.">
            <Input
              id="fb-until"
              type="date"
              value={activeUntil}
              onChange={(e) => setActiveUntil(e.target.value)}
            />
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            checked={notifyOnError}
            onChange={(e) => setNotifyOnError(e.target.checked)}
            className="h-4 w-4 rounded border-border-strong accent-primary"
          />
          Alertar o responsável quando uma execução falha
        </label>
        <FormField label="Observações" htmlFor="fb-notes">
          <Textarea
            id="fb-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full"
          />
        </FormField>
      </Section>

      <Section
        letter="F"
        title="Validação e publicação"
        hint="Valide, teste com dados de exemplo e publique. Cada publicação regista a versão e o autor."
      >
        <div className="flex flex-wrap gap-2">
          <Button
            intent="secondary"
            onClick={() => validate.mutate(undefined)}
            loading={validate.isPending}
            disabled={!canSave}
          >
            <ShieldCheck size={14} strokeWidth={1.75} />
            Validar
          </Button>
          <Button
            intent="secondary"
            onClick={() => void saveDraft()}
            loading={save.isPending}
            disabled={!canSave || busy}
          >
            <Save size={14} strokeWidth={1.75} />
            {!editing || wasDraft ? 'Guardar rascunho' : 'Guardar alterações'}
          </Button>
        </div>

        {validation && (
          <div
            role="status"
            className={
              validation.valid
                ? 'rounded-card bg-success-subtle p-3 text-sm text-success-ink'
                : 'rounded-card bg-danger-subtle p-3 text-sm text-danger-ink'
            }
          >
            <p className="flex items-center gap-2 font-semibold">
              {validation.valid ? (
                <CheckCircle2 size={16} strokeWidth={1.75} />
              ) : (
                <AlertCircle size={16} strokeWidth={1.75} />
              )}
              {validation.valid
                ? `Definição válida${validation.stats ? ` — ${validation.stats.steps} etapas (${validation.stats.actions} acções, ${validation.stats.conditions} condições, ${validation.stats.delays} atrasos)` : ''}`
                : 'Corrija antes de publicar:'}
            </p>
            <ul className="mt-1 list-disc pl-6">
              {validation.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
              {validation.warnings.map((w) => (
                <li key={w} className="text-ink-muted">
                  Aviso: {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-card border border-border p-3">
          <p className="mb-2 flex items-center gap-2 font-body text-sm font-semibold text-ink">
            <FlaskConical size={14} strokeWidth={1.75} />
            Testar com dados de exemplo
          </p>
          <p className="mb-2 font-body text-xs text-ink-muted">
            Simulação: percorre o fluxo e mostra o que aconteceria — não envia
            nada nem altera dados.{' '}
            {!savedId && 'Guarde o rascunho primeiro para poder testar.'}
          </p>
          <FormField
            label="Dados do evento (JSON)"
            htmlFor="fb-sample"
            error={sampleError}
          >
            <Textarea
              id="fb-sample"
              value={samplePayload}
              onChange={(e) => setSamplePayload(e.target.value)}
              rows={4}
              className="w-full font-data"
            />
          </FormField>
          <Button
            className="mt-2"
            size="sm"
            intent="secondary"
            onClick={runTest}
            loading={test.isPending}
            disabled={!savedId}
          >
            Executar teste
          </Button>
          {testResult && (
            <div className="mt-3 text-sm">
              {!testResult.wouldRun ? (
                <p className="text-warning-ink">
                  {testResult.message ?? 'Não correria com estes dados.'}
                </p>
              ) : (
                <ol className="flex flex-col gap-1.5">
                  {testResult.steps.map((s, i) => (
                    <li
                      key={`${s.ref}-${i}`}
                      className="rounded-control border border-border px-3 py-1.5"
                    >
                      {s.type === 'condition' && (
                        <>
                          Condição {s.label ? `“${s.label}”` : ''} →{' '}
                          <strong>
                            {s.decision === 'yes' ? 'Sim' : 'Não'}
                          </strong>
                        </>
                      )}
                      {s.type === 'delay' && (
                        <>
                          Aguardar {s.minutes} min (aos {s.atMinute} min)
                        </>
                      )}
                      {s.type === 'action' && (
                        <>
                          <span className="font-data">{s.action}</span>
                          {s.label ? ` — ${s.label}` : ''}
                          {s.atMinute ? ` (aos ${s.atMinute} min)` : ''}
                          {s.message && (
                            <span className="block text-xs text-ink-muted">
                              “{s.message}”
                            </span>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        <FormField
          label="Nota da versão"
          htmlFor="fb-publish-note"
          hint="Opcional — o que mudou."
        >
          <Input
            id="fb-publish-note"
            value={publishNote}
            onChange={(e) => setPublishNote(e.target.value)}
            maxLength={500}
          />
        </FormField>
        <div className="flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={() => void publishNow()}
            loading={busy}
            disabled={!canSave}
          >
            <Rocket size={14} strokeWidth={1.75} />
            Publicar
          </Button>
        </div>

        {versions.length > 0 && (
          <div>
            <h4 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Versões publicadas
            </h4>
            <ul className="flex flex-col gap-1 text-sm">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center gap-2 rounded-control border border-border px-3 py-1.5"
                >
                  <Badge intent="info" dot={false}>
                    v{v.version}
                  </Badge>
                  <span>{new Date(v.publishedAt).toLocaleString('pt')}</span>
                  <span className="text-ink-muted">
                    {v.publishedByName ?? ''}
                  </span>
                  {v.note && <span className="text-ink-muted">— {v.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}
