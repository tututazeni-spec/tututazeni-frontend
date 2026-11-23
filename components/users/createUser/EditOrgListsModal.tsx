// components/users/createUser/EditOrgListsModal.tsx
// Editar as listas de unidades e áreas de um departamento (as que o
// formulário de utilizador oferece). Renomear, remover ou acrescentar;
// grava com PUT /users/org-options (ADMIN/RH).

'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import type { DepartmentOrgOptions } from '../createUserData';

interface UnitRow {
  id?: number;
  name: string;
}

interface EditOrgListsModalProps {
  departmentId: string;
  departmentName: string;
  org: DepartmentOrgOptions | undefined;
  onClose: () => void;
}

function ListEditor({
  title,
  names,
  onRename,
  onRemove,
  onAdd,
  addLabel,
}: {
  title: string;
  names: string[];
  onRename: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      <div className="space-y-2">
        {names.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              className="w-full"
              value={value}
              aria-label={`${title} ${i + 1}`}
              onChange={(e) => onRename(i, e.target.value)}
            />
            <IconButton
              icon={X}
              label="Remover"
              intent="ghost"
              size="xs"
              type="button"
              onClick={() => onRemove(i)}
            />
          </div>
        ))}
      </div>
      <Button
        intent="ghost"
        size="sm"
        type="button"
        className="mt-2"
        onClick={onAdd}
      >
        <Plus size={14} strokeWidth={1.75} />
        {addLabel}
      </Button>
    </div>
  );
}

export function EditOrgListsModal({
  departmentId,
  departmentName,
  org,
  onClose,
}: EditOrgListsModalProps) {
  const notify = useToast();
  const [units, setUnits] = useState<UnitRow[]>(
    (org?.units ?? []).map((u) => ({ id: u.id, name: u.name })),
  );
  const [areas, setAreas] = useState<string[]>(org?.areas ?? []);
  const [error, setError] = useState('');

  const save = useApiMutation(
    () =>
      apiClient.put('/users/org-options', {
        departmentId: Number(departmentId),
        units: units.filter((u) => u.name.trim()),
        areas: areas.filter((a) => a.trim()),
      }),
    {
      invalidateKeys: [
        queryKeys.users.orgOptions(departmentId),
        queryKeys.departments.units(),
      ],
      onSuccess: () => {
        notify({ title: 'Listas atualizadas', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Editar listas do departamento"
        description={departmentName}
        navyHeader
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-control border border-danger/30 bg-danger-subtle p-3 text-sm text-danger-ink">
              {error}
            </div>
          )}
          <ListEditor
            title="Unidades"
            names={units.map((u) => u.name)}
            onRename={(i, v) =>
              setUnits(units.map((u, j) => (j === i ? { ...u, name: v } : u)))
            }
            onRemove={(i) => setUnits(units.filter((_, j) => j !== i))}
            onAdd={() => setUnits([...units, { name: '' }])}
            addLabel="Acrescentar unidade"
          />
          <ListEditor
            title="Áreas"
            names={areas}
            onRename={(i, v) =>
              setAreas(areas.map((a, j) => (j === i ? v : a)))
            }
            onRemove={(i) => setAreas(areas.filter((_, j) => j !== i))}
            onAdd={() => setAreas([...areas, ''])}
            addLabel="Acrescentar área"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => save.mutate(undefined)}
              disabled={save.isPending}
              loading={save.isPending}
            >
              Guardar listas
            </Button>
            <Button intent="secondary" type="button" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
