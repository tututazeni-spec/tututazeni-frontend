'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface ResolveDisputeModalProps {
  disputeId: number;
  payslipId: number;
  onClose: () => void;
}

export function ResolveDisputeModal({ disputeId, payslipId, onClose }: ResolveDisputeModalProps) {
  const notify = useToast();
  const [resolution, setResolution] = useState('');
  const [reissue, setReissue] = useState(false);

  const resolve = useApiMutation(
    (body: { resolution: string; reissue: boolean }) =>
      apiClient.patch(`/payslips/disputes/${disputeId}/resolve`, body),
    {
      invalidateKeys: [
        [...queryKeys.payslips.all, 'disputes'],
        queryKeys.payslips.adminDetail(payslipId),
        [...queryKeys.payslips.all, 'admin-list'],
        [...queryKeys.payslips.all, 'dashboard'],
      ],
      onSuccess: () => {
        notify({ title: 'Disputa resolvida', intent: 'success' });
        onClose();
      },
      onError: (e: Error) =>
        notify({
          title:
            (e as { status?: number }).status === 409 ? 'Disputa já resolvida' : e.message,
          intent: 'danger',
        }),
    },
  );

  const handleSubmit = () => {
    if (!resolution.trim() || resolve.isPending) return;
    resolve.mutate({ resolution: resolution.trim(), reissue });
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title="Resolver disputa" className="max-w-md">
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="rdm-resolution" className="mb-1 block font-body text-sm text-ink-muted">
              Resolução *
            </label>
            <Textarea
              id="rdm-resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              className="w-full"
              placeholder="Descreve o que foi decidido / corrigido…"
            />
          </div>
          <label className="flex items-start gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={reissue}
              onChange={(e) => setReissue(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Reemitir recibo (volta a Emitido)
              <span className="mt-0.5 block font-body text-xs text-ink-faint">
                Marca apenas se a correcção já está feita e o recibo pode sair do estado Disputa.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={resolve.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!resolution.trim()} loading={resolve.isPending}>
            Resolver disputa
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
