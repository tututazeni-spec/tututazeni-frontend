// components/enrollments/EnrollUserModal.tsx
// Modal "+ Matricular" da aba Gestão (Admin): matricula um colaborador num
// curso. Segue o padrão de components/courses/CreateCourseModal — a page só
// monta o componente quando está aberto, por isso o Modal fica sempre `open`
// e `onOpenChange` delega em `onClose` (X, clique fora, Escape).
//
// Pickers: Combobox para o curso (catálogo carregado por useCourseOptions);
// campo de pesquisa livre para o colaborador, servido por GET /users/directory
// (useDirectoryUsers). Submete em POST /enrollments — 409 = já inscrito.

'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { ApiError, apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import {
  useCourseOptions,
  useDirectoryUsers,
  type DirectoryUser,
} from './enrollData';

export interface EnrollUserModalProps {
  onClose: () => void;
}

export function EnrollUserModal({ onClose }: EnrollUserModalProps) {
  const notify = useToast();
  const [courseId, setCourseId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [deadline, setDeadline] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { options: courseOptions } = useCourseOptions();
  const { users, loading: usersLoading } = useDirectoryUsers(
    userSearch,
    '',
    !selectedUser && userSearch.trim().length > 0,
  );

  const enroll = useApiMutation(
    () =>
      apiClient.post('/enrollments', {
        userId: selectedUser!.id,
        courseId: Number(courseId),
        ...(deadline ? { deadline } : {}),
        ...(mandatory ? { mandatory: true } : {}),
      }),
    {
      invalidateKeys: [queryKeys.enrollments.lists()],
      onSuccess: () => {
        notify({ title: 'Colaborador matriculado', intent: 'success' });
        onClose();
      },
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409) {
          setSubmitError('Este colaborador já está inscrito neste curso.');
        } else {
          setSubmitError(e.message || 'Erro ao matricular. Tente novamente.');
        }
      },
    },
  );
  const loading = enroll.isPending;

  const canSubmit = Boolean(courseId && selectedUser) && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitError('');
    enroll.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Matricular colaborador"
        description="Inscreve um colaborador num curso. Ele passa a ver o curso em “As minhas matrículas”."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Curso *" htmlFor="eu-course">
            <Combobox
              items={courseOptions}
              value={courseId || undefined}
              onValueChange={setCourseId}
              placeholder="Selecionar curso"
              searchPlaceholder="Escreva para filtrar cursos…"
              emptyText="Nenhum curso encontrado"
            />
          </FormField>

          <FormField label="Colaborador *" htmlFor="eu-user">
            {selectedUser ? (
              <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
                <Avatar
                  name={selectedUser.fullName}
                  url={selectedUser.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">
                    {selectedUser.fullName}
                  </div>
                  {selectedUser.email && (
                    <div className="truncate text-xs text-ink-faint">
                      {selectedUser.email}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Remover colaborador"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="eu-user"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full"
                  placeholder="Pesquisar por nome ou email…"
                  autoComplete="off"
                />
                {userSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {usersLoading && (
                      <div className="px-3 py-2 text-sm text-ink-muted">
                        A pesquisar…
                      </div>
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
                          setSelectedUser(u);
                          setUserSearch('');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                      >
                        <Avatar
                          name={u.fullName}
                          url={u.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm text-ink">
                            {u.fullName}
                          </div>
                          <div className="truncate text-xs text-ink-faint">
                            {u.department?.name ?? u.email ?? '—'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Prazo (opcional)" htmlFor="eu-deadline">
              <Input
                id="eu-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full"
              />
            </FormField>
            <label className="flex items-end gap-2 pb-2.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={mandatory}
                onChange={(e) => setMandatory(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-primary"
              />
              Matrícula obrigatória
            </label>
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
            loading={loading}
          >
            {loading ? 'A matricular…' : 'Matricular'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
