// components/scalability/RenameTenantModal.tsx
// Modal de edição do nome da empresa no banner "Tenant Activo" (separador
// Visão Geral do módulo de Escalabilidade). A página só monta o componente
// quando aberto; o Modal fica sempre `open` e delega o fecho em `onClose`.
//
// NOTA: o módulo corre sobre dados mock (ver
// app/(platform)/scalability/page.tsx). O novo nome actualiza só o estado
// local do dashboard. O endpoint real (PATCH /scalability/tenants/:id, @Roles
// ADMIN) precisa do id do tenant, que os dados mock não transportam.

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface RenameTenantModalProps {
  currentName: string;
  onRename: (name: string) => void;
  onClose: () => void;
}

export function RenameTenantModal({
  currentName,
  onRename,
  onClose,
}: RenameTenantModalProps) {
  const notify = useToast();
  const [name, setName] = useState(currentName);

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed !== currentName;

  const handleSave = () => {
    if (!canSave) return;
    onRename(trimmed);
    notify({ title: 'Nome da empresa actualizado', intent: 'success' });
    onClose();
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Editar nome da empresa"
        description="Altera o nome apresentado no banner do tenant activo."
        className="max-w-md"
      >
        <div className="mt-5">
          <FormField label="Nome da empresa *" htmlFor="rt-name">
            <Input
              id="rt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              maxLength={120}
              autoFocus
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Guardar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
