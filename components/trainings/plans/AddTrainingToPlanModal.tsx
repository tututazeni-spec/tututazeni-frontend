// components/trainings/plans/AddTrainingToPlanModal.tsx
// Modal «Adicionar formação ao plano». Partilhado pelo menu ⋯ do card
// (PlansView) e pelo detalhe do plano (PlanDetailView).

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import type { Training } from '../types';

interface AddTrainingToPlanModalProps {
  planId: number;
  onClose: () => void;
}

export function AddTrainingToPlanModal({
  planId,
  onClose,
}: AddTrainingToPlanModalProps) {
  const toast = useToast();
  const [trainingId, setTrainingId] = useState('');

  const { data } = useApiQuery<{ data: Training[] }>(
    queryKeys.trainings.manage({ limit: 200 }),
    '/trainings/manage',
    { params: { limit: 200 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const add = useApiMutation(
    (id: number) =>
      apiClient.post(`/training-plans/${planId}/trainings`, { trainingId: id }),
    {
      invalidateKeys: [queryKeys.trainingPlans.all],
      onSuccess: () => {
        toast({ title: 'Formação associada ao plano.', intent: 'success' });
        onClose();
      },
      onError: (e: Error) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const items = (data?.data ?? [])
    .filter((t) => t.trainingPlanId !== planId)
    .map((t) => ({ value: String(t.id), label: t.title }));

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title="Adicionar formação ao plano">
        <div className="mt-4 space-y-4">
          <FormField label="Formação" htmlFor="add-training-id">
            <Combobox
              items={items}
              value={trainingId || undefined}
              onValueChange={setTrainingId}
              placeholder="Selecionar formação"
              className="w-full"
            />
          </FormField>
          <div className="flex gap-3">
            <Button
              intent="secondary"
              className="flex-1 justify-center"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 justify-center"
              loading={add.isPending}
              disabled={!trainingId}
              onClick={() => {
                const id = Number(trainingId);
                if (Number.isFinite(id) && id > 0) add.mutate(id);
              }}
            >
              Associar
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
