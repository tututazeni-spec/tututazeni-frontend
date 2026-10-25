// components/courses/CreateCohortModal.tsx
// Modal "Criar turma" (docs/modulo_courses.md secção 5). Formador é
// opcional — pesquisa livre no diretório interno (GET /users/directory),
// mesmo padrão do picker de colaborador em EnrollUserModal.

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { CohortDepartmentPicker } from './CohortDepartmentPicker';
import {
  useDirectoryUsers,
  type DirectoryUser,
} from '@/components/enrollments/enrollData';
import { EmptyState } from '@/components/ui/EmptyState';

export interface CreateCohortModalProps {
  courseId: number;
  onClose: () => void;
}

interface CreateCohortModalFormValues {
  name: string;
  instructorSearch: string;
  instructor: DirectoryUser | null;
  location: string;
  room: string;
  schedule: string;
  capacity: string;
  startDate: string;
  endDate: string;
  error: string;
  participants: DirectoryUser[];
  participantSearch: string;
}

export function CreateCohortModal({
  courseId,
  onClose,
}: CreateCohortModalProps) {
  const toast = useToast();
  const { values: formValues, set: setField } =
    useFormState<CreateCohortModalFormValues>({
      name: '',
      instructorSearch: '',
      instructor: null,
      location: '',
      room: '',
      schedule: '',
      capacity: '30',
      startDate: '',
      endDate: '',
      error: '',
      participants: [],
      participantSearch: '',
    });
  const {
    name,
    instructorSearch,
    instructor,
    location,
    room,
    schedule,
    capacity,
    startDate,
    endDate,
    error,
    participants,
    participantSearch,
  } = formValues;

  const { users, loading: usersLoading } = useDirectoryUsers(
    instructorSearch,
    '',
    !instructor && instructorSearch.trim().length > 0,
  );

  const { users: participantResults, loading: participantsLoading } =
    useDirectoryUsers(
      participantSearch,
      '',
      participantSearch.trim().length > 0,
    );

  function addParticipants(list: DirectoryUser[]) {
    setField('participants', (cur) => {
      const ids = new Set(cur.map((p) => p.id));
      return [...cur, ...list.filter((u) => !ids.has(u.id))];
    });
  }

  async function addDepartment(departmentId: number) {
    try {
      // Sem pesquisa, o diretório devolve o departamento inteiro (sem limite).
      const members = await apiClient.get<DirectoryUser[]>('/users/directory', {
        params: { departmentId },
      });
      if (members.length === 0) {
        toast({
          title: 'Departamento sem colaboradores activos',
          intent: 'danger',
        });
        return;
      }
      addParticipants(members);
      toast({
        title: `${members.length} colaborador(es) adicionado(s)`,
        intent: 'success',
      });
    } catch (e) {
      toast({ title: (e as Error).message, intent: 'danger' });
    }
  }

  const create = useApiMutation(
    (vars: Record<string, unknown>) =>
      apiClient.post(`/courses/${courseId}/cohorts`, vars),
    {
      invalidateKeys: [queryKeys.courses.cohorts(courseId)],
      onSuccess: () => {
        toast({ title: 'Turma criada', intent: 'success' });
        onClose();
      },
      onError: (e) => setField('error', e.message || 'Erro ao criar turma.'),
    },
  );

  const canSubmit = Boolean(name.trim() && startDate) && !create.isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    setField('error', '');
    create.mutate({
      name: name.trim(),
      instructorId: instructor?.id,
      location: location.trim() || undefined,
      room: room.trim() || undefined,
      schedule: schedule.trim() || undefined,
      capacity: Number(capacity) || undefined,
      startDate,
      endDate: endDate || undefined,
      userIds: participants.length ? participants.map((p) => p.id) : undefined,
    });
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Criar turma"
        description="Para cursos presenciais ou híbridos — define local, horário e formador."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-black">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome da turma *" htmlFor="ch-name">
            <Input
              id="ch-name"
              autoComplete="off"
              value={name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex: Turma A — Lisboa"
            />
          </FormField>

          <FormField label="Formador (opcional)" htmlFor="ch-instructor">
            {instructor ? (
              <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
                <Avatar
                  name={instructor.fullName}
                  url={instructor.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1 truncate text-sm text-ink">
                  {instructor.fullName}
                </div>
                <IconButton
                  icon={X}
                  label="Remover formador"
                  intent="ghost"
                  size="compact"
                  type="button"
                  onClick={() => setField('instructor', null)}
                />
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="ch-instructor"
                  value={instructorSearch}
                  onChange={(e) => setField('instructorSearch', e.target.value)}
                  className="w-full"
                  placeholder="Pesquisar por nome ou email…"
                  autoComplete="off"
                />
                {instructorSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {usersLoading && (
                      <div className="px-3 py-2 text-sm text-ink-muted">
                        A pesquisar…
                      </div>
                    )}
                    {!usersLoading && users.length === 0 && (
                      <EmptyState
                        variant="inline"
                        title="Nenhum colaborador encontrado"
                      />
                    )}
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setField('instructor', u);
                          setField('instructorSearch', '');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                      >
                        <Avatar
                          name={u.fullName}
                          url={u.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <div className="min-w-0 truncate text-sm text-ink">
                          {u.fullName}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Local" htmlFor="ch-location">
              <Input
                id="ch-location"
                autoComplete="off"
                value={location}
                onChange={(e) => setField('location', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Sala" htmlFor="ch-room">
              <Input
                id="ch-room"
                autoComplete="off"
                value={room}
                onChange={(e) => setField('room', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Horário" htmlFor="ch-schedule">
            <Input
              id="ch-schedule"
              autoComplete="off"
              value={schedule}
              onChange={(e) => setField('schedule', e.target.value)}
              className="w-full"
              placeholder="Ex: Seg/Qua 18h-20h"
            />
          </FormField>

          <FormField
            label={`Participantes (${participants.length})`}
            htmlFor="ch-participants"
          >
            <div className="space-y-2">
              <CohortDepartmentPicker onAdd={addDepartment} />
              <div className="relative">
                <Input
                  id="ch-participants"
                  value={participantSearch}
                  onChange={(e) =>
                    setField('participantSearch', e.target.value)
                  }
                  className="w-full"
                  placeholder="Ou pesquisar colaborador por nome ou email…"
                  autoComplete="off"
                />
                {participantSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {participantsLoading && (
                      <div className="px-3 py-2 text-sm text-ink-muted">
                        A pesquisar…
                      </div>
                    )}
                    {!participantsLoading &&
                      participantResults.length === 0 && (
                        <EmptyState
                          variant="inline"
                          title="Nenhum colaborador encontrado"
                        />
                      )}
                    {participantResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          addParticipants([u]);
                          setField('participantSearch', '');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                      >
                        <Avatar
                          name={u.fullName}
                          url={u.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <div className="min-w-0 truncate text-sm text-ink">
                          {u.fullName}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {participants.length > 0 && (
                <div className="max-h-44 divide-y divide-border overflow-y-auto rounded-card border border-border">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-2 py-1.5"
                    >
                      <Avatar
                        name={p.fullName}
                        url={p.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1 truncate text-sm text-ink">
                        {p.fullName}
                      </div>
                      <IconButton
                        icon={X}
                        label={`Remover ${p.fullName}`}
                        intent="ghostDanger"
                        size="compact"
                        type="button"
                        onClick={() =>
                          setField('participants', (cur) =>
                            cur.filter((x) => x.id !== p.id),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Data de início *" htmlFor="ch-start">
              <Input
                id="ch-start"
                type="date"
                value={startDate}
                onChange={(e) => setField('startDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de fim" htmlFor="ch-end">
              <Input
                id="ch-end"
                type="date"
                value={endDate}
                onChange={(e) => setField('endDate', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Capacidade" htmlFor="ch-capacity">
              <Input
                id="ch-capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setField('capacity', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
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
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={create.isPending}
          >
            Criar turma
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
