// components/competencies/DevelopmentPlanFormModal.tsx
// Modal "Novo plano de evolução" do separador Desenvolvimento (docs/
// módulo_competencies.md §8): cria um plano de desenvolvimento (PDI) para um
// colaborador — a atribuição — com a competência a evoluir (lacuna actual →
// objectivo) e a primeira acção de desenvolvimento ligada a essa competência.
// Usa os endpoints existentes POST /development-plans e POST
// /development-plans/actions (ADMIN/RH/GESTOR), por isso o separador
// Desenvolvimento passa a mostrar a acção logo a seguir.

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DEV_ACTION_TYPE_CFG } from './constants';
import { useCompetencyOptions, type DirectoryUser } from './modelFormData';
import { UserFilterSearch } from './UserFilterSearch';

export interface DevelopmentPlanFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITY_ITEMS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
  { value: 'CRITICAL', label: 'Crítica' },
];

// A prioridade da lacuna só tem 3 valores (PdiCompetencyPriority).
const GAP_PRIORITY: Record<string, string> = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'HIGH',
  CRITICAL: 'HIGH',
};

const LEVEL_ITEMS = [1, 2, 3, 4, 5].map((v) => ({
  value: String(v),
  label: `Nível ${v}`,
}));

const ACTION_TYPE_ITEMS = Object.entries(DEV_ACTION_TYPE_CFG).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
);

interface FormValues {
  user: DirectoryUser | null;
  name: string;
  goal: string;
  priority: string;
  startDate: string;
  endDate: string;
  competencyId: string;
  currentLevel: string;
  targetLevel: string;
  actionTitle: string;
  actionType: string;
  actionDueDate: string;
  submitError: string;
}

