// components/evaluation/CriteriaFormModal.tsx
// Modal de criar/editar um critério da "biblioteca central" (docs/
// modulo_evaluation.md pt.5) — usada pelo CriteriaTab. Mesmo padrão de
// CreateCycleModal.tsx (useFormValidation + useApiMutation).

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
import { CRITERIA_CATEGORY_OPTIONS } from './constants';
import type { EvalCriteria, EvalScale } from './types';

export interface CriteriaFormModalProps {
  criteria?: EvalCriteria | null;
  onClose: () => void;
}

const CATEGORY_ITEMS = CRITERIA_CATEGORY_OPTIONS.map((c) => ({ value: c, label: c }));

export function CriteriaFormModal({ criteria, onClose }: CriteriaFormModalProps) {
  const notify = useToast();
  const isEdit = !!criteria;

  const { data: scales } = useApiQuery<EvalScale[]>(
    queryKeys.evaluation.scales(),
    '/evaluations/scales',
  );

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: criteria?.name ?? '',
      code: criteria?.code ?? '',
      description: criteria?.description ?? '',
      category: criteria?.category ?? '',
      weight: String(criteria?.weight ?? 1),
      scaleId: criteria?.scaleId ? String(criteria.scaleId) : '',
      behavioralIndicators: criteria?.behavioralIndicators ?? '',
    },
    { name: [required()] },
  );
  const [isActive, setIsActive] = useState(criteria?.isActive ?? true);
  const [submitError, setSubmitError] = useState('');

  const payload = () => ({
    name: form.name.trim(),
    code: form.code.trim() || undefined,
    description: form.description.trim() || undefined,
    category: form.category || undefined,
    weight: Number(form.weight) || 1,
    scaleId: form.scaleId ? Number(form.scaleId) : undefined,
    behavioralIndicators: form.behavioralIndicators.trim() || undefined,
    ...(isEdit ? { isActive } : {}),
  });

  const save = useApiMutation(
    () =>
      criteria
        ? apiClient.patch(`/evaluations/criteria/${criteria.id}`, payload())
        : apiClient.post('/evaluations/criteria', payload()),
    {
      invalidateKeys: [queryKeys.evaluation.criteria()],
      onSuccess: () => {
        notify({ title: isEdit ? 'Critério actualizado' : 'Critério criado', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e instanceof Error ? e.message : 'Erro ao guardar o critério.'),
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
        title={isEdit ? 'Editar Critério' : 'Novo Critério'}
        description="Critério reutilizável na biblioteca central — pode ser ligado a vários modelos de avaliação."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {(validationError || submitError) && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {validationError || submitError}
            </div>
          )}

          <FormField label="Nome *" htmlFor="crit-name">
            <Input
              id="crit-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex.: Orientação para resultados"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Código" htmlFor="crit-code">
              <Input
                id="crit-code"
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
                className="w-full"
                placeholder="Ex.: CRIT-014"
              />
            </FormField>
            <FormField label="Peso padrão" htmlFor="crit-weight">
              <Input
                id="crit-weight"
                type="number"
                min={0}
                step={0.1}
                value={form.weight}
                onChange={(e) => setField('weight', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Categoria" htmlFor="crit-category">
            <Select
              items={[{ value: '', label: 'Sem categoria' }, ...CATEGORY_ITEMS]}
              value={form.category}
              onValueChange={(v) => setField('category', v)}
              className="w-full"
            />
          </FormField>

          <FormField label="Escala de avaliação" htmlFor="crit-scale">
            <Select
              items={scaleItems}
              value={form.scaleId}
              onValueChange={(v) => setField('scaleId', v)}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="crit-description">
            <Textarea
              id="crit-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
              rows={2}
            />
          </FormField>

          <FormField label="Indicadores comportamentais" htmlFor="crit-indicators">
            <Textarea
              id="crit-indicators"
              value={form.behavioralIndicators}
              onChange={(e) => setField('behavioralIndicators', e.target.value)}
              className="w-full"
              rows={3}
              placeholder="Comportamentos observáveis que evidenciam este critério…"
            />
          </FormField>

          {isEdit && (
            <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded accent-primary"
              />
              Activo
            </label>
          )}
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
            {isEdit ? 'Guardar' : 'Criar Critério'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
