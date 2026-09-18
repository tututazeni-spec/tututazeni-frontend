// components/career/succession/NewCriticalPositionModal.tsx
// Modal "Nova Posição Crítica" (RH/Admin) — Módulo Career, secção 7.
// Classifica um cargo como crítico (POST /succession/critical-positions).
// exitRisk fica por omissão calculado pelo servidor (computeExitRisk) —
// só se define aqui como override manual explícito.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { usePositionOptions } from '../careerFormData';
import { BUSINESS_IMPACT_OPTIONS, REPLACEMENT_TIME_OPTIONS } from './constants';

export interface NewCriticalPositionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewCriticalPositionModal({ onClose, onSuccess }: NewCriticalPositionModalProps) {
  const { options: positionOptions } = usePositionOptions();
  const [keyPersonRisk, setKeyPersonRisk] = useState(false);
  const [requiresDocumentation, setRequiresDocumentation] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      positionId: '',
      businessImpact: '',
      replacementTime: '',
      expectedExitDate: '',
      criticalReason: '',
      minSuccessorsRequired: '2',
    },
    { positionId: [required()], businessImpact: [required()], replacementTime: [required()] },
  );

  const create = useApiMutation(
    () =>
      apiClient.post('/succession/critical-positions', {
        positionId: Number(form.positionId),
        businessImpact: form.businessImpact,
        replacementTime: form.replacementTime,
        expectedExitDate: form.expectedExitDate || undefined,
        criticalReason: form.criticalReason || undefined,
        keyPersonRisk,
        minSuccessorsRequired: form.minSuccessorsRequired
          ? Number(form.minSuccessorsRequired)
          : undefined,
        requiresDocumentation,
      }),
    {
      invalidateKeys: [queryKeys.succession.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message),
    },
  );

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });
  const error = validationError || submitError;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Nova Posição Crítica" className="max-h-[90vh] max-w-lg overflow-y-auto">
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Cargo *" htmlFor="cp-position">
            <Select
              items={positionOptions}
              value={form.positionId}
              onValueChange={(v) => setForm((f) => ({ ...f, positionId: v }))}
              placeholder="Seleccionar…"
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Impacto no negócio *" htmlFor="cp-impact">
              <Select
                items={BUSINESS_IMPACT_OPTIONS}
                value={form.businessImpact}
                onValueChange={(v) => setForm((f) => ({ ...f, businessImpact: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
            <FormField label="Tempo de substituição *" htmlFor="cp-replacement">
              <Select
                items={REPLACEMENT_TIME_OPTIONS}
                value={form.replacementTime}
                onValueChange={(v) => setForm((f) => ({ ...f, replacementTime: v }))}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <p className="font-body text-xs text-ink-faint">
            O risco de saída é calculado automaticamente a partir do impacto, do tempo de
            substituição e da cobertura de sucessores — não é definido manualmente aqui.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data de saída prevista" htmlFor="cp-exit-date">
              <Input
                id="cp-exit-date"
                type="date"
                value={form.expectedExitDate}
                onChange={(e) => setForm((f) => ({ ...f, expectedExitDate: e.target.value }))}
                className="w-full"
              />
            </FormField>
            <FormField label="Mínimo de sucessores" htmlFor="cp-min-successors">
              <Input
                id="cp-min-successors"
                type="number"
                min={1}
                value={form.minSuccessorsRequired}
                onChange={(e) => setForm((f) => ({ ...f, minSuccessorsRequired: e.target.value }))}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Motivo da classificação" htmlFor="cp-reason">
            <Textarea
              id="cp-reason"
              value={form.criticalReason}
              onChange={(e) => setForm((f) => ({ ...f, criticalReason: e.target.value }))}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={keyPersonRisk}
              onChange={(e) => setKeyPersonRisk(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Key Person Risk — detentor de conhecimento único
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={requiresDocumentation}
              onChange={(e) => setRequiresDocumentation(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Requer documentação de conhecimento
          </label>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} loading={create.isPending}>
            Classificar como Crítico
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