export function DevelopmentPlanFormModal({
  onClose,
  onSuccess,
}: DevelopmentPlanFormModalProps) {
  const { options: competencyOptions, loading: loadingCompetencies } =
    useCompetencyOptions(true);

  const { values, set: setField } = useFormState<FormValues>({
    user: null,
    name: '',
    goal: '',
    priority: 'MEDIUM',
    startDate: '',
    endDate: '',
    competencyId: '',
    currentLevel: '',
    targetLevel: '',
    actionTitle: '',
    actionType: 'COURSE',
    actionDueDate: '',
    submitError: '',
  });
  const {
    user,
    name,
    goal,
    priority,
    startDate,
    endDate,
    competencyId,
    currentLevel,
    targetLevel,
    actionTitle,
    actionType,
    actionDueDate,
    submitError,
  } = values;

  const levelsInvalid =
    currentLevel !== '' &&
    targetLevel !== '' &&
    parseInt(targetLevel, 10) <= parseInt(currentLevel, 10);
  const datesInvalid = !!startDate && !!endDate && endDate < startDate;

  const canSubmit =
    !!user &&
    name.trim().length > 0 &&
    goal.trim().length > 0 &&
    competencyId.length > 0 &&
    actionTitle.trim().length > 0 &&
    !levelsInvalid &&
    !datesInvalid;

  const save = useApiMutation(
    async () => {
      const userId = user?.id;
      if (userId == null) throw new Error('Seleccione o colaborador.');
      const plan = await apiClient.post<{ id: number }>('/development-plans', {
        name: name.trim(),
        goal: goal.trim(),
        userId,
        priority,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        competencyGaps: [
          {
            competencyId: parseInt(competencyId, 10),
            currentLevel: currentLevel ? parseInt(currentLevel, 10) : undefined,
            targetLevel: targetLevel ? parseInt(targetLevel, 10) : undefined,
            priority: GAP_PRIORITY[priority] ?? 'MEDIUM',
          },
        ],
      });
      if (plan?.id == null)
        throw new Error(
          'O plano foi criado mas a resposta não trouxe o seu id.',
        );
      return apiClient.post('/development-plans/actions', {
        planId: plan.id,
        title: actionTitle.trim(),
        type: actionType,
        competencyIds: [parseInt(competencyId, 10)],
        dueDate: actionDueDate || undefined,
      });
    },
    {
      invalidateKeys: [
        queryKeys.competencies.all,
        queryKeys.developmentPlans.all,
      ],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao criar o plano. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    save.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo plano de evolução"
        description="Cria o plano, atribui-o a um colaborador e define a primeira acção para evoluir a competência."
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Atribuir a (colaborador) *" htmlFor="dp-user">
            <UserFilterSearch
              selected={user}
              onChange={(u) => setField('user', u)}
              className="w-full"
            />
          </FormField>

          <FormField label="Nome do plano *" htmlFor="dp-name">
            <Input
              id="dp-name"
              value={name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ex.: Evolução em Liderança 2026"
              maxLength={200}
              className="w-full"
            />
          </FormField>

          <FormField label="Objectivo *" htmlFor="dp-goal">
            <Textarea
              id="dp-goal"
              value={goal}
              onChange={(e) => setField('goal', e.target.value)}
              placeholder="O que o colaborador deve conseguir no fim do plano"
              rows={2}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Prioridade" htmlFor="dp-priority">
              <Select
                items={PRIORITY_ITEMS}
                value={priority}
                onValueChange={(v) => setField('priority', v)}
                className="w-full"
              />
            </FormField>
            <FormField label="Início" htmlFor="dp-start">
              <Input
                id="dp-start"
                type="date"
                value={startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Fim" htmlFor="dp-end">
              <Input
                id="dp-end"
                type="date"
                value={endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
          {datesInvalid && (
            <p className="text-sm text-danger-ink">
              A data de fim não pode ser anterior à de início.
            </p>
          )}

          <FormField label="Competência a evoluir *" htmlFor="dp-competency">
            <Select
              items={competencyOptions}
              value={competencyId || undefined}
              onValueChange={(v) => setField('competencyId', v)}
              placeholder={
                loadingCompetencies ? 'A carregar…' : 'Selecionar competência'
              }
              disabled={loadingCompetencies}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nível actual" htmlFor="dp-current">
              <Select
                items={LEVEL_ITEMS}
                value={currentLevel || undefined}
                onValueChange={(v) => setField('currentLevel', v)}
                placeholder="Nível"
                className="w-full"
              />
            </FormField>
            <FormField label="Nível objectivo" htmlFor="dp-target">
              <Select
                items={LEVEL_ITEMS}
                value={targetLevel || undefined}
                onValueChange={(v) => setField('targetLevel', v)}
                placeholder="Nível"
                className="w-full"
              />
            </FormField>
          </div>
          {levelsInvalid && (
            <p className="text-sm text-danger-ink">
              O nível objectivo tem de ser superior ao nível actual.
            </p>
          )}

          <div className="rounded-card border border-border p-4">
            <p className="mb-3 font-body text-sm font-semibold text-ink">
              Primeira acção de desenvolvimento
            </p>
            <div className="space-y-4">
              <FormField label="Título da acção *" htmlFor="dp-action-title">
                <Input
                  id="dp-action-title"
                  value={actionTitle}
                  onChange={(e) => setField('actionTitle', e.target.value)}
                  placeholder="Ex.: Curso de comunicação eficaz"
                  maxLength={200}
                  className="w-full"
                />
              </FormField>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Tipo de acção" htmlFor="dp-action-type">
                  <Select
                    items={ACTION_TYPE_ITEMS}
                    value={actionType}
                    onValueChange={(v) => setField('actionType', v)}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Conclusão prevista" htmlFor="dp-action-due">
                  <Input
                    id="dp-action-due"
                    type="date"
                    value={actionDueDate}
                    onChange={(e) => setField('actionDueDate', e.target.value)}
                    className="w-full"
                  />
                </FormField>
              </div>
            </div>
          </div>
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
            Criar e atribuir
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
