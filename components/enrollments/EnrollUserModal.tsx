// components/enrollments/EnrollUserModal.tsx
// Modal "+ Matricular" da aba Gestão (Admin): matricula um colaborador num
// curso. Segue o padrão de components/courses/CreateCourseModal — a page só
// monta o componente quando está aberto, por isso o Modal fica sempre `open`
// e `onOpenChange` delega em `onClose` (X, clique fora, Escape).
//
// Pickers: Combobox para o curso (catálogo carregado por useCourseOptions);
// campo de pesquisa livre para o colaborador, servido por GET /users/directory
// (useDirectoryUsers). Submete em POST /enrollments — 409 = já inscrito.
//
// Departamentos (multi-selecção, opcional): abaixo do colaborador. Os membros
// activos de cada departamento escolhido (GET /users/directory?departmentId=)
// somam-se ao colaborador individual e vão todos em POST /enrollments/bulk,
// que ignora quem já está inscrito.

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
  useDepartmentOptions,
  useDirectoryUsers,
  type DirectoryUser,
} from './enrollData';
import { Checkbox } from '@/components/ui/Checkbox';

export interface EnrollUserModalProps {
  onClose: () => void;
  /** Pré-selecciona e bloqueia o curso — usado pela acção "Inscrever
   *  colaboradores" na tabela de Cursos (docs/modulo_courses.md secção 2). */
  initialCourseId?: number;
}

interface BulkResult {
  success: number;
  skipped: number;
  errors: number;
  total: number;
  details?: { errors: Array<{ userId: number; error: string }> };
}

export function EnrollUserModal({
  onClose,
  initialCourseId,
}: EnrollUserModalProps) {
  const notify = useToast();
  const [courseId, setCourseId] = useState(
    initialCourseId ? String(initialCourseId) : '',
  );
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [deadline, setDeadline] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deptIds, setDeptIds] = useState<string[]>([]);

  const { options: courseOptions } = useCourseOptions();
  const { options: deptOptions } = useDepartmentOptions();
  const { users, loading: usersLoading } = useDirectoryUsers(
    userSearch,
    '',
    !selectedUser && userSearch.trim().length > 0,
  );

  const enroll = useApiMutation(
    (vars: {
      userId: number;
      courseId: number;
      deadline?: string;
      mandatory?: boolean;
    }) => apiClient.post('/enrollments', vars),
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

  // Matrícula em lote: os ids já vêm resolvidos (handleSubmit) para um
  // departamento vazio ser um aviso no modal e não um erro global.
  const enrollWithDepartments = useApiMutation(
    (userIds: number[]) =>
      apiClient.post<BulkResult>('/enrollments/bulk', {
        userIds,
        courseId: Number(courseId),
        ...(deadline ? { deadline } : {}),
        ...(mandatory ? { mandatory: true } : {}),
      }),
    {
      invalidateKeys: [queryKeys.enrollments.lists()],
      onSuccess: (r) => {
        // Nada matriculado por erros (ex.: curso não publicado): fica no modal
        // com o motivo do backend, em vez de fechar com um aviso vazio.
        if (r.success === 0 && r.errors > 0) {
          setSubmitError(
            r.details?.errors[0]?.error ?? 'Não foi possível matricular.',
          );
          return;
        }
        notify({
          title: `${r.success} matriculado${r.success === 1 ? '' : 's'}`,
          description: `${r.skipped} já inscrito${r.skipped === 1 ? '' : 's'} · ${r.errors} erro${r.errors === 1 ? '' : 's'}`,
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e.message || 'Erro ao matricular. Tente novamente.'),
    },
  );
  const [resolving, setResolving] = useState(false);
  const loading =
    enroll.isPending || enrollWithDepartments.isPending || resolving;

  const toggleDept = (id: string) =>
    setDeptIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );

  const canSubmit =
    Boolean(courseId && (selectedUser || deptIds.length > 0)) && !loading;

  // Colaborador individual + membros dos departamentos escolhidos, sem repetidos.
  const submitWithDepartments = async () => {
    setResolving(true);
    try {
      const ids = new Set<number>();
      if (selectedUser) ids.add(selectedUser.id);
      const members = await Promise.all(
        deptIds.map((departmentId) =>
          apiClient.get<DirectoryUser[]>('/users/directory', {
            params: { departmentId },
          }),
        ),
      );
      for (const list of members) {
        for (const u of list ?? []) if (u?.id != null) ids.add(u.id);
      }
      if (ids.size === 0) {
        setSubmitError(
          'Os departamentos escolhidos não têm colaboradores activos.',
        );
        return;
      }
      enrollWithDepartments.mutate([...ids]);
    } catch (e) {
      setSubmitError(
        e instanceof Error && e.message
          ? e.message
          : 'Erro ao obter os colaboradores dos departamentos.',
      );
    } finally {
      setResolving(false);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitError('');
    if (deptIds.length > 0) {
      void submitWithDepartments();
      return;
    }
    if (!selectedUser) return;
    enroll.mutate({
      userId: selectedUser.id,
      courseId: Number(courseId),
      ...(deadline ? { deadline } : {}),
      ...(mandatory ? { mandatory: true } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Matricular colaborador"
        description="Inscreve um colaborador, ou departamentos inteiros, num curso. Ele passa a ver o curso em “As minhas matrículas”."
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
              disabled={!!initialCourseId}
            />
          </FormField>

          <FormField
            label={deptIds.length > 0 ? 'Colaborador' : 'Colaborador *'}
            htmlFor="eu-user"
          >
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

          <FormField label="Departamentos" htmlFor="eu-depts">
            <div
              id="eu-depts"
              className="max-h-40 overflow-y-auto rounded-control border-[1.5px] border-border-strong bg-surface"
            >
              {deptOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-ink-muted">
                  Nenhum departamento encontrado
                </div>
              ) : (
                deptOptions.map((d) => (
                  <label
                    key={d.value}
                    className={`flex items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0 ${
                      d.userCount === 0
                        ? 'cursor-not-allowed text-ink-faint'
                        : 'cursor-pointer text-ink hover:bg-surface-sunken'
                    }`}
                  >
                    <Checkbox
                      checked={deptIds.includes(d.value)}
                      onChange={() => toggleDept(d.value)}
                      disabled={d.userCount === 0}
                    />
                    <span className="flex-1">{d.label}</span>
                    {d.userCount !== undefined && (
                      <span className="text-xs text-ink-faint">
                        {d.userCount === 0
                          ? 'sem colaboradores'
                          : `${d.userCount} colaborador${d.userCount === 1 ? '' : 'es'}`}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
            <p className="mt-1 text-xs text-ink-faint">
              {deptIds.length > 0
                ? `${deptIds.length} departamento${deptIds.length === 1 ? '' : 's'} seleccionado${deptIds.length === 1 ? '' : 's'}: todos os colaboradores activos serão matriculados.`
                : 'Opcional. Pode escolher mais de um departamento.'}
            </p>
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
              <Checkbox
                checked={mandatory}
                onChange={(e) => setMandatory(e.target.checked)}
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
