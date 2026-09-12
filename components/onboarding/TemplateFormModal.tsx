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

import { useState } from 'react';
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
import type { Position } from '@/components/organization/types';
import {
  CATEGORY_CFG,
  PHASE_LABELS,
  PHASE_ORDER,
  RESPONSIBLE_LABELS,
} from './constants';
import type {
  OnboardingTemplateDetail,
  ResponsibleRole,
  TaskCategory,
  TaskPhase,
  TaskType,
} from './types';

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

interface TaskDraft {
  key: number;
  title: string;
  category: TaskCategory | '';
  phase: TaskPhase;
  responsible: ResponsibleRole;
  dueDayOffset: string;
  xpReward: string;
}

let nextDraftKey = 0;
const emptyTask = (): TaskDraft => ({
  key: nextDraftKey++,
  title: '',
  category: '',
  phase: 'PRE_BOARDING',
  responsible: 'SELF',
  dueDayOffset: '0',
  xpReward: '10',
});

// TaskType não é exposto na Estrutura desta modal (fica implícito pela
// categoria) — editar o tipo exacto de uma tarefa continua possível depois,
// no TemplateTaskFormModal (ADMIN/RH).
function typeForCategory(category: TaskCategory): TaskType {
  if (category === 'DOCUMENTS' || category === 'POLICIES') return 'DOCUMENT';
  if (category === 'TRAINING') return 'COURSE';
  if (category === 'MEETING') return 'MEETING';
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
const PHASE_ITEMS = PHASE_ORDER.map((value) => ({
  value,
  label: PHASE_LABELS[value],
}));
const RESPONSIBLE_ITEMS = Object.entries(RESPONSIBLE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function TemplateFormModal({
  template,
  onClose,
}: TemplateFormModalProps) {
  const notify = useToast();
  const editing = template != null;

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [company, setCompany] = useState(template?.company ?? '');
  const [location, setLocation] = useState(template?.location ?? '');
  const [departmentId, setDepartmentId] = useState(
    template?.departmentId != null ? String(template.departmentId) : NO_DEPT,
  );
  const [positionId, setPositionId] = useState(
    template?.positionId != null ? String(template.positionId) : NO_POSITION,
  );
  const [durationDays, setDurationDays] = useState(
    String(template?.durationDays ?? 30),
  );
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState(
    template?.welcomeVideoUrl ?? '',
  );
  const [active, setActive] = useState(template?.active ?? true);
  const [tasks, setTasks] = useState<TaskDraft[]>([]);
  const [submitError, setSubmitError] = useState('');

  const { data: deptTree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: positionsResp } = useApiQuery<{ data: Position[] }>(
    queryKeys.organization.positions(''),
    '/organization/positions',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const deptItems = [
    { value: NO_DEPT, label: 'Sem departamento' },
    ...flattenDeptTree(deptTree ?? []),
  ];
  const positionItems = [
    { value: NO_POSITION, label: 'Sem cargo/função' },
    ...(positionsResp?.data ?? []).map((p) => ({
      value: String(p.id),
      label: p.name,
    })),
  ];

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
          title: editing ? 'Template actualizado' : 'Plano de integração criado',
          description:
            editing || tasks.length > 0
              ? undefined
              : 'Adicione as tarefas no detalhe do template.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao guardar o template. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const addTask = () => setTasks((prev) => [...prev, emptyTask()]);
  const removeTask = (key: number) =>
    setTasks((prev) => prev.filter((t) => t.key !== key));
  const patchTask = (key: number, patch: Partial<TaskDraft>) =>
    setTasks((prev) =>
      prev.map((t) => (t.key === key ? { ...t, ...patch } : t)),
    );

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    const payload: Record<string, unknown> = {
      name: name.trim(),
      durationDays: Number(durationDays),
    };
    if (description.trim()) payload.description = description.trim();
    else if (editing) payload.description = null;
    if (company.trim()) payload.company = company.trim();
    else if (editing) payload.company = null;
    if (location.trim()) payload.location = location.trim();
    else if (editing) payload.location = null;
    if (departmentId !== NO_DEPT) payload.departmentId = Number(departmentId);
    else if (editing) payload.departmentId = null;
    if (positionId !== NO_POSITION) payload.positionId = Number(positionId);
    else if (editing) payload.positionId = null;
    if (welcomeVideoUrl.trim())
      payload.welcomeVideoUrl = welcomeVideoUrl.trim();
    else if (editing) payload.welcomeVideoUrl = null;
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
        phase: t.phase,
        responsible: t.responsible,
        dueDayOffset: t.dueDayOffset.trim() === '' ? 0 : Math.trunc(Number(t.dueDayOffset)),
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

          <FormField label="Nome *" htmlFor="ot-name">
            <Input
              id="ot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Onboarding Colaborador TI"
              maxLength={200}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="ot-description">
            <Textarea
              id="ot-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — objectivo e âmbito do plano."
              rows={3}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Duração *" htmlFor="ot-duration">
              <Select
                items={durationItems}
                value={durationDays}
                onValueChange={setDurationDays}
                className="w-full"
              />
            </FormField>

            <FormField label="Empresa" htmlFor="ot-company">
              <Input
                id="ot-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Opcional"
                maxLength={200}
                className="w-full"
              />
            </FormField>

            <FormField label="Departamento" htmlFor="ot-department">
              <Select
                items={deptItems}
                value={departmentId}
                onValueChange={setDepartmentId}
                className="w-full"
              />
            </FormField>

            <FormField label="Cargo / Função" htmlFor="ot-position">
              <Select
                items={positionItems}
                value={positionId}
                onValueChange={setPositionId}
                className="w-full"
              />
            </FormField>

            <FormField label="Localização" htmlFor="ot-location">
              <Input
                id="ot-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Opcional — ex.: escritório, cidade"
                maxLength={200}
                className="w-full"
              />
            </FormField>

            <FormField label="URL do vídeo de boas-vindas" htmlFor="ot-video">
              <Input
                id="ot-video"
                value={welcomeVideoUrl}
                onChange={(e) => setWelcomeVideoUrl(e.target.value)}
                placeholder="Opcional — https://…"
                className="w-full"
              />
            </FormField>
          </div>

          <button
            type="button"
            aria-pressed={active}
            onClick={() => setActive((v) => !v)}
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
                  Estrutura (Tarefas, Formação, Documentos, Acessos,
                  Políticas, Reuniões, Avaliações…)
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
                <p className="text-xs text-ink-faint">
                  Sem itens — pode adicionar agora ou depois no detalhe do
                  template.
                </p>
              )}

              <div className="space-y-3">
                {tasks.map((t) => (
                  <div
                    key={t.key}
                    className="rounded-card border border-border p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <Input
                        aria-label="Título do item"
                        value={t.title}
                        onChange={(e) =>
                          patchTask(t.key, { title: e.target.value })
                        }
                        placeholder="Ex.: Entregar documentos de admissão"
                        maxLength={200}
                        className="w-full"
                      />
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
                        value={t.phase}
                        onValueChange={(v) =>
                          patchTask(t.key, { phase: v as TaskPhase })
                        }
                        className="w-full"
                      />
                      <Select
                        items={RESPONSIBLE_ITEMS}
                        value={t.responsible}
                        onValueChange={(v) =>
                          patchTask(t.key, {
                            responsible: v as ResponsibleRole,
                          })
                        }
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
