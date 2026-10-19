// components/certificates/ReasonDialog.tsx
// Diálogo com motivo obrigatório (3–500 caracteres) para revogar ou reemitir.
// O backend valida de novo e o erro devolvido aparece aqui, sem fechar o diálogo.

'use client';

import { useState } from 'react';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';

const MIN = 3;
const MAX = 500;

export interface ReasonDialogProps {
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  pending?: boolean;
  /** Erro devolvido pelo servidor. */
  error?: string;
}

export function ReasonDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  pending,
  error,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [tooShort, setTooShort] = useState(false);

  function submit() {
    const clean = reason.trim();
    if (clean.length < MIN) {
      setTooShort(true);
      return;
    }
    setTooShort(false);
    onConfirm(clean);
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title={title} description={description} navyHeader>
        <div className="space-y-4">
          {error && (
            <AlertCard
              variant="danger"
              title="Não foi possível concluir"
              message={error}
              compact
            />
          )}
          <FormField
            label="Motivo"
            htmlFor="reason-text"
            error={
              tooShort
                ? `O motivo tem de ter pelo menos ${MIN} caracteres.`
                : undefined
            }
            hint={`${reason.length}/${MAX}`}
          >
            <textarea
              id="reason-text"
              value={reason}
              maxLength={MAX}
              rows={4}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? 'A processar…' : confirmLabel}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
