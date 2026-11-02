// components/live-classes/SessionAttendanceModal.tsx
// "Adicionar presenças" de uma sessão: por colaboradores, por departamentos ou
// todos os colaboradores activos num clique (o servidor resolve "todos", por
// isso não fica limitado à lista carregada no ecrã).

'use client';

import { useMemo, useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useDepartmentOptions } from './wizard/wizardData';
import type { LiveClassSession } from './types';

type Mode = 'USERS' | 'DEPARTMENTS' | 'ALL';

const MODES: { value: Mode; label: string }[] = [
  { value: 'USERS', label: 'Colaboradores' },
  { value: 'DEPARTMENTS', label: 'Departamentos' },
  { value: 'ALL', label: 'Todos' },
];

interface Option {
  value: string;
  label: string;
}

function ChecklistPicker({
  options,
  picked,
  onChange,
  searchPlaceholder,
}: {
  options: Option[];
  picked: string[];
  onChange: (next: string[]) => void;
  searchPlaceholder: string;
}) {
  const [search, setSearch] = useState('');
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? options.filter((o) => o.label.toLowerCase().includes(term))
      : options;
  }, [options, search]);
  const allVisiblePicked =
    visible.length > 0 && visible.every((o) => picked.includes(o.value));

  function toggleAllVisible() {
    const visibleValues = visible.map((o) => o.value);
    onChange(
      allVisiblePicked
        ? picked.filter((v) => !visibleValues.includes(v))
        : [...new Set([...picked, ...visibleValues])],
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1"
        />
        <Button
          type="button"
          intent="secondary"
          size="sm"
          onClick={toggleAllVisible}
          disabled={visible.length === 0}
        >
          {allVisiblePicked ? 'Limpar todos' : 'Selecionar todos'}
        </Button>
      </div>
      <ul className="max-h-60 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {visible.length === 0 && (
          <li className="px-3 py-2 text-sm text-ink-muted">Sem resultados</li>
        )}
        {visible.map((o) => (
          <li key={o.value}>
            <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={picked.includes(o.value)}
                onChange={() =>
                  onChange(
                    picked.includes(o.value)
                      ? picked.filter((v) => v !== o.value)
                      : [...picked, o.value],
                  )
                }
              />
              {o.label}
            </label>
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted">{picked.length} selecionado(s)</p>
    </div>
  );
}

export function SessionAttendanceModal({
  session,
  onClose,
}: {
  session: LiveClassSession;
  onClose: () => void;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>('USERS');
  const [pickedUsers, setPickedUsers] = useState<string[]>([]);
  const [pickedDepts, setPickedDepts] = useState<string[]>([]);

  const usersQuery = useApiQuery<{ data: { id: number; fullName: string }[] }>(
    ['live-classes', 'users-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const userOptions: Option[] = (usersQuery.data?.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.fullName,
  }));
  const deptOptions: Option[] = useDepartmentOptions().map((d) => ({
    value: String(d.id),
    label: d.name,
  }));

  const add = useApiMutation(
    () =>
      apiClient.post<{ added: number; alreadyPresent: number }>(
        `/live-classes/${session.liveClassId}/attendance/bulk`,
        {
          sessionId: session.id,
          ...(mode === 'ALL'
            ? { all: true }
            : mode === 'DEPARTMENTS'
              ? { departmentIds: pickedDepts.map(Number) }
              : { userIds: pickedUsers.map(Number) }),
        },
      ),
    {
      invalidateKeys: [queryKeys.liveClasses.all],
      onSuccess: (res) => {
        toast({
          title: `${res.added} presença(s) adicionada(s)${
            res.alreadyPresent ? ` · ${res.alreadyPresent} já constavam` : ''
          }.`,
          intent: 'success',
        });
        onClose();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const canSubmit =
    mode === 'ALL' ||
    (mode === 'USERS' ? pickedUsers.length : pickedDepts.length) > 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Adicionar presenças — sessão ${session.seq}`}
        className="max-w-md"
      >
        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            {MODES.map((m) => (
              <Button
                key={m.value}
                type="button"
                size="sm"
                intent={mode === m.value ? 'primary' : 'secondary'}
                onClick={() => setMode(m.value)}
              >
                {m.label}
              </Button>
            ))}
          </div>

          {mode === 'USERS' && (
            <ChecklistPicker
              options={userOptions}
              picked={pickedUsers}
              onChange={setPickedUsers}
              searchPlaceholder="Procurar colaborador…"
            />
          )}
          {mode === 'DEPARTMENTS' && (
            <ChecklistPicker
              options={deptOptions}
              picked={pickedDepts}
              onChange={setPickedDepts}
              searchPlaceholder="Procurar departamento…"
            />
          )}
          {mode === 'ALL' && (
            <p className="rounded-md border border-border p-3 text-sm text-ink-muted">
              Todos os colaboradores activos serão adicionados a esta sessão.
              Quem já consta na lista não é duplicado.
            </p>
          )}
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => add.mutate(undefined)}
            loading={add.isPending}
            disabled={!canSubmit}
          >
            Adicionar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
