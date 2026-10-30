// components/evaluation/EditCycleModal.tsx
// Editar um ciclo ainda por ativar (cartão do separador "Avaliações"). Só expõe
// o que PATCH /evaluations/cycles/:id aceita e faz sentido antes da ativação:
// nome, descrição, imagem e data de fim (UpdateCycleDto não altera a data de início).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { CourseImageField } from '@/components/courses/CourseImageField';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import type { Cycle } from './types';

interface EditCycleModalProps {
  cycle: Cycle;
  onClose: () => void;
}

export function EditCycleModal({ cycle, onClose }: EditCycleModalProps) {
  const notify = useToast();
  const [name, setName] = useState(cycle.name);
  const [description, setDescription] = useState(cycle.description ?? '');
  const [imageUrl, setImageUrl] = useState(cycle.imageUrl ?? '');
  const [endDate, setEndDate] = useState(cycle.endDate.slice(0, 10));
  const [error, setError] = useState('');

  const save = useApiMutation<unknown, void>(
    () =>
      apiClient.patch(`/evaluations/cycles/${cycle.id}`, {
        name: name.trim(),
        description: description.trim(),
        endDate,
        ...(imageUrl ? { imageUrl } : {}),
      }),
    {
      invalidateKeys: [queryKeys.evaluation.all],
      onSuccess: () => {
        notify({ title: 'Avaliação atualizada', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setError(e instanceof Error ? e.message : 'Erro ao guardar.'),
    },
  );

  const submit = () => {
    setError('');
    if (!name.trim()) return setError('Indica o nome da avaliação.');
    if (!endDate) return setError('Indica a data de fim.');
    if (endDate < cycle.startDate.slice(0, 10))
      return setError('A data de fim não pode ser anterior à de início.');
    save.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Editar avaliação"
        description="Altera os dados da avaliação antes de a ativar."
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <FormField label="Nome *" htmlFor="edit-cyc-name">
            <Input
              id="edit-cyc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Fim *" htmlFor="edit-cyc-end">
            <Input
              id="edit-cyc-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Descrição" htmlFor="edit-cyc-desc">
            <Textarea
              id="edit-cyc-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Imagem" htmlFor="edit-cyc-image">
            <CourseImageField
              value={imageUrl || null}
              onChange={(v) => setImageUrl(v ?? '')}
              alt="Pré-visualização da imagem da avaliação"
            />
          </FormField>
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={submit}
            loading={save.isPending}
          >
            Guardar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
