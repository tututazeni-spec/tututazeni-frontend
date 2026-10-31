// components/courses/CohortDetailModal.tsx
// Detalhe da turma (docs/modulo_courses.md secção 5): participantes e
// presenças. Presenças usam o modelo AttendanceRecord já existente
// (context 'LMS', sessionId = cohortId) — ver courses.service.ts
// markCohortAttendance, não um modelo novo (CLAUDE.md: mapear para o
// modelo canónico antes de inventar um).

'use client';

import { useState } from 'react';
import { Check, Pencil, UserMinus, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useDirectoryUsers } from '@/components/enrollments/enrollData';
import { CohortDepartmentPicker } from './CohortDepartmentPicker';
import { CohortAttendancePanel } from './CohortAttendancePanel';
import { CohortInfoEditor } from './CohortInfoEditor';
import { Skeleton } from './shared';
import type { CohortDetail } from './types';
import { formatDateNumeric } from '@/lib/format';

export interface CohortDetailModalProps {
  cohortId: number;
  onClose: () => void;
}

export function CohortDetailModal({
  cohortId,
  onClose,
}: CohortDetailModalProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [addSearch, setAddSearch] = useState('');
  const [editingInfo, setEditingInfo] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [capacityDraft, setCapacityDraft] = useState('');
  const { data: cohort, isLoading } = useApiQuery<CohortDetail>(
    queryKeys.courses.cohortDetail(cohortId),
    `/courses/cohorts/${cohortId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const { users, loading: usersLoading } = useDirectoryUsers(
    addSearch,
    '',
    addSearch.trim().length > 0,
  );
  const existingIds = new Set(
    (cohort?.participants ?? []).map((p) => p.userId),
  );

  const invalidateKeys = [
    queryKeys.courses.cohortDetail(cohortId),
    queryKeys.courses.cohorts(cohort?.courseId ?? 0),
  ];

  const addParticipant = useApiMutation(
    (userId: number) =>
      apiClient.post(`/courses/cohorts/${cohortId}/participants`, {
        userIds: [userId],
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Participante adicionado', intent: 'success' });
        setAddSearch('');
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const addDepartment = useApiMutation(
    (departmentIds: number[]) =>
      apiClient.post<{ added: number; alreadyIn: number }>(
        `/courses/cohorts/${cohortId}/participants`,
        { departmentIds },
      ),
    {
      invalidateKeys,
      onSuccess: (r) =>
        toast({
          title: `${r.added} adicionado(s), ${r.alreadyIn} já estavam na turma`,
          intent: 'success',
        }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const updateCapacity = useApiMutation(
    (capacity: number) =>
      apiClient.patch(`/courses/cohorts/${cohortId}`, { capacity }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Vagas actualizadas', intent: 'success' });
        setEditingCapacity(false);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  function saveCapacity() {
    const n = Number(capacityDraft);
    if (!Number.isInteger(n) || n < 1) {
      toast({ title: 'Indica um número de vagas válido', intent: 'danger' });
      return;
    }
    updateCapacity.mutate(n);
  }

  const removeParticipant = useApiMutation(
    (userId: number) =>
      apiClient.delete(`/courses/cohorts/${cohortId}/participants/${userId}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Participante removido', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onRemove(userId: number, name: string) {
    const ok = await confirm({
      title: `Remover "${name}" da turma?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) removeParticipant.mutate(userId);
  }

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={cohort?.name ?? 'Turma'}
        description={cohort?.course.title}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {isLoading || !cohort ? (
          <Skeleton rows={4} />
        ) : (
          <div className="mt-5 space-y-6">
            <div className="grid grid-cols-2 gap-3 text-sm text-ink-muted sm:grid-cols-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">
                  Formador
                </div>
                {cohort.instructor?.fullName ?? '—'}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">
                  Local
                </div>
                {[cohort.location, cohort.room].filter(Boolean).join(' · ') ||
                  '—'}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">
                  Horário
                </div>
                {cohort.schedule ?? '—'}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">
                  Vagas
                </div>
                {editingCapacity ? (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={Math.max(1, cohort.participants.length)}
                      value={capacityDraft}
                      onChange={(e) => setCapacityDraft(e.target.value)}
                      className="w-20"
                      aria-label="Capacidade da turma"
                      autoFocus
                    />
                    <IconButton
                      icon={Check}
                      label="Guardar vagas"
                      intent="ghost"
                      size="compact"
                      type="button"
                      onClick={saveCapacity}
                      disabled={updateCapacity.isPending}
                    />
                    <IconButton
                      icon={X}
                      label="Cancelar"
                      intent="ghost"
                      size="compact"
                      type="button"
                      onClick={() => setEditingCapacity(false)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {cohort.availableSlots}/{cohort.capacity}
                    <IconButton
                      icon={Pencil}
                      label="Editar vagas"
                      intent="ghost"
                      size="xs"
                      type="button"
                      onClick={() => {
                        setCapacityDraft(String(cohort.capacity));
                        setEditingCapacity(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {editingInfo ? (
              <CohortInfoEditor
                cohort={cohort}
                invalidateKeys={invalidateKeys}
                onDone={() => setEditingInfo(false)}
              />
            ) : (
              <div className="-mt-3 flex items-center justify-between text-sm text-ink-muted">
                <span>
                  {formatDateNumeric(cohort.startDate)}
                  {cohort.endDate
                    ? ` → ${formatDateNumeric(cohort.endDate)}`
                    : ''}
                </span>
                <Button
                  size="sm"
                  intent="secondary"
                  onClick={() => setEditingInfo(true)}
                >
                  <Pencil size={14} strokeWidth={1.75} className="mr-1" />
                  Editar dados da turma
                </Button>
              </div>
            )}

            <section>
              <h3 className="mb-2 text-sm font-medium text-ink">
                Participantes ({cohort.participants.length})
              </h3>
              <div className="mb-3">
                <CohortDepartmentPicker
                  onAdd={async (ids) => {
                    await addDepartment.mutateAsync(ids).catch(() => undefined);
                  }}
                  loading={addDepartment.isPending}
                />
              </div>
              <div className="relative mb-3">
                <Input
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Pesquisar colaborador para adicionar…"
                  className="w-full"
                  autoComplete="off"
                />
                {addSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {usersLoading && (
                      <div className="px-3 py-2 text-sm text-ink-muted">
                        A pesquisar…
                      </div>
                    )}
                    {!usersLoading &&
                      users
                        .filter((u) => !existingIds.has(u.id))
                        .map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => addParticipant.mutate(u.id)}
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

              {cohort.participants.length === 0 ? (
                <p className="text-sm text-ink-faint">
                  Ainda sem participantes.
                </p>
              ) : (
                <div className="divide-y divide-border rounded-card border border-border">
                  {cohort.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Avatar
                        name={p.user.fullName}
                        url={p.user.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1 truncate text-sm text-ink">
                        {p.user.fullName}
                      </div>
                      <IconButton
                        icon={UserMinus}
                        label="Remover participante"
                        intent="ghostDanger"
                        size="compact"
                        type="button"
                        onClick={() => onRemove(p.userId, p.user.fullName)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <CohortAttendancePanel cohortId={cohortId} />
          </div>
        )}

        <div className="mt-6 flex border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
