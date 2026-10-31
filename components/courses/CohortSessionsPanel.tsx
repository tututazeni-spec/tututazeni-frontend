// components/courses/CohortSessionsPanel.tsx
// Sessões (aulas) de uma turma: criar, editar, cancelar e ver se as presenças
// já foram registadas. Uma sessão cancelada nunca é apagada — mantém o
// histórico e deixa de contar para a assiduidade.

'use client';

import { useState } from 'react';
import { CalendarPlus, ClipboardCheck, Pencil, Plus, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from './shared';
import type { CohortSession, SessionModality, SessionStatus } from './types';

export const MODALITY_LABEL: Record<SessionModality, string> = {
  IN_PERSON: 'Presencial',
  ONLINE: 'Online',
  HYBRID: 'Híbrida',
};

export const SESSION_STATUS: Record<
  SessionStatus,
  { label: string; intent: 'info' | 'warning' | 'success' | 'danger' }
> = {
  SCHEDULED: { label: 'Agendada', intent: 'info' },
  IN_PROGRESS: { label: 'Em curso', intent: 'warning' },
  COMPLETED: { label: 'Concluída', intent: 'success' },
  CANCELLED: { label: 'Cancelada', intent: 'danger' },
};

/** "02/11/2026" a partir do ISO (data de calendário, sem fuso). */
export function sessionDay(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

interface Draft {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: SessionModality;
  notes: string;
}

const EMPTY: Draft = {
  title: '',
  date: '',
  startTime: '09:00',
  endTime: '12:00',
  modality: 'IN_PERSON',
  notes: '',
};

export interface CohortSessionsPanelProps {
  cohortId: number;
  /** Período da turma (YYYY-MM-DD), para limitar o seletor de data. */
  startDate: string;
  endDate: string | null;
  canManage: boolean;
  onOpenAttendance: (sessionId: number) => void;
}

export function CohortSessionsPanel({
  cohortId,
  startDate,
  endDate,
  canManage,
  onOpenAttendance,
}: CohortSessionsPanelProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  const { data: sessions, isLoading } = useApiQuery<CohortSession[]>(
    queryKeys.courses.cohortSessions(cohortId),
    `/courses/cohorts/${cohortId}/sessions`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [
    queryKeys.courses.cohortSessions(cohortId),
    queryKeys.courses.cohortAttendanceReport(cohortId),
  ];

  const save = useApiMutation(
    (body: Draft) =>
      editing === 'new'
        ? apiClient.post(`/courses/cohorts/${cohortId}/sessions`, {
            ...body,
            notes: body.notes || undefined,
          })
        : apiClient.patch(`/courses/cohorts/${cohortId}/sessions/${editing}`, {
            ...body,
            notes: body.notes || undefined,
          }),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({
          title: editing === 'new' ? 'Sessão criada' : 'Sessão actualizada',
          intent: 'success',
        });
        setEditing(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const cancel = useApiMutation(
    (sessionId: number) =>
      apiClient.post(
        `/courses/cohorts/${cohortId}/sessions/${sessionId}/cancel`,
        {},
      ),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Sessão cancelada', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  function startNew() {
    setDraft({ ...EMPTY, date: startDate.slice(0, 10) });
    setEditing('new');
  }

  function startEdit(s: CohortSession) {
    setDraft({
      title: s.title,
      date: s.date.slice(0, 10),
      startTime: s.startTime,
      endTime: s.endTime,
      modality: s.modality,
      notes: s.notes ?? '',
    });
    setEditing(s.id);
  }

  function submit() {
    if (!draft.title.trim()) {
      toast({ title: 'Indica o título da sessão', intent: 'danger' });
      return;
    }
    if (!draft.date) {
      toast({ title: 'Indica a data da sessão', intent: 'danger' });
      return;
    }
    if (draft.endTime <= draft.startTime) {
      toast({
        title: 'A hora de fim tem de ser depois da hora de início',
        intent: 'danger',
      });
      return;
    }
    save.mutate(draft);
  }

  async function onCancel(s: CohortSession) {
    const ok = await confirm({
      title: `Cancelar "${s.title}"?`,
      message: s.attendanceRecorded
        ? 'As presenças já registadas ficam guardadas, mas a sessão deixa de contar para a assiduidade.'
        : 'A sessão deixa de contar para a assiduidade.',
      confirmLabel: 'Cancelar sessão',
      destructive: true,
    });
    if (ok) cancel.mutate(s.id);
  }

  if (isLoading) return <Skeleton rows={3} />;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-ink">
          Sessões ({sessions?.length ?? 0})
        </h3>
        {canManage && editing === null && (
          <Button size="sm" onClick={startNew}>
            <Plus size={14} strokeWidth={1.75} className="mr-1" />
            Nova sessão
          </Button>
        )}
      </div>

      {editing !== null && (
        <div className="space-y-3 rounded-card border border-border p-4">
          <h4 className="text-sm font-medium text-ink">
            {editing === 'new' ? 'Nova sessão' : 'Editar sessão'}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-ink-muted sm:col-span-2">
              Título
              <Input
                value={draft.title}
                maxLength={200}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full"
              />
            </label>
            <label className="space-y-1 text-xs text-ink-muted">
              Data
              <Input
                type="date"
                value={draft.date}
                min={startDate.slice(0, 10)}
                max={(endDate ?? startDate).slice(0, 10)}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="w-full"
              />
            </label>
            <label className="space-y-1 text-xs text-ink-muted">
              Modalidade
              <NativeSelect
                value={draft.modality}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    modality: e.target.value as SessionModality,
                  })
                }
                className="w-full"
              >
                {Object.entries(MODALITY_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="space-y-1 text-xs text-ink-muted">
              Início
              <Input
                type="time"
                value={draft.startTime}
                onChange={(e) =>
                  setDraft({ ...draft, startTime: e.target.value })
                }
                className="w-full"
              />
            </label>
            <label className="space-y-1 text-xs text-ink-muted">
              Fim
              <Input
                type="time"
                value={draft.endTime}
                onChange={(e) =>
                  setDraft({ ...draft, endTime: e.target.value })
                }
                className="w-full"
              />
            </label>
            <label className="space-y-1 text-xs text-ink-muted sm:col-span-2">
              Observações
              <Textarea
                value={draft.notes}
                maxLength={1000}
                rows={2}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                className="w-full"
              />
            </label>
          </div>
          <p className="text-xs text-ink-faint">
            O formador da sessão é o formador da turma.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              intent="secondary"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={submit} loading={save.isPending}>
              Guardar sessão
            </Button>
          </div>
        </div>
      )}

      {(sessions ?? []).length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <CalendarPlus size={16} strokeWidth={1.75} />
          Ainda não há sessões nesta turma.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-card border border-border">
          {(sessions ?? []).map((s) => {
            const st = SESSION_STATUS[s.status];
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-3 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {s.title}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {sessionDay(s.date)} · {s.startTime}–{s.endTime} (
                    {Math.round(s.durationMinutes / 6) / 10} h) ·{' '}
                    {MODALITY_LABEL[s.modality]}
                    {s.instructor ? ` · ${s.instructor.fullName}` : ''}
                  </div>
                  {s.status === 'CANCELLED' && s.cancelReason && (
                    <div className="text-xs text-ink-faint">
                      Motivo: {s.cancelReason}
                    </div>
                  )}
                </div>
                <Badge intent={st.intent}>{st.label}</Badge>
                <Badge intent={s.attendanceRecorded ? 'success' : 'neutral'}>
                  {s.attendanceRecorded
                    ? `Presenças registadas (${s.recordedCount})`
                    : 'Sem presenças'}
                </Badge>
                <div className="flex gap-1">
                  {s.status !== 'CANCELLED' && (
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => onOpenAttendance(s.id)}
                    >
                      <ClipboardCheck
                        size={14}
                        strokeWidth={1.75}
                        className="mr-1"
                      />
                      Presenças
                    </Button>
                  )}
                  {canManage && s.status !== 'CANCELLED' && (
                    <>
                      <Button
                        size="sm"
                        intent="ghost"
                        aria-label={`Editar ${s.title}`}
                        onClick={() => startEdit(s)}
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </Button>
                      <Button
                        size="sm"
                        intent="ghostDanger"
                        aria-label={`Cancelar ${s.title}`}
                        onClick={() => void onCancel(s)}
                      >
                        <X size={14} strokeWidth={1.75} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
