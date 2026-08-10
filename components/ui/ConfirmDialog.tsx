// components/ui/ConfirmDialog.tsx
'use client';

import { useRef } from 'react';
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
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal open onOpenChange={(open) => !open && onCancel()}>
      <ModalContent
        title={title}
        description={message}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          confirmBtnRef.current?.focus();
        }}
      >
        <div className="mt-6 flex justify-end gap-3">
          <ModalClose asChild>
            <Button intent="ghost">{cancelLabel}</Button>
          </ModalClose>
          <Button
            ref={confirmBtnRef}
            intent={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
