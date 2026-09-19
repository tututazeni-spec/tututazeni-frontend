// components/live-classes/ParticipantsView.tsx
// Separador "Participantes" (docs/aulas-ao-vivo.md secção 6) — tabela global
// de inscrições/presenças de todas as aulas, com departamento/unidade/curso.
// Mesma fonte de dados (LiveAttendance) que AttendanceView.tsx (secção 10),
// vista com ênfase diferente (roster de participantes vs. auditoria de
// presença) — ver comentário em live-classes.service.ts#listParticipants.

'use client';

import { useState } from 'react';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { LIVE_ATTENDANCE_STATUS_CFG } from './constants';
import type { LiveAttendanceStatus, LiveParticipant, PaginatedMeta } from './types';

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...(Object.keys(LIVE_ATTENDANCE_STATUS_CFG) as LiveAttendanceStatus[]).map((s) => ({
    value: s,
    label: LIVE_ATTENDANCE_STATUS_CFG[s].label,
  })),
];

function useLiveClassOptions() {
  const params = { limit: 100 };
  const query = useApiQuery<{ data: { id: number; topic: string }[] }>(
    queryKeys.liveClasses.list({ picker: 'participants', ...params }),
    '/live-classes',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return (query.data?.data ?? []).map((c) => ({ value: String(c.id), label: c.topic }));
}

function useUserOptions(enabled: boolean) {
  const params = { limit: 200 };
  const query = useApiQuery<{ data: { id: number; fullName: string }[] }>(
    ['live-classes', 'users-picker'],
    '/users',
    { params, enabled, staleTime: STALE_TIME.SEMI_STATIC },
  );
  return (query.data?.data ?? []).map((u) => ({ value: String(u.id), label: u.fullName }));
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
  const [addForm, setAddForm] = useState<AddForm>({ liveClassId: '', userId: '' });
  const [registering, setRegistering] = useState<LiveParticipant | null>(null);
  const [registerForm, setRegisterForm] = useState({ joinedAt: '', leftAt: '' });
  const [justifying, setJustifying] = useState<LiveParticipant | null>(null);
  const [justification, setJustification] = useState('');

  const userOptions = useUserOptions(showAdd);

  const params: Record<string, string | number | undefined> = { page, limit: 20 };
  if (liveClassId !== 'ALL') params.liveClassId = Number(liveClassId);
  if (status !== 'ALL') params.status = status;
  if (search) params.search = search;

  const { data, isLoading } = useApiQuery<PaginatedMeta<LiveParticipant>>(
    queryKeys.liveClasses.participants(params),
    '/live-classes/participants',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  const invalidateKeys = [queryKeys.liveClasses.all];

  const add = useApiMutation(
    () => apiClient.post(`/live-classes/${addForm.liveClassId}/attendance`, { userId: Number(addForm.userId) }),
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
    (p: LiveParticipant) => apiClient.delete(`/live-classes/${p.liveClassId}/attendance/${p.id}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Participante removido.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const register = useApiMutation(
    () =>
      apiClient.put(`/live-classes/${registering!.liveClassId}/attendance/${registering!.id}`, {
        joinedAt: registerForm.joinedAt ? new Date(registerForm.joinedAt).toISOString() : undefined,
        leftAt: registerForm.leftAt ? new Date(registerForm.leftAt).toISOString() : undefined,
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
    () =>
      apiClient.put(`/live-classes/${justifying!.liveClassId}/attendance/${justifying!.id}`, {
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
            items={[{ value: 'ALL', label: 'Todas as aulas' }, ...liveClassOptions]}
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
            className="w-52"
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
          <Card className="divide-y divide-border">
            {rows.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={p.user.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {p.user.fullName}
                    {p.user.employeeNumber ? ` · Nº ${p.user.employeeNumber}` : ''}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-body text-xs text-ink-faint">
                    <span>{p.user.department?.name ?? '—'}</span>
                    {p.user.unit && <span>· {p.user.unit.name}</span>}
                    <span>· {p.liveClass.course?.title ?? '—'}</span>
                    <span>· {p.liveClass.topic}</span>
                    {p.session && <span>· Sessão {p.session.seq}</span>}
                    {p.durationMinutes != null && <span>· {p.durationMinutes}min</span>}
                    {p.liveClass.postEvaluation && <span>· {p.liveClass.postEvaluation.averageScore.toFixed(1)}/5</span>}
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${LIVE_ATTENDANCE_STATUS_CFG[p.computedStatus]?.cls ?? ''}`}>
                  {LIVE_ATTENDANCE_STATUS_CFG[p.computedStatus]?.label ?? p.computedStatus}
                </span>
                {canManage && (
                  <div className="flex gap-2">
                    <Button intent="ghost" size="sm" onClick={() => openRegister(p)}>
                      <UserCheck size={14} strokeWidth={1.75} />
                      Registar presença
                    </Button>
                    <Button intent="ghost" size="sm" onClick={() => { setJustifying(p); setJustification(p.justification ?? ''); }}>
                      Justificar
                    </Button>
                    <Button
                      intent="danger"
                      size="sm"
                      onClick={() => onRemove(p)}
                      loading={remove.isPending && remove.variables?.id === p.id}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button intent="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <span className="py-2 px-3 text-sm text-ink-muted">
                {page} / {totalPages}
              </span>
              <Button intent="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
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
                  onValueChange={(v) => setAddForm((f) => ({ ...f, liveClassId: v }))}
                  placeholder="Selecionar aula…"
                  searchPlaceholder="Escreva para filtrar…"
                />
              </FormField>
              <FormField label="Colaborador *" htmlFor="pv-user">
                <Combobox
                  items={userOptions}
                  value={addForm.userId}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, userId: v }))}
                  placeholder="Selecionar colaborador…"
                  searchPlaceholder="Escreva para filtrar…"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setShowAdd(false)}>
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
          <ModalContent title={`Registar presença — ${registering.user.fullName}`}>
            <div className="mt-4 space-y-4">
              <FormField label="Entrada" htmlFor="pv-joinedAt">
                <Input
                  id="pv-joinedAt"
                  type="datetime-local"
                  value={registerForm.joinedAt}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, joinedAt: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Saída" htmlFor="pv-leftAt">
                <Input
                  id="pv-leftAt"
                  type="datetime-local"
                  value={registerForm.leftAt}
                  onChange={(e) => setRegisterForm((f) => ({ ...f, leftAt: e.target.value }))}
                  className="w-full"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setRegistering(null)}>
                Cancelar
              </Button>
              <Button className="flex-1 justify-center" onClick={() => register.mutate(undefined)} loading={register.isPending}>
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {justifying && (
        <Modal open onOpenChange={(open) => !open && setJustifying(null)}>
          <ModalContent title={`Justificar ausência — ${justifying.user.fullName}`}>
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
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setJustifying(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => justify.mutate(undefined)}
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
