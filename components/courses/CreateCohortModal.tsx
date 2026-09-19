// components/courses/CreateCohortModal.tsx
// Modal "Criar turma" (docs/modulo_courses.md secção 5). Formador é
// opcional — pesquisa livre no diretório interno (GET /users/directory),
// mesmo padrão do picker de colaborador em EnrollUserModal.

'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useDirectoryUsers, type DirectoryUser } from '@/components/enrollments/enrollData';

export interface CreateCohortModalProps {
  courseId: number;
  onClose: () => void;
}

export function CreateCohortModal({ courseId, onClose }: CreateCohortModalProps) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [instructorSearch, setInstructorSearch] = useState('');
  const [instructor, setInstructor] = useState<DirectoryUser | null>(null);
  const [location, setLocation] = useState('');
  const [room, setRoom] = useState('');
  const [schedule, setSchedule] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const { users, loading: usersLoading } = useDirectoryUsers(
    instructorSearch,
    '',
    !instructor && instructorSearch.trim().length > 0,
  );

  const create = useApiMutation(
    (vars: Record<string, unknown>) => apiClient.post(`/courses/${courseId}/cohorts`, vars),
    {
      invalidateKeys: [queryKeys.courses.cohorts(courseId)],
      onSuccess: () => {
        toast({ title: 'Turma criada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao criar turma.'),
    },
  );

  const canSubmit = Boolean(name.trim() && startDate) && !create.isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    create.mutate({
      name: name.trim(),
      instructorId: instructor?.id,
      location: location.trim() || undefined,
      room: room.trim() || undefined,
      schedule: schedule.trim() || undefined,
      capacity: Number(capacity) || undefined,
      startDate,
      endDate: endDate || undefined,
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
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome da turma *" htmlFor="ch-name">
            <Input
              id="ch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              placeholder="Ex: Turma A — Lisboa"
            />
          </FormField>

          <FormField label="Formador (opcional)" htmlFor="ch-instructor">
            {instructor ? (
              <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
                <Avatar name={instructor.fullName} url={instructor.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1 truncate text-sm text-ink">
                  {instructor.fullName}
                </div>
                <button
                  type="button"
                  aria-label="Remover formador"
                  onClick={() => setInstructor(null)}
                  className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="ch-instructor"
                  value={instructorSearch}
                  onChange={(e) => setInstructorSearch(e.target.value)}
                  className="w-full"
                  placeholder="Pesquisar por nome ou email…"
                  autoComplete="off"
                />
                {instructorSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {usersLoading && (
                      <div className="px-3 py-2 text-sm text-ink-muted">A pesquisar…</div>
                    )}
                    {!usersLoading && users.length === 0 && (
                      <div className="px-3 py-2 text-sm text-ink-muted">
                        Nenhum colaborador encontrado
                      </div>
                    )}
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setInstructor(u);
                          setInstructorSearch('');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                      >
                        <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                        <div className="min-w-0 truncate text-sm text-ink">{u.fullName}</div>
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
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Sala" htmlFor="ch-room">
              <Input id="ch-room" value={room} onChange={(e) => setRoom(e.target.value)} className="w-full" />
            </FormField>
          </div>

          <FormField label="Horário" htmlFor="ch-schedule">
            <Input
              id="ch-schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="w-full"
              placeholder="Ex: Seg/Qua 18h-20h"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Data de início *" htmlFor="ch-start">
              <Input
                id="ch-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Data de fim" htmlFor="ch-end">
              <Input
                id="ch-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Capacidade" htmlFor="ch-capacity">
              <Input
                id="ch-capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
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
