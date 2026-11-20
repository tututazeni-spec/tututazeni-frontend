// components/onboarding/PlanTaskFormModal.tsx
// "+ Nova tarefa" do separador Tarefas: cria uma tarefa avulso num plano de
// integração (só nesse plano, não altera o template). POST /onboarding/:id/tasks
// — só ADMIN/RH. A pessoa responsável é opcional e escolhe-se entre as do plano.

'use client';

import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { useFormState } from '@/hooks/useFormState';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CATEGORY_CFG, PHASE_LABELS, PHASE_ORDER } from './constants';
import type { DirectoryUser } from '@/components/users/types';
import type { OnboardingPlanListItem, TaskCategory, TaskPhase } from './types';

interface PlansPage {
  data: OnboardingPlanListItem[];
}

const NONE = 'NONE';
const ALL = 'ALL';

const CATEGORY_ITEMS = Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
const PHASE_ITEMS = PHASE_ORDER.map((value) => ({
  value,
  label: PHASE_LABELS[value],
}));

interface FormValues {
  templateId: string;
  planId: string;
  title: string;
  description: string;
  category: TaskCategory | '';
  phase: TaskPhase;
  startDate: string;
  dueDate: string;
  assigneeId: string;
  submitError: string;
}

export function PlanTaskFormModal({ onClose }: { onClose: () => void }) {
  const notify = useToast();
  const { values, set } = useFormState<FormValues>({
    templateId: '',
    planId: '',
    title: '',
    description: '',
    category: '',
    phase: 'INTEGRATION',
    startDate: '',
    dueDate: '',
    assigneeId: NONE,
    submitError: '',
  });

  const { data: plansPage } = useApiQuery<PlansPage>(
    [...queryKeys.onboarding.all, 'plan-task-form-plans'],
    '/onboarding',
    { params: { page: 1, limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const plans = useMemo(
    () =>
      (plansPage?.data ?? []).filter(
        (p) => p.status === 'NOT_STARTED' || p.status === 'IN_PROGRESS',
      ),
    [plansPage],
  );
  // Filtro 1: plano (template). Filtro 2: colaborador com esse plano.
  const templateItems = useMemo(() => {
    const seen = new Map<number, string>();
    for (const p of plans) seen.set(p.template.id, p.template.name);
    return [...seen.entries()].map(([id, name]) => ({
      value: String(id),
      label: name,
    }));
  }, [plans]);
  // Colaborador é opcional: sem escolha = "Todos" os colaboradores do plano.
  const collaboratorItems = [
    { value: ALL, label: 'Todos' },
    ...plans
      .filter((p) => String(p.template.id) === values.templateId)
      .map((p) => ({ value: String(p.id), label: p.user.fullName })),
  ];

  // Responsável: mesmo departamento do colaborador ou RH (validado no backend).
  const { data: candidates } = useApiQuery<DirectoryUser[]>(
    [...queryKeys.onboarding.all, 'task-assignees', values.planId],
    `/onboarding/${values.planId}/task-assignee-candidates`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: values.planId !== '' },
  );
  const assigneeItems = [
    { value: NONE, label: 'Sem responsável' },
    ...(candidates ?? [])
      .filter((u) => u != null && u.id != null)
      .map((u) => ({
        value: String(u.id),
        label: `${u.fullName} (${u.role?.name === 'RH' ? 'RH' : (u.department?.name ?? '—')})`,
      })),
  ];

  const datesInvalid =
    values.startDate !== '' &&
    values.dueDate !== '' &&
    values.dueDate < values.startDate;

  const canSubmit =
    values.templateId !== '' &&
    values.title.trim().length > 0 &&
    values.category !== '' &&
    values.startDate !== '' &&
    values.dueDate !== '' &&
    !datesInvalid;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      values.planId
        ? apiClient.post(`/onboarding/${values.planId}/tasks`, body)
        : apiClient.post(
            `/onboarding/templates/${values.templateId}/plan-tasks`,
            body,
          ),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({ title: 'Tarefa criada', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        set(
          'submitError',
          e.message || 'Erro ao criar a tarefa. Tente novamente.',
        ),
    },
  );

  const submit = () => {
    if (!canSubmit || save.isPending) return;
    set('submitError', '');
    const body: Record<string, unknown> = {
      title: values.title.trim(),
      category: values.category,
      phase: values.phase,
      startDate: values.startDate,
      dueDate: values.dueDate,
    };
    if (values.description.trim()) body.description = values.description.trim();
    if (values.assigneeId !== NONE) body.assigneeId = Number(values.assigneeId);
    save.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova tarefa"
        description="Cria uma tarefa só para o plano escolhido. Não altera o template."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {values.submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {values.submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Plano *" htmlFor="pt-template">
              <Select
                items={templateItems}
                value={values.templateId || undefined}
                onValueChange={(v) => {
                  set('templateId', v);
                  set('planId', '');
                  set('assigneeId', NONE);
                }}
                placeholder="Seleccionar plano"
                className="w-full"
              />
            </FormField>
            <FormField
              label="Colaborador"
              htmlFor="pt-plan"
              hint="Opcional — sem escolha aplica-se a todos."
            >
              <Select
                items={collaboratorItems}
                value={values.planId || ALL}
                onValueChange={(v) => {
                  set('planId', v === ALL ? '' : v);
                  set('assigneeId', NONE);
                }}
                placeholder="Todos"
                disabled={!values.templateId}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Título *" htmlFor="pt-title">
            <Input
              id="pt-title"
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={200}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="pt-description">
            <Textarea
              id="pt-description"
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Categoria *" htmlFor="pt-category">
              <Select
                items={CATEGORY_ITEMS}
                value={values.category || undefined}
                onValueChange={(v) => set('category', v as TaskCategory)}
                placeholder="Seleccionar categoria"
                className="w-full"
              />
            </FormField>
            <FormField label="Fase *" htmlFor="pt-phase">
              <Select
                items={PHASE_ITEMS}
                value={values.phase}
                onValueChange={(v) => set('phase', v as TaskPhase)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de início *" htmlFor="pt-start">
              <Input
                id="pt-start"
                type="date"
                value={values.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Data de fim *"
              htmlFor="pt-due"
              error={
                datesInvalid
                  ? 'Tem de ser igual ou posterior ao início.'
                  : undefined
              }
            >
              <Input
                id="pt-due"
                type="date"
                min={values.startDate || undefined}
                value={values.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField
              label="Responsável"
              htmlFor="pt-assignee"
              hint={
                values.planId
                  ? 'Mesmo departamento do colaborador ou RH.'
                  : 'Escolhe um colaborador para definir o responsável.'
              }
            >
              <Select
                items={assigneeItems}
                value={values.assigneeId}
                disabled={!values.planId}
                onValueChange={(v) => set('assigneeId', v)}
                className="w-full"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!canSubmit || save.isPending} onClick={submit}>
            {save.isPending ? 'A criar…' : 'Criar tarefa'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
