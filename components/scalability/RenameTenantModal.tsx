// components/scalability/RenameTenantModal.tsx
// Modal de edição do nome da empresa no banner "Tenant Activo" (separador
// Visão Geral do módulo de Escalabilidade). A página só monta o componente
// quando aberto; o Modal fica sempre `open` e delega o fecho em `onClose`.
//
// Liga a PATCH /scalability/tenants/:id (@Roles ADMIN) — a plataforma é
// single-tenant na prática, por isso `tenantId` vem sempre do
// `dashboard.tenantInfo.id` já carregado pelo container.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { reportError } from '@/lib/errorReporting';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';

export interface RenameTenantModalProps {
  tenantId: string;
  currentName: string;
  onClose: () => void;
}

export function RenameTenantModal({
  tenantId,
  currentName,
  onClose,
}: RenameTenantModalProps) {
  const notify = useToast();
  const [name, setName] = useState(currentName);

  const rename = useApiMutation<unknown, string>(
    (tenantName) =>
      apiClient.patch(`/scalability/tenants/${tenantId}`, { tenantName }),
    { invalidateKeys: [queryKeys.scalability.dashboard()] },
  );

  const trimmed = name.trim();
  const canSave = trimmed.length > 0 && trimmed !== currentName && !rename.isPending;

  const handleSave = () => {
    if (!canSave) return;
    rename.mutate(trimmed, {
      onSuccess: () => {
        notify({ title: 'Nome da empresa actualizado', intent: 'success' });
        onClose();
      },
      onError: (err) => {
        reportError(err, { source: 'RenameTenantModal.handleSave' });
        notify({ title: 'Não foi possível actualizar o nome', intent: 'danger' });
      },
    });
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
            {rename.isPending ? 'A guardar…' : 'Guardar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
