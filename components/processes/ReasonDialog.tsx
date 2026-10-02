// components/processes/ReasonDialog.tsx
// Modal de justificação (cancelar, suspender, devolver, bloquear, reabrir…).
// Substitui os prompt() do browser: §4/§6 exigem justificação registada para
// várias acções. A página só monta o componente quando aberto.

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';

export interface ReasonDialogProps {
  title: string;
  description?: string;
  label?: string;
  confirmLabel?: string;
  /** Justificação obrigatória (por defeito, sim). */
  required?: boolean;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function ReasonDialog({
  title,
  description,
  label = 'Justificação',
  confirmLabel = 'Confirmar',
  required = true,
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const canConfirm = !required || reason.trim().length > 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={title} description={description} className="max-w-md">
        <div className="mt-4">
          <FormField label={required ? `${label} *` : label} htmlFor="reason-dialog">
            <Textarea
              id="reason-dialog"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full"
              autoFocus
            />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            intent={destructive ? 'danger' : 'primary'}
            disabled={!canConfirm}
            loading={loading}
            onClick={() => onConfirm(reason.trim())}
          >
            {confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
