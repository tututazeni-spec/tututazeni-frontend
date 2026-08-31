// components/enrollments/BulkEnrollModal.tsx
// Modal "Em massa" da aba Gestão (Admin): matricula vários colaboradores num
// curso de uma vez. Filtro por departamento + pesquisa livre alimentam a
// mesma lista (GET /users/directory); os seleccionados ficam num Map para
// sobreviverem a mudanças de filtro. Submete em POST /enrollments/bulk, que
// devolve um relatório { success, skipped, errors, details }.

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useCourseOptions,
  useDepartmentOptions,
  useDirectoryUsers,
  type DirectoryUser,
} from './enrollData';

export interface BulkEnrollModalProps {
  onClose: () => void;
}

// Radix Select rejeita value="" — sentinela para "sem filtro".
const ALL_DEPTS = '__all__';

interface BulkResult {
  success: number;
  skipped: number;
  errors: number;
  total: number;
  details: {
    enrolled: number[];
    errors: Array<{ userId: number; error: string }>;
  };
}

export function BulkEnrollModal({ onClose }: BulkEnrollModalProps) {
  const [courseId, setCourseId] = useState('');
  const [deptFilter, setDeptFilter] = useState(ALL_DEPTS);
  const [userSearch, setUserSearch] = useState('');
  const [selected, setSelected] = useState<Map<number, DirectoryUser>>(
    new Map(),
  );
  const [deadline, setDeadline] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<BulkResult | null>(null);

  const { options: courseOptions } = useCourseOptions();
  const { options: deptOptions } = useDepartmentOptions();
  const { users, loading: usersLoading } = useDirectoryUsers(
    userSearch,
    deptFilter === ALL_DEPTS ? '' : deptFilter,
    !result,
  );

  const selectedIds = useMemo(() => [...selected.keys()], [selected]);

  const toggle = (u: DirectoryUser) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(u.id)) next.delete(u.id);
      else next.set(u.id, u);
      return next;
    });

  const bulkEnroll = useApiMutation(
    () =>
      apiClient.post<BulkResult>('/enrollments/bulk', {
        userIds: selectedIds,
        courseId: Number(courseId),
        ...(deadline ? { deadline } : {}),
        ...(mandatory ? { mandatory: true } : {}),
      }),
    {
      invalidateKeys: [queryKeys.enrollments.lists()],
      onSuccess: (data) => setResult(data),
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao matricular em massa. Tente novamente.',
        ),
    },
  );
  const loading = bulkEnroll.isPending;

  const canSubmit =
    Boolean(courseId) && selected.size > 0 && !loading && !result;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitError('');
    bulkEnroll.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Matrículas em massa"
        description="Escolhe um curso e os colaboradores a inscrever. Quem já estiver inscrito é ignorado."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {result ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-card border border-border bg-surface-sunken p-4 text-sm">
              <p className="font-medium text-success-ink">
                {result.success} matriculado{result.success === 1 ? '' : 's'}
              </p>
              <p className="text-ink-muted">
                {result.skipped} já inscrito{result.skipped === 1 ? '' : 's'} ·{' '}
                {result.errors} erro{result.errors === 1 ? '' : 's'} ·{' '}
                {result.total} no total
              </p>
            </div>
            {result.details.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-card border border-danger-subtle bg-danger-subtle p-3 text-xs text-danger-ink">
                {result.details.errors.map((err) => (
                  <div key={err.userId}>
                    ID {err.userId}: {err.error}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end border-t border-border pt-4">
              <Button onClick={onClose}>Fechar</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
                  <AlertCircle size={16} strokeWidth={1.75} />
                  {submitError}
                </div>
              )}

              <FormField label="Curso *" htmlFor="be-course">
                <Combobox
                  items={courseOptions}
                  value={courseId || undefined}
                  onValueChange={setCourseId}
                  placeholder="Selecionar curso"
                  searchPlaceholder="Escreva para filtrar cursos…"
                  emptyText="Nenhum curso encontrado"
                />
              </FormField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Departamento" htmlFor="be-dept">
                  <Select
                    items={[
                      { value: ALL_DEPTS, label: 'Todos os departamentos' },
                      ...deptOptions,
                    ]}
                    value={deptFilter}
                    onValueChange={setDeptFilter}
                    placeholder="Todos os departamentos"
                    className="w-full"
                  />
                </FormField>
                <FormField label="Pesquisar" htmlFor="be-search">
                  <Input
                    id="be-search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full"
                    placeholder="Nome ou email…"
                    autoComplete="off"
                  />
                </FormField>
              </div>

              {selected.size > 0 && (
                <div className="rounded-card border border-border bg-info-subtle px-3 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-info-ink">
                      {selected.size} seleccionado
                      {selected.size === 1 ? '' : 's'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelected(new Map())}
                      className="text-xs text-info-ink hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
                    {[...selected.values()].map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-ink"
                      >
                        {u.fullName}
                        <button
                          type="button"
                          aria-label={`Remover ${u.fullName}`}
                          onClick={() => toggle(u)}
                          className="text-ink-muted hover:text-ink"
                        >
                          <X size={12} strokeWidth={2} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto rounded-card border border-border">
                {usersLoading ? (
                  <div className="p-3">
                    <Skeleton
                      rows={4}
                      wrapperClassName="space-y-2 animate-pulse"
                      itemClassName="h-10 rounded-card bg-surface-sunken"
                    />
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-ink-faint">
                    Nenhum colaborador encontrado
                  </div>
                ) : (
                  users.map((u) => (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-0 hover:bg-surface-sunken"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggle(u)}
                        className="h-4 w-4 rounded border-border-strong accent-primary"
                      />
                      <Avatar
                        name={u.fullName}
                        url={u.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-ink">
                          {u.fullName}
                        </div>
                        <div className="truncate text-xs text-ink-faint">
                          {u.department?.name ?? u.email ?? '—'}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Prazo (opcional)" htmlFor="be-deadline">
                  <Input
                    id="be-deadline"
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
                {loading
                  ? 'A matricular…'
                  : `Matricular ${selected.size || ''}`.trim()}
              </Button>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
