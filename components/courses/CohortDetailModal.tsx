// components/courses/CohortDetailModal.tsx
// Detalhe da turma (docs/modulo_courses.md secção 5): participantes e
// presenças. Presenças usam o modelo AttendanceRecord já existente
// (context 'LMS', sessionId = cohortId) — ver courses.service.ts
// markCohortAttendance, não um modelo novo (CLAUDE.md: mapear para o
// modelo canónico antes de inventar um).

'use client';

import { useEffect, useState } from 'react';
import { Check, UserMinus, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useDirectoryUsers } from '@/components/enrollments/enrollData';
import { Skeleton } from './shared';
import type { CohortAttendanceEntry, CohortDetail } from './types';

export interface CohortDetailModalProps {
  cohortId: number;
  onClose: () => void;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function CohortDetailModal({ cohortId, onClose }: CohortDetailModalProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [addSearch, setAddSearch] = useState('');
  const [date, setDate] = useState(todayISO());
  const [presence, setPresence] = useState<Record<number, boolean>>({});

  const { data: cohort, isLoading } = useApiQuery<CohortDetail>(
    queryKeys.courses.cohortDetail(cohortId),
    `/courses/cohorts/${cohortId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: existingAttendance = [] } = useApiQuery<CohortAttendanceEntry[]>(
    queryKeys.courses.cohortAttendance(cohortId, date),
    `/courses/cohorts/${cohortId}/attendance`,
    { params: { date }, staleTime: STALE_TIME.DYNAMIC, enabled: !!cohort },
  );

  useEffect(() => {
    if (!cohort) return;
    const marked = new Map(existingAttendance.map((a) => [a.userId, a.status === 'PRESENT']));
    const initial: Record<number, boolean> = {};
    for (const p of cohort.participants) {
      initial[p.userId] = marked.get(p.userId) ?? true;
    }
    setPresence(initial);
  }, [cohort, date, existingAttendance]);

  const { users, loading: usersLoading } = useDirectoryUsers(
    addSearch,
    '',
    addSearch.trim().length > 0,
  );
  const existingIds = new Set((cohort?.participants ?? []).map((p) => p.userId));

  const invalidateKeys = [
    queryKeys.courses.cohortDetail(cohortId),
    queryKeys.courses.cohorts(cohort?.courseId ?? 0),
  ];

  const addParticipant = useApiMutation(
    (userId: number) =>
      apiClient.post(`/courses/cohorts/${cohortId}/participants`, { userIds: [userId] }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Participante adicionado', intent: 'success' });
        setAddSearch('');
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const removeParticipant = useApiMutation(
    (userId: number) => apiClient.delete(`/courses/cohorts/${cohortId}/participants/${userId}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Participante removido', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const markAttendance = useApiMutation(
    (records: Array<{ userId: number; present: boolean }>) =>
      apiClient.post(`/courses/cohorts/${cohortId}/attendance`, { date, records }),
    {
      invalidateKeys: [queryKeys.courses.cohortAttendance(cohortId, date)],
      onSuccess: () => toast({ title: 'Presenças guardadas', intent: 'success' }),
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

  function handleSaveAttendance() {
    const records = Object.entries(presence).map(([userId, present]) => ({
      userId: Number(userId),
      present,
    }));
    if (records.length === 0) return;
    markAttendance.mutate(records);
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
                <div className="text-xs uppercase tracking-wide text-ink-faint">Formador</div>
                {cohort.instructor?.fullName ?? '—'}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">Local</div>
                {[cohort.location, cohort.room].filter(Boolean).join(' · ') || '—'}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">Horário</div>
                {cohort.schedule ?? '—'}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">Vagas</div>
                {cohort.availableSlots}/{cohort.capacity}
              </div>
            </div>

            <section>
              <h3 className="mb-2 text-sm font-medium text-ink">
                Participantes ({cohort.participants.length})
              </h3>
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
                      <div className="px-3 py-2 text-sm text-ink-muted">A pesquisar…</div>
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
                            <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                            <div className="min-w-0 truncate text-sm text-ink">{u.fullName}</div>
                          </button>
                        ))}
                  </div>
                )}
              </div>

              {cohort.participants.length === 0 ? (
                <p className="text-sm text-ink-faint">Ainda sem participantes.</p>
              ) : (
                <div className="divide-y divide-border rounded-card border border-border">
                  {cohort.participants.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                      <Avatar name={p.user.fullName} url={p.user.avatarUrl ?? undefined} size="sm" />
                      <div className="min-w-0 flex-1 truncate text-sm text-ink">
                        {p.user.fullName}
                      </div>
                      <button
                        type="button"
                        aria-label="Remover participante"
                        onClick={() => onRemove(p.userId, p.user.fullName)}
                        className="rounded-control p-1 text-ink-muted hover:bg-danger-subtle hover:text-danger-ink"
                      >
                        <UserMinus size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {cohort.participants.length > 0 && (
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-ink">Marcar presenças</h3>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="divide-y divide-border rounded-card border border-border">
                  {cohort.participants.map((p) => {
                    const present = presence[p.userId] ?? true;
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                        <Avatar name={p.user.fullName} url={p.user.avatarUrl ?? undefined} size="sm" />
                        <div className="min-w-0 flex-1 truncate text-sm text-ink">
                          {p.user.fullName}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPresence((cur) => ({ ...cur, [p.userId]: !present }))
                          }
                          className={`flex items-center gap-1 rounded-control px-2 py-1 text-xs font-medium ${
                            present
                              ? 'bg-success-subtle text-success-ink'
                              : 'bg-danger-subtle text-danger-ink'
                          }`}
                        >
                          {present ? <Check size={12} strokeWidth={2} /> : <X size={12} strokeWidth={2} />}
                          {present ? 'Presente' : 'Falta'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveAttendance}
                    loading={markAttendance.isPending}
                  >
                    Guardar presenças
                  </Button>
                </div>
              </section>
            )}
          </div>
        )}

        <div className="mt-6 flex border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
