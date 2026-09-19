// components/career/succession/AddSuccessorModal.tsx
// Modal "Adicionar Sucessor" (RH/Admin) — Módulo Career, secção 7.
// Junta um candidato ao plano de sucessão de um cargo crítico
// (POST /succession). matchScore e priority ficam por omissão calculados
// pelo servidor quando não fornecidos.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import { READINESS_OPTIONS } from './constants';

export interface AddSuccessorModalProps {
  criticalPositionId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddSuccessorModal({
  criticalPositionId,
  onClose,
  onSuccess,
}: AddSuccessorModalProps) {
  const [candidate, setCandidate] = useState<DirectoryUser | null>(null);
  const [geographicMobility, setGeographicMobility] = useState(true);
  const [available, setAvailable] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const {
    values: form,
    setValues: setForm,
    handleSubmit: withValidation,
  } = useFormValidation({ readinessLevel: '', readinessByDate: '', notes: '' }, {});

  const create = useApiMutation(
    () =>
      apiClient.post('/succession', {
        criticalPositionId,
        candidateId: candidate?.id,
        readinessLevel: form.readinessLevel,
        geographicMobility,
        available,
        notes: form.notes || undefined,
        readinessByDate: form.readinessByDate || undefined,
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
    if (!candidate) {
      setSubmitError('Seleccione o candidato a sucessor');
      return;
    }
    if (!form.readinessLevel) {
      setSubmitError('Seleccione o nível de prontidão');
      return;
    }
    setSubmitError('');
    create.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Adicionar Sucessor" className="max-h-[90vh] max-w-lg overflow-y-auto">
        <div className="mt-4 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <DepartmentUserPicker
            label="Candidato a sucessor *"
            htmlFor="succ-candidate"
            value={candidate}
            onChange={setCandidate}
          />

          <FormField label="Nível de prontidão *" htmlFor="succ-readiness">
            <Select
              items={READINESS_OPTIONS}
              value={form.readinessLevel}
              onValueChange={(v) => setForm((f) => ({ ...f, readinessLevel: v }))}
              placeholder="Seleccionar…"
              className="w-full"
            />
          </FormField>

          <FormField label="Data prevista de prontidão" htmlFor="succ-readiness-date">
            <Input
              id="succ-readiness-date"
              type="date"
              value={form.readinessByDate}
              onChange={(e) => setForm((f) => ({ ...f, readinessByDate: e.target.value }))}
              className="w-full"
            />
          </FormField>

          <p className="font-body text-xs text-ink-faint">
            A prioridade (1º/2º/3º sucessor) e o score de compatibilidade são calculados
            automaticamente a partir dos sucessores já existentes e das competências do cargo.
          </p>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={geographicMobility}
              onChange={(e) => setGeographicMobility(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Disponível para mobilidade geográfica
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Disponível para assumir a posição
          </label>

          <FormField label="Notas" htmlFor="succ-notes">
            <Textarea
              id="succ-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} loading={create.isPending}>
            Adicionar Sucessor
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
