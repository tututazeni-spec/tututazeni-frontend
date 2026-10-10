// components/leave/ApprovalReassignModal.tsx
// Reatribuir uma etapa de aprovação a outro aprovador (docs/Modulo_Leave.md
// §7: substituto/delegado e histórico de reatribuições). O backend regista
// quem reatribuiu, de quem para quem e o motivo.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useApproverCandidates } from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { ApprovalRow } from './types';

export interface ApprovalReassignModalProps {
  row: ApprovalRow;
  onClose: () => void;
}

export function ApprovalReassignModal({
  row,
  onClose,
}: ApprovalReassignModalProps) {
  const [toId, setToId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const candidates = useApproverCandidates('', true);

  const reassign = useApiMutation(
    () =>
      apiClient.post(`/leave/approvals/${row.id}/reassign`, {
        toApproverId: Number(toId),
        reason: reason.trim() || undefined,
      }),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: onClose,
      onError: (e) => setError(e.message),
    },
  );

  const items = candidates
    .filter(
      (c) => c.id !== row.approver.id && c.id !== row.request.user.id,
    )
    .map((c) => ({
      value: String(c.id),
      label: `${c.fullName}${c.role ? ` (${c.role.code})` : ''}`,
    }));

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        navyHeader
        title="Reatribuir aprovação"
        description={`Etapa actual: ${row.approver.fullName}. A reatribuição fica no histórico do pedido.`}
        className="max-w-md"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <FormField label="Novo aprovador *" htmlFor="reassign-to">
            <Combobox
              items={items}
              value={toId}
              onValueChange={setToId}
              placeholder="Seleccionar aprovador"
              searchPlaceholder="Procurar…"
              emptyText="Nenhum aprovador disponível"
              className="w-full"
            />
          </FormField>
          <FormField label="Motivo" htmlFor="reassign-reason">
            <Textarea
              id="reassign-reason"
              rows={3}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: férias do aprovador"
              className="w-full"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              loading={reassign.isPending}
              disabled={!toId}
              onClick={() => {
                setError('');
                reassign.mutate(undefined);
              }}
            >
              Reatribuir
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
