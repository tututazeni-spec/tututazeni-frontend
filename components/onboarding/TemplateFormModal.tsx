// components/onboarding/TemplateFormModal.tsx
// Modal único de criação e edição de um plano de integração (template de
// onboarding). Aberto do cabeçalho do separador "Templates" ("+ Novo
// template", só EVAL_CREATOR_ROLES — ver page.tsx) e do TemplateDetailModal
// ("Editar", só ADMIN/RH). Segue o padrão de
// components/competencies/CompetencyFormModal — a page/modal só monta o
// componente quando está aberto (Modal sempre `open`, onOpenChange delega
// em onClose).
//
// Criar → POST /onboarding/templates; editar → PUT /onboarding/templates/:id
// (onboarding.controller.ts). DTO: name e durationDays obrigatórios;
// description/company/location/departmentId/positionId/welcomeVideoUrl/
// active opcionais. `active` default true no backend — na criação só é
// enviado quando desligado; na edição é sempre enviado (é a única forma de
// "arquivar" um template, não há endpoint dedicado). learningPathId fica
// fora deste formulário (v1) e não é tocado no update.
//
// Estrutura (tasks): só na criação — CreateOnboardingTemplateDto aceita um
// array `tasks` criado atomicamente com o template (cada item já com
// categoria, fase, responsável e prazo); UpdateOnboardingTemplateDto omite
// `tasks` de propósito (ValidationPipe é forbidNonWhitelisted, por isso
// enviá-lo num PUT rebentaria com 400) — editar/adicionar tarefas de um
// template existente continua só no TemplateDetailModal (ADMIN/RH).

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import type { DepartmentNode } from '@/components/departments/types';
import type { Position } from '@/components/departments/types';
import {
  CATEGORY_CFG,
  PHASE_LABELS,
  PHASE_ORDER,
  RESPONSIBLE_LABELS,
} from './constants';
import { useUnitOptions } from './planData';
import {
  DEFAULT_WELCOME_MESSAGE,
  WELCOME_NAME_TOKEN,
  objectivesForDepartment,
  planNameForDepartment,
  suggestionsForFilters,
} from './catalog';
import type {
  OnboardingTemplateDetail,
  ResponsibleRole,
  TaskCategory,
  TaskPhase,
  TaskType,
} from './types';
import { Checkbox } from '@/components/ui/Checkbox';
import { EmptyState } from '@/components/ui/EmptyState';

export interface TemplateFormModalProps {
  /** Ausente/null → criar; template → editar esse template. */
  template?: OnboardingTemplateDetail | null;
  onClose: () => void;
}

// Durações típicas de um plano de integração. O DTO aceita qualquer inteiro
// >= 1, mas estas cobrem os casos reais e evitam entrada livre. Uma duração
// existente fora da lista é acrescentada dinamicamente.
const BASE_DURATIONS = ['7', '15', '30', '60', '90'];

const NO_DEPT = 'NONE';
const NO_POSITION = 'NONE';
const NO_UNIT = 'NONE';
const ALL = 'ALL';
const MANUAL_TITLE = '__manual__';

interface TaskDraft {
  key: number;
  title: string;
  category: TaskCategory | '';
  // Etapa/responsável/prazo funcionam também como filtros da lista de
  // sugestões do título — '' = sem filtro (assume-se PRE_BOARDING/SELF/0 ao gravar).
  phase: TaskPhase | '';
  responsible: ResponsibleRole | '';
  dueDayOffset: string;
  // Título escrito à mão em vez de escolhido da lista de sugestões.
  manual: boolean;
  xpReward: string;
  // Formação obrigatória (e qualquer outro item da Estrutura) — default
  // true, batendo com o default do backend (schema.prisma); desmarcar
  // marca o item como opcional (ex.: formação avançada para seniores).
  isMandatory: boolean;
}

let nextDraftKey = 0;
const emptyTask = (): TaskDraft => ({
  key: nextDraftKey++,
  title: '',
  category: '',
  phase: '',
  responsible: '',
  dueDayOffset: '',
  manual: false,
  xpReward: '10',
  isMandatory: true,
});

