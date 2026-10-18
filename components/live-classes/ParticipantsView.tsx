// components/live-classes/ParticipantsView.tsx
// Separador "Participantes" (docs/aulas-ao-vivo.md secção 6) — tabela global
// de inscrições/presenças de todas as aulas, com departamento/unidade/curso.
// Mesma fonte de dados (LiveAttendance) que AttendanceView.tsx (secção 10),
// vista com ênfase diferente (roster de participantes vs. auditoria de
// presença) — ver comentário em live-classes.service.ts#listParticipants.

'use client';

import { useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Clock,
  Plus,
  Star,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import {
  NAVY_BTN,
  NavyBadge,
  NavyCard,
  type NavyTone,
} from '@/components/courses/NavyCard';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { LIVE_ATTENDANCE_STATUS_CFG } from './constants';
import type {
  LiveAttendanceStatus,
  LiveParticipant,
  PaginatedMeta,
} from './types';

const ATTENDANCE_TONE: Record<string, NavyTone> = {
  PRESENTE: 'success',
  AUSENTE: 'danger',
  ATRASADO: 'warning',
  PARCIAL: 'warning',
  JUSTIFICADO: 'info',
};

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...(Object.keys(LIVE_ATTENDANCE_STATUS_CFG) as LiveAttendanceStatus[]).map(
    (s) => ({
      value: s,
      label: LIVE_ATTENDANCE_STATUS_CFG[s].label,
    }),
  ),
];

function useLiveClassOptions() {
  const params = { limit: 100 };
  const query = useApiQuery<{ data: { id: number; topic: string }[] }>(
    queryKeys.liveClasses.list({ picker: 'participants', ...params }),
    '/live-classes',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.topic,
  }));
}

function useUserOptions(enabled: boolean) {
  const params = { limit: 200 };
  const query = useApiQuery<{ data: { id: number; fullName: string }[] }>(
    ['live-classes', 'users-picker'],
    '/users',
    { params, enabled, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return (query.data?.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.fullName,
  }));
}

interface AddForm {
  liveClassId: string;
  userId: string;
}

