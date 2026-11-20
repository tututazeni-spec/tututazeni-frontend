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
import { planMemberOptions } from './AssignTaskModal';
import type { OnboardingPlanListItem, TaskCategory, TaskPhase } from './types';

interface PlansPage {
  data: OnboardingPlanListItem[];
}

const NONE = 'NONE';

const CATEGORY_ITEMS = Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
const PHASE_ITEMS = PHASE_ORDER.map((value) => ({
  value,
  label: PHASE_LABELS[value],
}));

interface FormValues {
  planId: string;
  title: string;
  description: string;
  category: TaskCategory | '';
  phase: TaskPhase;
  dueDate: string;
  assigneeId: string;
  submitError: string;
}

export function PlanTaskFormModal({ onClose }: { onClose: () => void }) {
  const notify = useToast();
  const { values, set } = useFormState<FormValues>({
    planId: '',
    title: '',
    description: '',
    category: '',
    phase: 'INTEGRATION',
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
  const planItems = plans.map((p) => ({
    value: String(p.id),
    label: `${p.user.fullName} — ${p.template.name}`,
  }));
  const selected = plans.find((p) => String(p.id) === values.planId);
  const assigneeItems = [
    { value: NONE, label: 'Sem responsável' },
    ...(selected
      ? planMemberOptions(selected).map((m) => ({
          value: String(m.id),
          label: `${m.fullName} (${m.roleLabel})`,
        }))
      : []),
  ];

  const canSubmit =
    values.planId !== '' &&
    values.title.trim().length > 0 &&
    values.category !== '';

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post(`/onboarding/${values.planId}/tasks`, body),
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
    };
    if (values.description.trim()) body.description = values.description.trim();
    if (values.dueDate) body.dueDate = values.dueDate;
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

          <FormField label="Plano / colaborador *" htmlFor="pt-plan">
            <Select
              items={planItems}
              value={values.planId || undefined}
              onValueChange={(v) => {
                set('planId', v);
                set('assigneeId', NONE);
              }}
              placeholder="Seleccionar plano"
              className="w-full"
            />
          </FormField>

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
            <FormField label="Prazo" htmlFor="pt-due">
              <Input
                id="pt-due"
                type="date"
                value={values.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Responsável" htmlFor="pt-assignee">
              <Select
                items={assigneeItems}
                value={values.assigneeId}
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
