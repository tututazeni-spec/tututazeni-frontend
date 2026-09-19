// components/evaluation/TemplateFormModal.tsx
// Modal de criar/editar um modelo de avaliação (docs/modulo_evaluation.md
// pt.4) — usado pelo ModelsTab. Selecção de critérios+pesos espelha a etapa
// 4 do NewEvaluationWizard (criteriaWeights por criteriaId).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { TEMPLATE_TYPE_OPTIONS } from './constants';
import type { EvalCriteria, EvalScale, EvalTemplate } from './types';

export interface TemplateFormModalProps {
  /** `null` = criar novo; objecto completo (com `criteria`) = editar. */
  template?: EvalTemplate | null;
  onClose: () => void;
}

const TYPE_ITEMS = [
  { value: 'GENERIC', label: 'Genérico' },
  ...TEMPLATE_TYPE_OPTIONS.map((t) => ({ value: t, label: t })),
];

export function TemplateFormModal({ template, onClose }: TemplateFormModalProps) {
  const notify = useToast();
  const isEdit = !!template;

  const { data: scales } = useApiQuery<EvalScale[]>(
    queryKeys.evaluation.scales(),
    '/evaluations/scales',
  );
  const { data: criteriaList } = useApiQuery<EvalCriteria[]>(
    queryKeys.evaluation.criteria(),
    '/evaluations/criteria',
  );

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: template?.name ?? '',
      description: template?.description ?? '',
      type: template?.type ?? 'GENERIC',
      scaleId: template?.scaleId ? String(template.scaleId) : '',
    },
    { name: [required()] },
  );
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
  const [weights, setWeights] = useState<Record<number, string>>(
    Object.fromEntries((template?.criteria ?? []).map((c) => [c.criteriaId, String(c.weight ?? 1)])),
  );
  const [submitError, setSubmitError] = useState('');

  const criteriaEntries = Object.entries(weights).filter(([, w]) => Number(w) > 0);

  const payload = () => ({
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    type: form.type,
    scaleId: form.scaleId ? Number(form.scaleId) : undefined,
    isDefault,
    criteria: criteriaEntries.map(([criteriaId, weight]) => ({
      criteriaId: Number(criteriaId),
      weight: Number(weight),
    })),
  });

  const save = useApiMutation(
    () =>
      template
        ? apiClient.patch(`/evaluations/templates/${template.id}`, payload())
        : apiClient.post('/evaluations/templates', payload()),
    {
      invalidateKeys: [queryKeys.evaluation.templates()],
      onSuccess: () => {
        notify({ title: isEdit ? 'Modelo actualizado' : 'Modelo criado', intent: 'success' });
        onClose();
      },
      onError: (e) => setSubmitError(e instanceof Error ? e.message : 'Erro ao guardar o modelo.'),
    },
  );

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    save.mutate(undefined);
  });

  const scaleItems = [
    { value: '', label: 'Sem escala definida' },
    ...(scales ?? []).map((s) => ({ value: String(s.id), label: s.name })),
  ];

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={isEdit ? 'Editar Modelo' : 'Novo Modelo'}
        description="Modelo reutilizável em ciclos e avaliações — critérios, pesos e escala."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {(validationError || submitError) && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {validationError || submitError}
            </div>
          )}

          <FormField label="Nome *" htmlFor="tpl-name">
            <Input
              id="tpl-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex.: Avaliação de Desempenho Anual"
            />
          </FormField>

          <FormField label="Tipo de modelo" htmlFor="tpl-type">
            <Select
              items={TYPE_ITEMS}
              value={form.type}
              onValueChange={(v) => setField('type', v)}
              className="w-full"
            />
          </FormField>

          <FormField label="Escala de avaliação" htmlFor="tpl-scale">
            <Select
              items={scaleItems}
              value={form.scaleId}
              onValueChange={(v) => setField('scaleId', v)}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="tpl-description">
            <Textarea
              id="tpl-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
              rows={2}
            />
          </FormField>

          <div>
            <span className="font-body text-sm font-medium text-ink">
              Critérios e pesos
            </span>
            <p className="text-xs text-ink-faint mb-2">
              Define o peso de cada critério (0 = não incluído neste modelo).
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(criteriaList ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <label className="flex-1 font-body text-sm text-ink-muted truncate">
                    {c.name}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={weights[c.id] ?? ''}
                    onChange={(e) =>
                      setWeights((w) => ({ ...w, [c.id]: e.target.value }))
                    }
                    className="w-24"
                    placeholder="0"
                  />
                </div>
              ))}
              {(criteriaList ?? []).length === 0 && (
                <p className="text-sm text-ink-faint">
                  Sem critérios criados — cria critérios na aba &quot;Critérios&quot; primeiro.
                </p>
              )}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded accent-primary"
            />
            Modelo por omissão
          </label>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            loading={save.isPending}
          >
            {isEdit ? 'Guardar' : 'Criar Modelo'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
