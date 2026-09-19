// components/trainings/manage/ParticipantsTab.tsx
// Participantes de uma formação: inscrições, aprovações, lista de espera,
// presenças e estado de participação — por sessão (as inscrições vivem em
// TrainingSession, não directamente na formação). docs/trainings-detalhado.md
// pt.6 — inclui também "adicionar participante", "inscrever em massa",
// "transferir de turma" e "exportar participantes".

'use client';

import { useState } from 'react';
import { Download, Plus, Users as UsersIcon } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { buttonVariants, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PARTICIPANT_CFG } from '../constants';
import { fmtDate } from '../utils';
import type { Participant, Training } from '../types';

interface ParticipantsTabProps {
  training: Training;
}

interface UserOption {
  id: number;
  fullName: string;
}

const STATUS_ITEMS = [
  { value: 'REGISTERED', label: 'Inscrito' },
  { value: 'ATTENDED', label: 'Presente' },
  { value: 'ABSENT', label: 'Ausente' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export function ParticipantsTab({ training }: ParticipantsTabProps) {
  const toast = useToast();
  const sessions = training.sessions ?? [];
  const [sessionId, setSessionId] = useState<number | null>(sessions[0]?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [addUserIds, setAddUserIds] = useState<number[]>([]);
  const [transferring, setTransferring] = useState<Participant | null>(null);
  const [targetSessionId, setTargetSessionId] = useState<string>('');

  const { data: participants = [], refetch } = useApiQuery<Participant[]>(
    ['trainings', 'session-participants', sessionId],
    `/trainings/sessions/${sessionId}/participants`,
    { enabled: !!sessionId, staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: usersResp } = useApiQuery<{ data: UserOption[] }>(
    ['trainings', 'users-picker'],
    '/users',
    { params: { limit: 200 }, enabled: showAdd, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const enrolledIds = new Set(participants.map((p) => p.user.id));
  const userItems = (usersResp?.data ?? [])
    .filter((u) => !enrolledIds.has(u.id))
    .map((u) => ({ value: String(u.id), label: u.fullName }));

  const invalidate = () => refetch();
  const onErr = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const approve = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/participants/${id}/approve`),
    { onSuccess: invalidate, onError: onErr },
  );
  const reject = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/participants/${id}/reject`, {}),
    { onSuccess: invalidate, onError: onErr },
  );
  const updateStatus = useApiMutation(
    ({ id, status }: { id: number; status: string }) =>
      apiClient.patch(`/trainings/participants/${id}/status`, { status }),
    { onSuccess: invalidate, onError: onErr },
  );
  const bulkRegister = useApiMutation(
    () => apiClient.post('/trainings/sessions/register/bulk', { sessionId, userIds: addUserIds, allowWaitlist: true }),
    {
      onSuccess: (res: unknown) => {
        const r = res as { registered?: number; failed?: number };
        toast({
          title: `${r.registered ?? 0} participante(s) inscrito(s)${r.failed ? `, ${r.failed} falharam` : ''}.`,
          intent: r.failed ? 'info' : 'success',
        });
        setShowAdd(false);
        setAddUserIds([]);
        invalidate();
      },
      onError: onErr,
    },
  );
  const transfer = useApiMutation(
    () =>
      apiClient.patch(`/trainings/participants/${transferring!.id}/transfer`, {
        targetSessionId: Number(targetSessionId),
      }),
    {
      onSuccess: () => {
        toast({ title: 'Participante transferido.', intent: 'success' });
        setTransferring(null);
        setTargetSessionId('');
        invalidate();
      },
      onError: onErr,
    },
  );

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="Sem sessões"
        description="Cria uma sessão no separador 'Sessões' para começar a gerir participantes."
      />
    );
  }

  const pending = participants.filter((p) => p.status === 'PENDING_APPROVAL');
  const otherSessions = sessions.filter((s) => s.id !== sessionId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          items={sessions.map((s) => ({ value: String(s.id), label: fmtDate(s.sessionDate) }))}
          value={sessionId ? String(sessionId) : undefined}
          onValueChange={(v) => setSessionId(Number(v))}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Adicionar participantes
          </Button>
          <a
            href={`/api/trainings/${training.id}/participants/export`}
            className={buttonVariants({ intent: 'ghost', size: 'sm' })}
          >
            <Download size={14} strokeWidth={1.75} />
            Exportar
          </a>
        </div>
      </div>

      {pending.length > 0 && (
        <Card className="border-warning bg-warning-subtle p-4">
          <div className="mb-2 font-body text-sm font-semibold text-warning-ink">
            {pending.length} inscrição(ões) pendente(s) de aprovação
          </div>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <span className="font-body text-sm text-ink">{p.user.fullName}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    intent="success"
                    onClick={() => approve.mutate(p.id)}
                    loading={approve.isPending && approve.variables === p.id}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    intent="danger"
                    onClick={() => reject.mutate(p.id)}
                    loading={reject.isPending && reject.variables === p.id}
                  >
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {participants.length === 0 ? (
        <EmptyState title="Sem participantes" description="Ainda ninguém se inscreveu nesta sessão." />
      ) : (
        <Card className="divide-y divide-border">
          {participants
            .filter((p) => p.status !== 'PENDING_APPROVAL')
            .map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={p.user.fullName} url={p.user.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{p.user.fullName}</div>
                  <div className="text-xs text-ink-faint">
                    {p.user.department?.name ?? '—'}
                    {p.finalScore != null ? ` · Nota: ${p.finalScore}` : ''}
                  </div>
                </div>
                <StatusBadge value={p.status} map={PARTICIPANT_CFG} />
                <Select
                  items={STATUS_ITEMS}
                  value={p.status}
                  onValueChange={(status) => updateStatus.mutate({ id: p.id, status })}
                  className="w-40 flex-shrink-0"
                />
                {otherSessions.length > 0 && (
                  <Button intent="ghost" size="sm" onClick={() => setTransferring(p)}>
                    Transferir
                  </Button>
                )}
              </div>
            ))}
        </Card>
      )}

      {showAdd && (
        <Modal open onOpenChange={(open) => !open && setShowAdd(false)}>
          <ModalContent title="Adicionar participantes" className="max-w-lg">
            <div className="mt-4 space-y-4">
              <p className="font-body text-xs text-ink-faint">
                Selecciona um ou mais colaboradores para inscrever na sessão de {fmtDate(sessions.find((s) => s.id === sessionId)?.sessionDate ?? null)}.
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                {userItems.length === 0 && (
                  <p className="flex items-center gap-2 p-2 text-xs text-ink-faint">
                    <UsersIcon size={14} strokeWidth={1.75} /> Sem colaboradores disponíveis.
                  </p>
                )}
                {userItems.map((u) => (
                  <label key={u.value} className="flex items-center gap-2 px-2 py-1 text-sm text-ink-muted">
                    <input
                      type="checkbox"
                      checked={addUserIds.includes(Number(u.value))}
                      onChange={() =>
                        setAddUserIds((ids) =>
                          ids.includes(Number(u.value))
                            ? ids.filter((id) => id !== Number(u.value))
                            : [...ids, Number(u.value)],
                        )
                      }
                    />
                    {u.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                disabled={addUserIds.length === 0}
                loading={bulkRegister.isPending}
                onClick={() => bulkRegister.mutate(undefined)}
              >
                Inscrever {addUserIds.length > 0 ? `(${addUserIds.length})` : ''}
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}

      {transferring && (
        <Modal open onOpenChange={(open) => !open && setTransferring(null)}>
          <ModalContent title={`Transferir ${transferring.user.fullName}`} className="max-w-md">
            <div className="mt-4 space-y-4">
              <Select
                items={otherSessions.map((s) => ({ value: String(s.id), label: fmtDate(s.sessionDate) }))}
                value={targetSessionId || undefined}
                onValueChange={setTargetSessionId}
                placeholder="Turma/sessão de destino"
                className="w-full"
              />
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setTransferring(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                disabled={!targetSessionId}
                loading={transfer.isPending}
                onClick={() => transfer.mutate(undefined)}
              >
                Transferir
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
