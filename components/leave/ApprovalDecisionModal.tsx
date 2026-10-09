// components/leave/ApprovalDecisionModal.tsx
// Aprovar/recusar uma etapa (docs/Modulo_Leave.md §7): a recusa exige
// justificação; a aprovação aceita um comentário opcional. A decisão fica
// associada ao utilizador e à data no backend.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { formatDate } from '@/lib/format';
import { queryKeys } from '@/lib/queryKeys';
import type { ApprovalRow } from './types';

export interface ApprovalDecisionModalProps {
  row: ApprovalRow;
  action: 'APPROVE' | 'REJECT';
  onClose: () => void;
}

export function ApprovalDecisionModal({
  row,
  action,
  onClose,
}: ApprovalDecisionModalProps) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const reject = action === 'REJECT';

  const decide = useApiMutation(
    () =>
      apiClient.patch(`/leave/${row.requestId}/approve`, {
        action,
        notes: notes.trim() || undefined,
      }),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: onClose,
      onError: (e) => setError(e.message),
    },
  );

  const missing = reject && !notes.trim() ? 'Indique a justificação da recusa.' : '';

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        navyHeader
        title={reject ? 'Recusar pedido' : 'Aprovar pedido'}
        description={`${row.request.user.fullName} — ${row.request.type.name}, ${formatDate(row.request.startDate)} a ${formatDate(row.request.endDate)}`}
        className="max-w-md"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <FormField
            label={reject ? 'Justificação *' : 'Comentário'}
            htmlFor="approval-notes"
          >
            <Textarea
              id="approval-notes"
              rows={4}
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                reject
                  ? 'Explique o motivo da recusa'
                  : 'Opcional — fica registado com a decisão'
              }
              className="w-full"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              intent={reject ? 'danger' : 'success'}
              loading={decide.isPending}
              disabled={!!missing}
              title={missing || undefined}
              onClick={() => {
                setError('');
                decide.mutate(undefined);
              }}
            >
              {reject ? 'Recusar' : 'Aprovar'}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