// TaskType não é exposto na Estrutura desta modal (fica implícito pela
// categoria) — editar o tipo exacto de uma tarefa continua possível depois,
// no TemplateTaskFormModal (ADMIN/RH).
function typeForCategory(category: TaskCategory): TaskType {
  if (category === 'DOCUMENTS' || category === 'POLICIES') return 'DOCUMENT';
  if (category === 'TRAINING') return 'COURSE';
  if (category === 'MEETING' || category === 'ONE_ON_ONE') return 'MEETING';
  return 'TASK';
}

function flattenDeptTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenDeptTree(n.children ?? [], depth + 1),
  ]);
}

const CATEGORY_ITEMS = Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
const splitObjectives = (raw: string | null | undefined): string[] =>
  (raw ?? '')
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean);
const PHASE_ITEMS = [
  { value: ALL, label: 'Todas as etapas' },
  ...PHASE_ORDER.map((value) => ({ value, label: PHASE_LABELS[value] })),
];
const RESPONSIBLE_ITEMS = [
  { value: ALL, label: 'Todos os colaboradores' },
  ...Object.entries(RESPONSIBLE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

interface TemplateFormModalFormValues {
  name: string;
  description: string;
  objectives: string[];
  customObjective: string;
  nameTouched: boolean;
  departmentId: string;
  unitId: string;
  positionId: string;
  durationDays: string;
  welcomeMessage: string;
  active: boolean;
  tasks: TaskDraft[];
  submitError: string;
}

export function TemplateFormModal({
  template,
  onClose,
}: TemplateFormModalProps) {
  const notify = useToast();
  const editing = template != null;

  const { values: formValues, set: setField } =
    useFormState<TemplateFormModalFormValues>({
      name: template?.name ?? '',
      description: template?.description ?? '',
      objectives: splitObjectives(template?.objective),
      customObjective: '',
      nameTouched: template != null,
      departmentId:
        template?.departmentId != null
          ? String(template.departmentId)
          : NO_DEPT,
      unitId: template?.unitId != null ? String(template.unitId) : NO_UNIT,
      positionId:
        template?.positionId != null
          ? String(template.positionId)
          : NO_POSITION,
      durationDays: String(template?.durationDays ?? 30),
      welcomeMessage: template?.welcomeMessage ?? DEFAULT_WELCOME_MESSAGE,
      active: template?.active ?? true,
      tasks: [],
      submitError: '',
    });
  const {
    name,
    description,
    objectives,
    customObjective,
    nameTouched,
    departmentId,
    unitId,
    positionId,
    durationDays,
    welcomeMessage,
    active,
    tasks,
    submitError,
  } = formValues;

  const { data: deptTree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: positionsResp } = useApiQuery<Position[]>(
    queryKeys.positions.list(),
    '/positions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { options: unitOptions } = useUnitOptions();

  const deptItems = [
    { value: NO_DEPT, label: 'Sem departamento' },
    ...flattenDeptTree(deptTree ?? []),
  ];
  const positionItems = [
    { value: NO_POSITION, label: 'Sem cargo/função' },
    ...(positionsResp ?? []).map((p) => ({
      value: String(p.id),
      label: p.name,
    })),
  ];
  const deptName =
    departmentId !== NO_DEPT
      ? (deptItems.find((d) => d.value === departmentId)?.label ?? null)
      : null;
  const objectiveOptions = objectivesForDepartment(deptName);
  const onDepartmentChange = (v: string) => {
    setField('departmentId', v);
    const label = deptItems.find((d) => d.value === v)?.label;
    if (v !== NO_DEPT && label && !nameTouched) {
      setField('name', planNameForDepartment(label));
    }
    // Objectivos sugeridos são por departamento: ao mudar, descartam-se os
    // escolhidos da lista anterior e mantêm-se só os escritos à mão.
    setField('objectives', (prev) =>
      prev.filter((o) => !objectiveOptions.includes(o)),
    );
  };
  const toggleObjective = (o: string) =>
    setField('objectives', (prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    );
  const addCustomObjective = () => {
    const o = customObjective.trim();
    if (!o) return;
    setField('objectives', (prev) => (prev.includes(o) ? prev : [...prev, o]));
    setField('customObjective', '');
  };
  const unitItems = [{ value: NO_UNIT, label: 'Sem unidade' }, ...unitOptions];

  const durationItems = Array.from(new Set([...BASE_DURATIONS, durationDays]))
    .map(Number)
    .sort((a, b) => a - b)
    .map((d) => ({ value: String(d), label: `${d} dias` }));

  const tasksValid = tasks.every(
    (t) => t.title.trim().length > 0 && t.category !== '',
  );
  const canSubmit = name.trim().length > 0 && tasksValid;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/onboarding/templates/${template.id}`, body)
        : apiClient.post('/onboarding/templates', body),
    {
      invalidateKeys: editing
        ? [queryKeys.onboarding.all, queryKeys.onboarding.template(template.id)]
        : [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({
          title: editing
            ? 'Template actualizado'
            : 'Plano de integração criado',
          description:
            editing || tasks.length > 0
              ? undefined
              : 'Adicione as tarefas no detalhe do template.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao guardar o template. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const addTask = () => setField('tasks', (prev) => [...prev, emptyTask()]);
  const removeTask = (key: number) =>
    setField('tasks', (prev) => prev.filter((t) => t.key !== key));
  const patchTask = (key: number, patch: Partial<TaskDraft>) =>
    setField('tasks', (prev) =>
      prev.map((t) => (t.key === key ? { ...t, ...patch } : t)),
    );

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    const payload: Record<string, unknown> = {
      name: name.trim(),
      durationDays: Number(durationDays),
    };
    if (description.trim()) payload.description = description.trim();
    else if (editing) payload.description = null;
    const allObjectives = customObjective.trim()
      ? [...objectives, customObjective.trim()]
      : objectives;
    if (allObjectives.length > 0) payload.objective = allObjectives.join('\n');
    else if (editing) payload.objective = null;
    if (departmentId !== NO_DEPT) payload.departmentId = Number(departmentId);
    else if (editing) payload.departmentId = null;
    if (positionId !== NO_POSITION) payload.positionId = Number(positionId);
    else if (editing) payload.positionId = null;
    if (unitId !== NO_UNIT) payload.unitId = Number(unitId);
    else if (editing) payload.unitId = null;
    // A mensagem geral não se grava: o colaborador vê-a por omissão.
    const customWelcome = welcomeMessage.trim();
    if (customWelcome && customWelcome !== DEFAULT_WELCOME_MESSAGE)
      payload.welcomeMessage = customWelcome;
    else if (editing) payload.welcomeMessage = null;
    // Criar: backend usa default true, só enviamos quando desligado.
    // Editar: enviamos sempre (é o mecanismo de "arquivar").
    if (editing || !active) payload.active = active;
    // Estrutura só na criação (ver nota de topo — UpdateOnboardingTemplateDto
    // não aceita `tasks`).
    if (!editing && tasks.length > 0) {
      payload.tasks = tasks.map((t, seq) => ({
        title: t.title.trim(),
        category: t.category,
        type: typeForCategory(t.category as TaskCategory),
        phase: t.phase || 'PRE_BOARDING',
        responsible: t.responsible || 'SELF',
        isMandatory: t.isMandatory,
        dueDayOffset:
          t.dueDayOffset.trim() === '' ? 0 : Math.trunc(Number(t.dueDayOffset)),
        xpReward: Math.max(0, Math.trunc(Number(t.xpReward) || 0)),
        seq,
      }));
    }
    save.mutate(payload);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? 'Editar template' : 'Novo plano de integração'}
        description={
          editing
            ? 'Actualiza os dados do modelo de integração. Desligar "Template activo" arquiva-o.'
            : 'Informações gerais e Estrutura (tarefas) do plano — a Estrutura pode ser completada depois no detalhe do template.'
        }
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <div className="text-xs font-medium text-ink-faint uppercase tracking-wide">
            Informações gerais
          </div>

          <FormField label="Departamento" htmlFor="ot-department">
            <Select
              items={deptItems}
              value={departmentId}
              onValueChange={onDepartmentChange}
              className="w-full"
            />
          </FormField>

          <FormField label="Nome *" htmlFor="ot-name">
            <Input
              id="ot-name"
              value={name}
              onChange={(e) => {
                setField('name', e.target.value);
                setField('nameTouched', e.target.value.trim() !== '');
              }}
              placeholder="Ex.: Plano de Integração da área de Auditoria"
              maxLength={200}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="ot-description">
            <Textarea
              id="ot-description"
              value={description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Opcional — âmbito do plano."
              rows={3}
              className="w-full"
            />
          </FormField>

          <FormField label="Objectivos" htmlFor="ot-objective">
            <div className="space-y-2">
              <ul
                role="group"
                aria-label="Objectivos sugeridos"
                className="max-h-56 divide-y divide-border overflow-y-auto rounded-card border border-border"
              >
                {[
                  ...objectiveOptions,
                  ...objectives.filter((o) => !objectiveOptions.includes(o)),
                ].map((o) => (
                  <li key={o}>
                    <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm text-ink">
                      <Checkbox
                        checked={objectives.includes(o)}
                        onChange={() => toggleObjective(o)}
                      />
                      <span>{o}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink-faint">
                {objectives.length} seleccionado
                {objectives.length === 1 ? '' : 's'}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="ot-objective"
                  value={customObjective}
                  onChange={(e) => setField('customObjective', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomObjective();
                    }
                  }}
                  placeholder="Ou escreva um objectivo e prima Adicionar"
                  className="w-full"
                />
                <Button
                  size="sm"
                  intent="ghost"
                  type="button"
                  onClick={addCustomObjective}
                  disabled={!customObjective.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Duração *" htmlFor="ot-duration">
              <Select
                items={durationItems}
                value={durationDays}
                onValueChange={(v) => setField('durationDays', v)}
                className="w-full"
              />
            </FormField>

            <FormField label="Unidade" htmlFor="ot-unit">
              <Select
                items={unitItems}
                value={unitId}
                onValueChange={(v) => setField('unitId', v)}
                className="w-full"
              />
            </FormField>

            <FormField label="Cargo / Função" htmlFor="ot-position">
              <Select
                items={positionItems}
                value={positionId}
                onValueChange={(v) => setField('positionId', v)}
                className="w-full"
              />
              <p className="mt-1 text-xs text-ink-faint">
                Todo novo utilizador com este cargo recebe este plano
                automaticamente.
              </p>
            </FormField>
          </div>

          <FormField label="Mensagem de boas-vindas" htmlFor="ot-welcome">
            <Textarea
              id="ot-welcome"
              value={welcomeMessage}
              onChange={(e) => setField('welcomeMessage', e.target.value)}
              placeholder="Opcional — mensagem mostrada ao colaborador no início do plano."
              rows={3}
              maxLength={2000}
              className="w-full"
            />
            <p className="mt-1 text-xs text-ink-faint">
              Escreva {WELCOME_NAME_TOKEN} para inserir automaticamente o nome
              do colaborador. Vale para todos os departamentos.
            </p>
          </FormField>

          <button
            type="button"
            aria-pressed={active}
            onClick={() => setField('active', (v) => !v)}
            className={cn(
              'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
              active
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border-strong bg-surface text-ink-muted',
            )}
          >
            Template activo
          </button>

          {!editing && (
            <>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div className="text-xs font-medium text-ink-faint uppercase tracking-wide">
                  Estrutura (Tarefas, Formação, Documentos, Acessos, Políticas,
                  Reuniões, Avaliações…)
                </div>
                <Button
                  size="sm"
                  intent="ghost"
                  onClick={addTask}
                  type="button"
                >
                  <Plus size={14} strokeWidth={1.75} className="mr-1" />
                  Adicionar item
                </Button>
              </div>

              {tasks.length === 0 && (
                <EmptyState
                  variant="inline"
                  title="Sem itens — pode adicionar agora ou depois no detalhe do template"
                />
              )}

              <div className="space-y-3">
                {tasks.map((t) => (
                  <div
                    key={t.key}
                    className="rounded-card border border-border p-3 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Select
                        items={CATEGORY_ITEMS}
                        value={t.category || undefined}
                        onValueChange={(v) =>
                          patchTask(t.key, { category: v as TaskCategory })
                        }
                        placeholder="Categoria"
                        className="w-full"
                      />
                      <Select
                        items={PHASE_ITEMS}
                        value={t.phase || undefined}
                        onValueChange={(v) =>
                          patchTask(t.key, {
                            phase: v === ALL ? '' : (v as TaskPhase),
                          })
                        }
                        placeholder="Etapa"
                        className="w-full"
                      />
                      <Select
                        items={RESPONSIBLE_ITEMS}
                        value={t.responsible || undefined}
                        onValueChange={(v) =>
                          patchTask(t.key, {
                            responsible:
                              v === ALL ? '' : (v as ResponsibleRole),
                          })
                        }
                        placeholder="Colaborador"
                        className="w-full"
                      />
                      <Input
                        aria-label="Prazo (dias)"
                        type="number"
                        min={0}
                        value={t.dueDayOffset}
                        onChange={(e) =>
                          patchTask(t.key, { dueDayOffset: e.target.value })
                        }
                        placeholder="Prazo (dia)"
                        className="w-full"
                      />
                    </div>
                    {(() => {
                      const options = suggestionsForFilters({
                        category: t.category,
                        phase: t.phase,
                        responsible: t.responsible,
                        maxDay: t.dueDayOffset,
                      });
                      const titleItems = [
                        ...options.map((o) => ({
                          value: o.title,
                          label: o.title,
                        })),
                        {
                          value: MANUAL_TITLE,
                          label: 'Escrever manualmente…',
                        },
                      ];
                      const picked = options.find((o) => o.title === t.title);
                      return (
                        <div className="flex items-start gap-2">
                          <div className="w-full space-y-2">
                            <Select
                              items={titleItems}
                              value={
                                t.manual
                                  ? MANUAL_TITLE
                                  : picked
                                    ? picked.title
                                    : undefined
                              }
                              onValueChange={(v) => {
                                if (v === MANUAL_TITLE) {
                                  patchTask(t.key, { manual: true, title: '' });
                                  return;
                                }
                                const o = options.find((x) => x.title === v);
                                if (!o) return;
                                patchTask(t.key, {
                                  manual: false,
                                  title: o.title,
                                  category: t.category || o.category,
                                  phase: t.phase || o.phase,
                                  responsible: t.responsible || o.responsible,
                                  dueDayOffset:
                                    t.dueDayOffset.trim() === ''
                                      ? String(o.dueDay)
                                      : t.dueDayOffset,
                                });
                              }}
                              placeholder="Escolher item (ex.: Entregar documentos de admissão)"
                              className="w-full"
                            />
                            {t.manual && (
                              <Input
                                aria-label="Título do item"
                                value={t.title}
                                onChange={(e) =>
                                  patchTask(t.key, { title: e.target.value })
                                }
                                placeholder="Escreva o título do item"
                                maxLength={200}
                                className="w-full"
                              />
                            )}
                          </div>
                          <Button
                            size="sm"
                            intent="ghost"
                            onClick={() => removeTask(t.key)}
                            type="button"
                            aria-label="Remover item"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </Button>
                        </div>
                      );
                    })()}
                    <label className="flex items-center gap-2 text-xs text-ink-muted">
                      <Checkbox
                        checked={t.isMandatory}
                        onChange={(e) =>
                          patchTask(t.key, { isMandatory: e.target.checked })
                        }
                      />
                      Obrigatória (ex.: Formação obrigatória) — desmarcar
                      torna-a opcional
                    </label>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            {editing ? 'Guardar' : 'Criar plano de integração'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
