// components/trainings/manage/ParticipantsTab.tsx
// Participantes de uma formação: inscrições, aprovações, lista de espera,
// presenças e estado de participação — por sessão (as inscrições vivem em
// TrainingSession, não directamente na formação).

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PARTICIPANT_CFG } from '../constants';
import { fmtDate } from '../utils';
import type { Participant, Training } from '../types';

interface ParticipantsTabProps {
  training: Training;
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

  const { data: participants = [], refetch } = useApiQuery<Participant[]>(
    ['trainings', 'session-participants', sessionId],
    `/trainings/sessions/${sessionId}/participants`,
    { enabled: !!sessionId, staleTime: STALE_TIME.DYNAMIC },
  );

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

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="Sem sessões"
        description="Cria uma sessão no separador 'Sessões' para começar a gerir participantes."
      />
    );
  }

  const pending = participants.filter((p) => p.status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-4">
      <Select
        items={sessions.map((s) => ({ value: String(s.id), label: fmtDate(s.sessionDate) }))}
        value={sessionId ? String(sessionId) : undefined}
        onValueChange={(v) => setSessionId(Number(v))}
        className="max-w-xs"
      />

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
              </div>
            ))}
        </Card>
      )}
    </div>
  );
}
