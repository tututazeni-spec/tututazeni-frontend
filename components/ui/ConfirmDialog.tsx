// components/ui/ConfirmDialog.tsx
'use client';

import { Modal, ModalContent, ModalClose } from './Modal';
import { Button } from './Button';
import type { ConfirmOptions } from '../../providers/ConfirmProvider';

interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open onOpenChange={(open) => !open && onCancel()}>
      <ModalContent title={title} description={message}>
        <div className="mt-6 flex justify-end gap-3">
          <ModalClose asChild>
            <Button intent="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
          </ModalClose>
          <Button intent={destructive ? 'danger' : 'primary'} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
