// components/courses/CohortDetailModal.tsx
// Detalhe da turma (docs/modulo_courses.md secção 5) em cinco separadores:
// Visão geral, Participantes, Sessões, Presenças e Relatórios
// (docs/innova-gestao-presencas-claude-code.md). As presenças são por sessão
// e participante (CourseCohortSession / CourseCohortAttendance).

'use client';

import { useCallback, useState } from 'react';
import {
  CalendarDays,
  Check,
  Pencil,
  UserMinus,
  Users2,
  X,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useDirectoryUsers } from '@/components/enrollments/enrollData';
import { CohortDepartmentPicker } from './CohortDepartmentPicker';
import { CohortAttendanceEditor } from './CohortAttendanceEditor';
import { CohortAttendanceReportView } from './CohortAttendanceReportView';
import { CohortSessionsPanel } from './CohortSessionsPanel';
import { CohortInfoEditor } from './CohortInfoEditor';
import { Skeleton } from './shared';
import type { CohortDetail, CohortSession } from './types';

/** Foto do painel esquerdo (mesma do cartão de turma aberta). */
const COHORT_PHOTO = '/images/turma-aberta-foto.jpg';

const TAB_TRIGGER =
  'px-4 py-3 text-base data-[state=active]:border-brand data-[state=active]:font-bold data-[state=active]:text-brand';
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
  const [tab, setTab] = useState('overview');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [attendanceDirty, setAttendanceDirty] = useState(false);
  const { data: me } = useCurrentUser();
  const { data: sessions } = useApiQuery<CohortSession[]>(
    queryKeys.courses.cohortSessions(cohortId),
    `/courses/cohorts/${cohortId}/sessions`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const onDirtyChange = useCallback((d: boolean) => setAttendanceDirty(d), []);
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

  const roleName = me?.role?.name ?? '';
  const isPrivileged = roleName === 'ADMIN' || roleName === 'RH';
  const canManage =
    isPrivileged || (!!me && !!cohort && cohort.instructorId === me.id);

  async function guard(): Promise<boolean> {
    if (!attendanceDirty) return true;
    const ok = await confirm({
      title: 'Descartar presenças por guardar?',
      message: 'Há marcações de presenças que ainda não foram guardadas.',
      confirmLabel: 'Descartar',
      destructive: true,
    });
    if (ok) setAttendanceDirty(false);
    return ok;
  }

  async function changeTab(next: string) {
    if (next !== tab && tab === 'attendance' && !(await guard())) return;
    setTab(next);
  }

  async function requestClose() {
    if (await guard()) onClose();
  }

  return (
    <Modal open onOpenChange={(open) => !open && void requestClose()}>
      <ModalContent
        title={cohort?.name ?? 'Turma'}
        description={cohort?.course.title}
        hideHeading
        navyClose
        className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden p-0"
      >
        {/* Banner azul: ícone, nome da turma e curso (desenho "turmas") */}
        <div className="flex items-center gap-4 bg-gradient-to-br from-brand via-brand-mid to-brand-dark px-6 py-5 pr-14 text-white">
          <Users2 aria-hidden size={40} strokeWidth={1.5} />
          <div className="min-w-0">
            <div className="truncate font-display text-xl font-bold">
              {cohort?.name ?? 'Turma'}
            </div>
            {cohort?.course.title && (
              <div className="truncate text-sm text-white/80">
                {cohort.course.title}
              </div>
            )}
          </div>
        </div>

        {isLoading || !cohort ? (
          <div className="p-6">
            <Skeleton rows={4} />
          </div>
        ) : (
          <Tabs
            value={tab}
            onValueChange={(v) => void changeTab(v)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="overflow-x-auto bg-surface px-4">
              <TabsTrigger value="overview" className={TAB_TRIGGER}>
                <CalendarDays
                  aria-hidden
                  size={20}
                  strokeWidth={1.5}
                  className="mr-2 inline"
                />
                Visão geral
              </TabsTrigger>
              <TabsTrigger value="participants" className={TAB_TRIGGER}>
                Participantes ({cohort.participants.length})
              </TabsTrigger>
              <TabsTrigger value="sessions" className={TAB_TRIGGER}>
                Sessões
              </TabsTrigger>
              <TabsTrigger value="attendance" className={TAB_TRIGGER}>
                Presenças
              </TabsTrigger>
              <TabsTrigger value="report" className={TAB_TRIGGER}>
                Relatórios
              </TabsTrigger>
            </TabsList>

            <div className="flex min-h-0 flex-1 gap-6 overflow-y-auto p-4">
              {/* Foto à esquerda com a margem curva e fio azul */}
              <div
                aria-hidden
                className="hidden w-[30%] shrink-0 self-stretch overflow-hidden rounded-r-[50%] border-r-[6px] border-brand md:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={COHORT_PHOTO}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full min-h-[16rem] w-full object-cover object-top"
                />
              </div>
              <div className="min-w-0 flex-1">
                <TabsContent value="overview" className="space-y-6">
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
                      {[cohort.location, cohort.room]
                        .filter(Boolean)
                        .join(' · ') || '—'}
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

                  <p className="text-sm text-ink-muted">
                    Assiduidade mínima: {cohort.minAttendancePercent}%
                    (configurável no separador Relatórios).
                  </p>
                </TabsContent>

                <TabsContent value="participants">
                  <section>
                    <h3 className="mb-2 text-sm font-medium text-ink">
                      Participantes ({cohort.participants.length})
                    </h3>
                    <div className="mb-3">
                      <CohortDepartmentPicker
                        onAdd={async (ids) => {
                          await addDepartment
                            .mutateAsync(ids)
                            .catch(() => undefined);
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
                              onClick={() =>
                                onRemove(p.userId, p.user.fullName)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </TabsContent>

                <TabsContent value="sessions">
                  <CohortSessionsPanel
                    cohortId={cohortId}
                    startDate={cohort.startDate}
                    endDate={cohort.endDate}
                    canManage={canManage}
                    onOpenAttendance={(id) => {
                      setSessionId(id);
                      setTab('attendance');
                    }}
                  />
                </TabsContent>

                <TabsContent value="attendance">
                  <CohortAttendanceEditor
                    cohortId={cohortId}
                    sessions={sessions ?? []}
                    sessionId={sessionId}
                    onSessionChange={setSessionId}
                    isPrivileged={isPrivileged}
                    onDirtyChange={onDirtyChange}
                  />
                </TabsContent>

                <TabsContent value="report">
                  {canManage ? (
                    <CohortAttendanceReportView
                      cohortId={cohortId}
                      isPrivileged={isPrivileged}
                    />
                  ) : (
                    <p className="text-sm text-ink-muted">
                      Sem permissão para ver o relatório desta turma.
                    </p>
                  )}
                </TabsContent>
              </div>
            </div>
          </Tabs>
        )}

        <div className="px-4 pb-4">
          <Button
            className="w-full justify-center"
            onClick={() => void requestClose()}
          >
            <CalendarDays size={16} strokeWidth={1.75} className="mr-2" />
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
