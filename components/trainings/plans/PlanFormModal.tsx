// components/trainings/plans/PlanFormModal.tsx
// Criação/edição de Plano de Formação (docs/trainings-detalhado.md pt.2 —
// "Novo Plano de Formação"). Mesmo padrão de TrainingFormModal.tsx:
// useFormValidation + useApiMutation, payload enxuto.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { TrainingPlan } from '../types';

export interface PlanFormModalProps {
  /** null = criar; um TrainingPlan existente = editar. */
  plan: TrainingPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PERIOD_ITEMS = [
  { value: 'ANNUAL', label: 'Anual' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'EXTRAORDINARY', label: 'Extraordinário' },
];

const PRIORITY_ITEMS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

const MODALITY_ITEMS = [
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Híbrida' },
];

interface UserOption {
  id: number;
  fullName: string;
}
interface CompetencyOption {
  id: number;
  name: string;
}

function n(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function PlanFormModal({ plan, onClose, onSuccess }: PlanFormModalProps) {
  const editing = !!plan;

  const { data: usersResp } = useApiQuery<{ data: UserOption[] }>(
    ['training-plans', 'users-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: competenciesResp } = useApiQuery<{ data: CompetencyOption[] }>(
    ['training-plans', 'competencies-picker'],
    '/competencies',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const userItems = (usersResp?.data ?? []).map((u) => ({ value: String(u.id), label: u.fullName }));
  const competencyOptions = competenciesResp?.data ?? [];

  const [competencyIds, setCompetencyIds] = useState<number[]>(
    plan?.competencies?.map((c) => c.competency.id) ?? [],
  );

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: plan?.name ?? '',
      code: plan?.code ?? '',
      year: plan?.year?.toString() ?? new Date().getFullYear().toString(),
      period: plan?.period ?? '',
      description: plan?.description ?? '',
      objectives: plan?.objectives ?? '',
      identifiedNeeds: plan?.identifiedNeeds ?? '',
      strategicPriorities: plan?.strategicPriorities ?? '',
      targetAudience: plan?.targetAudience ?? '',
      expectedParticipants: plan?.expectedParticipants?.toString() ?? '',
      expectedHours: plan?.expectedHours?.toString() ?? '',
      modality: plan?.modality ?? '',
      plannedBudget: plan?.plannedBudget?.toString() ?? '',
      priority: plan?.priority ?? '',
      responsibleId: plan?.responsible?.id?.toString() ?? '',
      approverId: plan?.approver?.id?.toString() ?? '',
      startDate: plan?.startDate?.slice(0, 10) ?? '',
      endDate: plan?.endDate?.slice(0, 10) ?? '',
      notes: plan?.notes ?? '',
    },
    { name: [required()], year: [required()] },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      year: n(form.year),
    };
    const str = (key: keyof typeof form) => {
      const v = (form[key] as string).trim();
      if (v) payload[key] = v;
    };
    str('code');
    str('description');
    str('objectives');
    str('identifiedNeeds');
    str('strategicPriorities');
    str('targetAudience');
    str('notes');
    if (form.period) payload.period = form.period;
    if (form.modality) payload.modality = form.modality;
    if (form.expectedParticipants) payload.expectedParticipants = n(form.expectedParticipants);
    if (form.expectedHours) payload.expectedHours = n(form.expectedHours);
    if (form.plannedBudget) payload.plannedBudget = n(form.plannedBudget);
    if (form.responsibleId) payload.responsibleId = n(form.responsibleId);
    if (form.approverId) payload.approverId = n(form.approverId);
    if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
    if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();
    payload.priority = form.priority || 'MEDIUM';
    payload.competencyIds = competencyIds;
    return payload;
  }

  const mutation = useApiMutation(
    () => {
      const payload = buildPayload();
      return plan
        ? apiClient.put(`/training-plans/${plan.id}`, payload)
        : apiClient.post('/training-plans', payload);
    },
    {
      invalidateKeys: [queryKeys.trainingPlans.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError(editing ? 'Erro ao actualizar plano.' : 'Erro ao criar plano. Verifique os dados.'),
    },
  );
  const loading = mutation.isPending;
  const handleSubmit = withValidation(() => {
    setSubmitError('');
    mutation.mutate(undefined);
  });

  function toggle(list: number[], setList: (v: number[]) => void, id: number) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? `Editar "${plan!.name}"` : 'Novo Plano de Formação'}
        description={editing ? undefined : 'O plano é criado como rascunho — submete-o depois para aprovação.'}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome do plano *" htmlFor="pf-name">
            <Input
              id="pf-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex: Plano de Formação 2027"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Código" htmlFor="pf-code">
              <Input id="pf-code" value={form.code} onChange={(e) => setField('code', e.target.value)} className="w-full" />
            </FormField>
            <FormField label="Ano *" htmlFor="pf-year">
              <Input
                id="pf-year"
                type="number"
                value={form.year}
                onChange={(e) => setField('year', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Período" htmlFor="pf-period">
              <Select
                items={PERIOD_ITEMS}
                value={form.period || undefined}
                onValueChange={(v) => setField('period', v)}
                className="w-full"
                placeholder="Selecionar"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="pf-description">
            <Textarea
              id="pf-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <FormField label="Objetivos" htmlFor="pf-objectives">
            <Textarea
              id="pf-objectives"
              value={form.objectives}
              onChange={(e) => setField('objectives', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <FormField label="Necessidades de formação identificadas" htmlFor="pf-identifiedNeeds">
            <Textarea
              id="pf-identifiedNeeds"
              value={form.identifiedNeeds}
              onChange={(e) => setField('identifiedNeeds', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <FormField label="Prioridades estratégicas" htmlFor="pf-strategicPriorities">
            <Textarea
              id="pf-strategicPriorities"
              value={form.strategicPriorities}
              onChange={(e) => setField('strategicPriorities', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <FormField label="Público-alvo" htmlFor="pf-targetAudience">
            <Textarea
              id="pf-targetAudience"
              value={form.targetAudience}
              onChange={(e) => setField('targetAudience', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <FormField label="Competências a desenvolver" htmlFor="pf-competencies">
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-control border border-border p-2">
              {competencyOptions.length === 0 && (
                <p className="text-xs text-ink-faint">Sem competências cadastradas.</p>
              )}
              {competencyOptions.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={competencyIds.includes(c.id)}
                    onChange={() => toggle(competencyIds, setCompetencyIds, c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Número previsto de participantes" htmlFor="pf-expectedParticipants">
              <Input
                id="pf-expectedParticipants"
                type="number"
                min={0}
                value={form.expectedParticipants}
                onChange={(e) => setField('expectedParticipants', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Horas previstas" htmlFor="pf-expectedHours">
              <Input
                id="pf-expectedHours"
                type="number"
                min={0}
                value={form.expectedHours}
                onChange={(e) => setField('expectedHours', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Modalidade prevista" htmlFor="pf-modality">
              <Select
                items={MODALITY_ITEMS}
                value={form.modality || undefined}
                onValueChange={(v) => setField('modality', v)}
                className="w-full"
                placeholder="Selecionar"
              />
            </FormField>
            <FormField label="Orçamento previsto (Kz)" htmlFor="pf-plannedBudget">
              <Input
                id="pf-plannedBudget"
                type="number"
                min={0}
                value={form.plannedBudget}
                onChange={(e) => setField('plannedBudget', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Prioridade" htmlFor="pf-priority">
              <Select
                items={PRIORITY_ITEMS}
                value={form.priority || undefined}
                onValueChange={(v) => setField('priority', v)}
                className="w-full"
                placeholder="Selecionar"
              />
            </FormField>
            <FormField label="Responsável" htmlFor="pf-responsible">
              <Combobox
                items={userItems}
                value={form.responsibleId || undefined}
                onValueChange={(v) => setField('responsibleId', v)}
                placeholder="Selecionar"
                className="w-full"
              />
            </FormField>
            <FormField label="Aprovador" htmlFor="pf-approver">
              <Combobox
                items={userItems}
                value={form.approverId || undefined}
                onValueChange={(v) => setField('approverId', v)}
                placeholder="Selecionar"
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data de início" htmlFor="pf-startDate">
              <Input
                id="pf-startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de fim" htmlFor="pf-endDate">
              <Input
                id="pf-endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Observações" htmlFor="pf-notes">
            <Textarea
              id="pf-notes"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" onClick={handleSubmit} loading={loading}>
            {loading ? 'A guardar...' : editing ? 'Guardar alterações' : 'Criar Plano'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