export function ParticipantsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const liveClassOptions = useLiveClassOptions();

  const [liveClassId, setLiveClassId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({
    liveClassId: '',
    userId: '',
  });
  const [registering, setRegistering] = useState<LiveParticipant | null>(null);
  const [registerForm, setRegisterForm] = useState({
    joinedAt: '',
    leftAt: '',
  });
  const [justifying, setJustifying] = useState<LiveParticipant | null>(null);
  const [justification, setJustification] = useState('');

  const userOptions = useUserOptions(showAdd);

  const params: Record<string, string | number | undefined> = {
    page,
    limit: 20,
  };
  if (liveClassId !== 'ALL') params.liveClassId = Number(liveClassId);
  if (status !== 'ALL') params.status = status;
  if (search) params.search = search;

  const { data, isLoading } = useApiQuery<PaginatedMeta<LiveParticipant>>(
    queryKeys.liveClasses.participants(params),
    '/live-classes/participants',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  const invalidateKeys = [queryKeys.liveClasses.all];

  const add = useApiMutation(
    () =>
      apiClient.post(`/live-classes/${addForm.liveClassId}/attendance`, {
        userId: Number(addForm.userId),
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Participante adicionado.', intent: 'success' });
        setShowAdd(false);
        setAddForm({ liveClassId: '', userId: '' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation(
    (p: LiveParticipant) =>
      apiClient.delete(`/live-classes/${p.liveClassId}/attendance/${p.id}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Participante removido.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const register = useApiMutation(
    (p: LiveParticipant) =>
      apiClient.put(`/live-classes/${p.liveClassId}/attendance/${p.id}`, {
        joinedAt: registerForm.joinedAt
          ? new Date(registerForm.joinedAt).toISOString()
          : undefined,
        leftAt: registerForm.leftAt
          ? new Date(registerForm.leftAt).toISOString()
          : undefined,
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Presença registada.', intent: 'success' });
        setRegistering(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const justify = useApiMutation(
    (p: LiveParticipant) =>
      apiClient.put(`/live-classes/${p.liveClassId}/attendance/${p.id}`, {
        status: 'JUSTIFICADO',
        justification,
      }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Ausência justificada.', intent: 'success' });
        setJustifying(null);
        setJustification('');
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onRemove(p: LiveParticipant) {
    const ok = await confirm({
      title: `Remover ${p.user.fullName} desta aula?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) remove.mutate(p);
  }

  function openRegister(p: LiveParticipant) {
    setRegisterForm({
      joinedAt: p.joinedAt ? p.joinedAt.slice(0, 16) : '',
      leftAt: p.leftAt ? p.leftAt.slice(0, 16) : '',
    });
    setRegistering(p);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Combobox
            items={[
              { value: 'ALL', label: 'Todas as aulas' },
              ...liveClassOptions,
            ]}
            value={liveClassId}
            onValueChange={(v) => {
              setLiveClassId(v);
              setPage(1);
            }}
            className="w-56"
          />
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            className="w-48"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Colaborador ou nº…"
            className="w-64"
          />
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Adicionar
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sem participantes"
          description="Os participantes aparecem aqui depois de se inscreverem ou entrarem numa aula."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => (
              <NavyCard
                key={p.id}
                seed={p.liveClassId}
                avatar={{ name: p.user.fullName }}
                title={p.liveClass.topic}
                subtitle={
                  [
                    p.user.employeeNumber && `Nº ${p.user.employeeNumber}`,
                    p.user.department?.name,
                    p.user.unit?.name,
                  ]
                    .filter(Boolean)
                    .join(' · ') || undefined
                }
                badge={
                  <NavyBadge
                    tone={ATTENDANCE_TONE[p.computedStatus] ?? 'neutral'}
                  >
                    {LIVE_ATTENDANCE_STATUS_CFG[p.computedStatus]?.label ??
                      p.computedStatus}
                  </NavyBadge>
                }
                infos={[
                  {
                    icon: BookOpen,
                    value: p.liveClass.course?.title ?? '—',
                    label: 'Curso',
                  },
                  {
                    icon: CalendarDays,
                    value: p.session ? `Sessão ${p.session.seq}` : '—',
                    label: 'Sessão',
                  },
                  {
                    icon: Clock,
                    value:
                      p.durationMinutes != null
                        ? `${p.durationMinutes}min`
                        : '—',
                    label: 'Duração',
                  },
                  {
                    icon: Star,
                    value: p.liveClass.postEvaluation
                      ? `${p.liveClass.postEvaluation.averageScore.toFixed(1)}/5`
                      : '—',
                    label: 'Avaliação',
                  },
                ]}
                footer={
                  canManage && (
                    <>
                      <button
                        type="button"
                        className={NAVY_BTN}
                        onClick={() => openRegister(p)}
                      >
                        <UserCheck
                          size={14}
                          strokeWidth={1.75}
                          className="mr-1.5"
                        />
                        Registar presença
                      </button>
                      <button
                        type="button"
                        className={NAVY_BTN}
                        onClick={() => {
                          setJustifying(p);
                          setJustification(p.justification ?? '');
                        }}
                      >
                        Justificar
                      </button>
                      <button
                        type="button"
                        className={NAVY_BTN}
                        aria-label="Remover participante"
                        title="Remover participante"
                        disabled={
                          remove.isPending && remove.variables?.id === p.id
                        }
                        onClick={() => onRemove(p)}
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </>
                  )
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                intent="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Anterior
              </Button>
              <span className="py-2 px-3 text-sm text-ink-muted">
                {page} / {totalPages}
              </span>
              <Button
                intent="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte →
              </Button>
            </div>
          )}
        </>
      )}

      {showAdd && (
        <Modal open onOpenChange={(open) => !open && setShowAdd(false)}>
          <ModalContent title="Adicionar participante">
            <div className="mt-4 space-y-4">
              <FormField label="Aula *" htmlFor="pv-liveclass">
                <Combobox
                  items={liveClassOptions}
                  value={addForm.liveClassId}
                  onValueChange={(v) =>
                    setAddForm((f) => ({ ...f, liveClassId: v }))
                  }
                  placeholder="Selecionar aula…"
                  searchPlaceholder="Escreva para filtrar…"
                />
              </FormField>
              <FormField label="Colaborador *" htmlFor="pv-user">
                <Combobox
                  items={userOptions}
                  value={addForm.userId}
                  onValueChange={(v) =>
                    setAddForm((f) => ({ ...f, userId: v }))
                  }
                  placeholder="Selecionar colaborador…"
                  searchPlaceholder="Escreva para filtrar…"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button
                intent="secondary"
                className="flex-1 justify-center"
                onClick={() => setShowAdd(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => add.mutate(undefined)}
                loading={add.isPending}
                disabled={!addForm.liveClassId || !addForm.userId}
              >
                Adicionar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {registering && (
        <Modal open onOpenChange={(open) => !open && setRegistering(null)}>
          <ModalContent
            title={`Registar presença — ${registering.user.fullName}`}
          >
            <div className="mt-4 space-y-4">
              <FormField label="Entrada" htmlFor="pv-joinedAt">
                <Input
                  id="pv-joinedAt"
                  type="datetime-local"
                  value={registerForm.joinedAt}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, joinedAt: e.target.value }))
                  }
                  className="w-full"
                />
              </FormField>
              <FormField label="Saída" htmlFor="pv-leftAt">
                <Input
                  id="pv-leftAt"
                  type="datetime-local"
                  value={registerForm.leftAt}
                  onChange={(e) =>
                    setRegisterForm((f) => ({ ...f, leftAt: e.target.value }))
                  }
                  className="w-full"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button
                intent="secondary"
                className="flex-1 justify-center"
                onClick={() => setRegistering(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => register.mutate(registering)}
                loading={register.isPending}
              >
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {justifying && (
        <Modal open onOpenChange={(open) => !open && setJustifying(null)}>
          <ModalContent
            title={`Justificar ausência — ${justifying.user.fullName}`}
          >
            <div className="mt-4">
              <FormField label="Justificação" htmlFor="pv-justification">
                <Textarea
                  id="pv-justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                  className="w-full resize-none"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button
                intent="secondary"
                className="flex-1 justify-center"
                onClick={() => setJustifying(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => justify.mutate(justifying)}
                loading={justify.isPending}
                disabled={!justification.trim()}
              >
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
