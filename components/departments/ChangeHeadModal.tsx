// components/departments/ChangeHeadModal.tsx
// Modal "Alterar responsável" — separador Responsáveis
// (docs/modulo_departments.md Ponto 4). Reaproveita PUT /departments/:id
// (mesma rota do formulário de edição) com headId + headChangeReason; o
// backend fecha o registo de DepartmentHeadHistory em aberto e cria um novo
// com o motivo e o utilizador que fez a alteração (ver
// departments.service.ts#update).

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { DepartmentUserPicker } from './DepartmentUserPicker';
import type { DirectoryUser } from './departmentFormData';
import type { HeadRow } from './types';

export function ChangeHeadModal({
  row,
  onClose,
}: {
  row: HeadRow;
  onClose: () => void;
}) {
  const notify = useToast();
  const [newHead, setNewHead] = useState<DirectoryUser | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const mutation = useApiMutation(
    (body: { headId: number; headChangeReason?: string }) =>
      apiClient.put(`/departments/${row.departmentId}`, body),
    {
      invalidateKeys: [queryKeys.departments.heads(), queryKeys.departments.headsHistory()],
      onSuccess: () => {
        notify({ title: 'Responsável alterado', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao alterar o responsável.'),
    },
  );

  const handleSubmit = () => {
    if (!newHead || mutation.isPending) return;
    setError('');
    mutation.mutate({
      headId: newHead.id,
      ...(reason.trim() ? { headChangeReason: reason.trim() } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Alterar responsável — ${row.departmentName}`}
        description={
          row.head
            ? `Responsável actual: ${row.head.fullName}`
            : 'Este departamento ainda não tem responsável atribuído.'
        }
      >
        <div className="mt-5 space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}

          <DepartmentUserPicker
            label="Novo responsável *"
            htmlFor="ch-head"
            value={newHead}
            onChange={setNewHead}
            excludeId={row.head?.id}
          />

          <FormField label="Motivo da alteração" htmlFor="ch-reason">
            <Textarea
              id="ch-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: Promoção, saída, reorganização departamental…"
              rows={3}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!newHead || mutation.isPending}
            >
              {mutation.isPending ? 'A guardar…' : 'Confirmar alteração'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
