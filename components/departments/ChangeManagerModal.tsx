// components/departments/ChangeManagerModal.tsx
// Aba "Hierarquia": alterar o responsável directo (User.managerId) de um
// colaborador. Backend: PUT /users/:id (ADMIN/RH) — recusa o próprio
// colaborador e ciclos na hierarquia.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { DepartmentUserPicker } from './DepartmentUserPicker';
import type { DirectoryUser } from './departmentFormData';

export interface ChangeManagerTarget {
  id: number;
  fullName: string;
  /** Departamento do colaborador — o responsável directo tem de ser do mesmo. */
  departmentId: number | null;
  departmentName: string | null;
  manager: { id: number; fullName: string } | null;
}

export function ChangeManagerModal({
  target,
  onClose,
}: {
  target: ChangeManagerTarget;
  onClose: () => void;
}) {
  const notify = useToast();
  const [manager, setManager] = useState<DirectoryUser | null>(null);
  const [noManager, setNoManager] = useState(false);
  const [error, setError] = useState('');

  const mutation = useApiMutation(
    (managerId: number | null) =>
      apiClient.put(`/users/${target.id}`, { managerId }),
    {
      invalidateKeys: [queryKeys.departments.all],
      onSuccess: () => {
        notify({ title: 'Responsável directo alterado', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setError(
          e.message || 'Não foi possível alterar o responsável directo.',
        ),
    },
  );

  const canSubmit = (noManager || manager != null) && !mutation.isPending;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Responsável directo — ${target.fullName}`}
        description={
          target.manager
            ? `Responsável actual: ${target.manager.fullName}`
            : 'Este colaborador ainda não tem responsável directo.'
        }
      >
        <div className="mt-5 space-y-4">
          {error && <p className="text-sm text-danger">{error}</p>}

          <p className="rounded-card bg-brand-soft px-3 py-2 text-xs text-brand">
            {target.departmentId != null
              ? `Pode escolher colaboradores do departamento «${target.departmentName ?? ''}» ou os chefes do departamento superior e dos subdepartamentos.`
              : 'Este colaborador não tem departamento: defina primeiro o departamento para poder escolher o responsável directo.'}
          </p>

          {!noManager && target.departmentId != null && (
            <DepartmentUserPicker
              label="Novo responsável directo *"
              htmlFor="cm-manager"
              value={manager}
              onChange={setManager}
              excludeId={target.id}
              managerOfDepartmentId={target.departmentId ?? undefined}
            />
          )}

          <label className="flex items-center gap-2 text-sm text-ink">
            <Checkbox
              checked={noManager}
              onChange={(e) => {
                setNoManager(e.target.checked);
                if (e.target.checked) setManager(null);
              }}
            />
            Sem responsável directo (topo da hierarquia)
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!canSubmit}
              loading={mutation.isPending}
              onClick={() => {
                setError('');
                mutation.mutate(noManager ? null : (manager?.id ?? null));
              }}
            >
              Confirmar alteração
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
