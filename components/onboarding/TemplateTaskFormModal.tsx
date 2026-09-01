// components/onboarding/TemplateTaskFormModal.tsx
// Modal único de criação e edição de tarefas de um template de onboarding,
// aberto a partir do TemplateDetailModal ("+ Adicionar tarefa" por fase e
// "Editar" por tarefa). Só ADMIN/RH — mesmo RBAC de @Roles(ADMIN, RH) em
// onboarding.controller.ts (POST /onboarding/templates/tasks e
// PUT /onboarding/templates/tasks/:taskId).
//
// A tarefa completa já vem no detalhe do template (GET /onboarding/
// templates/:id), por isso em modo edição os campos arrancam com o objecto
// `task` recebido — sem novo fetch. Em modo criação, `defaultPhase`
// pré-selecciona a fase do botão premido e `nextSeq` fixa a ordem no fim
// da lista (o campo `seq` do DTO é obrigatório mas não faz sentido expô-lo).
//
// Campos fora do âmbito v1 (dependsOn, courseId, processId) não são
// enviados; ficam nos valores por defeito do backend.

'use client';

import { useState } from 'react';
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
import { cn } from '@/lib/cn';
import {
  CATEGORY_CFG,
  PHASE_LABELS,
  PHASE_ORDER,
  RESPONSIBLE_LABELS,
  TASK_TYPE_LABELS,
} from './constants';
import type {
  ResponsibleRole,
  TaskCategory,
  TaskPhase,
  TaskType,
  TemplateTask,
} from './types';

export interface TemplateTaskFormModalProps {
  templateId: number;
  /** null → criar; tarefa → editar. */
  task: TemplateTask | null;
  /** Fase pré-seleccionada ao criar (botão "+ Adicionar tarefa" da fase). */
  defaultPhase: TaskPhase;
  /** seq a atribuir ao criar (fim da lista). */
  nextSeq: number;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_ITEMS = Object.entries(CATEGORY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));
const TYPE_ITEMS = Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const RESPONSIBLE_ITEMS = Object.entries(RESPONSIBLE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const PHASE_ITEMS = PHASE_ORDER.map((value) => ({
  value,
  label: PHASE_LABELS[value],
}));

export function TemplateTaskFormModal({
  templateId,
  task,
  defaultPhase,
  nextSeq,
  onClose,
  onSuccess,
}: TemplateTaskFormModalProps) {
  const editing = task != null;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [category, setCategory] = useState<TaskCategory | ''>(
    task?.category ?? '',
  );
  const [type, setType] = useState<TaskType>(task?.type ?? 'TASK');
  const [phase, setPhase] = useState<TaskPhase>(task?.phase ?? defaultPhase);
  const [responsible, setResponsible] = useState<ResponsibleRole>(
    task?.responsible ?? 'SELF',
  );
  const [dueDayOffset, setDueDayOffset] = useState(
    task?.dueDayOffset != null ? String(task.dueDayOffset) : '',
  );
  const [xpReward, setXpReward] = useState(String(task?.xpReward ?? 10));
  const [requiresApproval, setRequiresApproval] = useState(
    task?.requiresApproval ?? false,
  );
  const [requiresEvidence, setRequiresEvidence] = useState(
    task?.requiresEvidence ?? false,
  );
  const [submitError, setSubmitError] = useState('');

  const canSubmit = title.trim().length > 0 && category.length > 0;

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/onboarding/templates/tasks/${task.id}`, body)
        : apiClient.post('/onboarding/templates/tasks', body),
    {
      invalidateKeys: [
        queryKeys.onboarding.all,
        queryKeys.onboarding.template(templateId),
      ],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao guardar a tarefa. Tente novamente.',
        ),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    const xp = Number(xpReward);
    const body: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      category,
      type,
      phase,
      responsible,
      xpReward: Number.isFinite(xp) && xp >= 0 ? Math.trunc(xp) : 0,
      requiresApproval,
      requiresEvidence,
      dueDayOffset:
        dueDayOffset.trim() === '' ? null : Math.trunc(Number(dueDayOffset)),
    };
    if (!editing) {
      body.templateId = templateId;
      body.seq = nextSeq;
    }
    save.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? 'Editar tarefa' : 'Nova tarefa'}
        description={
          editing
            ? 'Actualiza a tarefa do template. Aplica-se aos planos criados a partir daqui.'
            : 'Adiciona uma tarefa a esta fase do template.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Título *" htmlFor="tt-title">
            <Input
              id="tt-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Entregar documentos de admissão"
              maxLength={200}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="tt-description">
            <Textarea
              id="tt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Opcional — instruções para quem executa a tarefa."
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Categoria *" htmlFor="tt-category">
              <Select
                items={CATEGORY_ITEMS}
                value={category || undefined}
                onValueChange={(v) => setCategory(v as TaskCategory)}
                placeholder="Selecionar categoria"
                className="w-full"
              />
            </FormField>

            <FormField label="Tipo *" htmlFor="tt-type">
              <Select
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType(v as TaskType)}
                className="w-full"
              />
            </FormField>

            <FormField label="Fase *" htmlFor="tt-phase">
              <Select
                items={PHASE_ITEMS}
                value={phase}
                onValueChange={(v) => setPhase(v as TaskPhase)}
                className="w-full"
              />
            </FormField>

            <FormField label="Responsável *" htmlFor="tt-responsible">
              <Select
                items={RESPONSIBLE_ITEMS}
                value={responsible}
                onValueChange={(v) => setResponsible(v as ResponsibleRole)}
                className="w-full"
              />
            </FormField>

            <FormField
              label="Dia limite"
              htmlFor="tt-due"
              hint="Dias após o início (opcional)."
            >
              <Input
                id="tt-due"
                type="number"
                min={0}
                value={dueDayOffset}
                onChange={(e) => setDueDayOffset(e.target.value)}
                placeholder="Ex.: 5"
                className="w-full"
              />
            </FormField>

            <FormField label="XP ao concluir *" htmlFor="tt-xp">
              <Input
                id="tt-xp"
                type="number"
                min={0}
                value={xpReward}
                onChange={(e) => setXpReward(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={requiresApproval}
              onClick={() => setRequiresApproval((v) => !v)}
              className={cn(
                'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
                requiresApproval
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'border-border-strong bg-surface text-ink-muted',
              )}
            >
              Requer aprovação
            </button>
            <button
              type="button"
              aria-pressed={requiresEvidence}
              onClick={() => setRequiresEvidence((v) => !v)}
              className={cn(
                'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
                requiresEvidence
                  ? 'border-primary bg-primary-subtle text-primary'
                  : 'border-border-strong bg-surface text-ink-muted',
              )}
            >
              Requer evidência
            </button>
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
            {editing ? 'Guardar' : 'Adicionar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
