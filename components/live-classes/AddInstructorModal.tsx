// components/live-classes/AddInstructorModal.tsx
// Ação "Adicionar formador" do menu do cartão de aula — escolhe o formador
// (e, opcionalmente, o co-formador) do catálogo de formadores do módulo
// Formações e grava na aula.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useInstructorOptions } from './wizard/wizardData';
import type { LiveClass } from './types';

export interface AddInstructorModalProps {
  lc: LiveClass;
  onClose: () => void;
}

export function AddInstructorModal({ lc, onClose }: AddInstructorModalProps) {
  const notify = useToast();
  const { options, loading } = useInstructorOptions();
  const [instructorId, setInstructorId] = useState(
    lc.instructorId ? String(lc.instructorId) : '',
  );
  const [coInstructorId, setCoInstructorId] = useState(
    lc.coInstructorId ? String(lc.coInstructorId) : '',
  );

  const save = useApiMutation(
    () =>
      apiClient.put(`/live-classes/${lc.id}`, {
        instructorId: instructorId ? Number(instructorId) : undefined,
        coInstructorId: coInstructorId ? Number(coInstructorId) : undefined,
      }),
    {
      invalidateKeys: [queryKeys.liveClasses.all],
      onSuccess: () => {
        notify({ title: 'Formador guardado', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Adicionar formador — "${lc.topic}"`}
        className="max-w-md"
      >
        <div className="mt-4 space-y-4">
          <FormField label="Formador *" htmlFor="ai-instructor">
            <Combobox
              items={options}
              value={instructorId}
              onValueChange={setInstructorId}
              placeholder={loading ? 'A carregar…' : 'Selecionar formador…'}
              searchPlaceholder="Escreva para filtrar…"
            />
          </FormField>
          <FormField label="Co-formador" htmlFor="ai-coinstructor">
            <Combobox
              items={options.filter((o) => o.value !== instructorId)}
              value={coInstructorId}
              onValueChange={setCoInstructorId}
              placeholder="Selecionar co-formador…"
              searchPlaceholder="Escreva para filtrar…"
            />
          </FormField>
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
            disabled={save.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => save.mutate(undefined)}
            loading={save.isPending}
            disabled={!instructorId}
          >
            Guardar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
