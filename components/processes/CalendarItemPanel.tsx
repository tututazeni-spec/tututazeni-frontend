// components/processes/CalendarItemPanel.tsx
// Detalhe de um item do calendário (docs/Modulo_Processes.md §10): todos os
// dados de prazo, dependências, conflitos e histórico de alterações do prazo,
// com reagendamento autorizado (prazo anterior, novo, autor e justificação
// ficam registados no backend).

'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { toLocalInput } from './calendar-utils';
import { fmtHours, INSTANCE_STATUS_MAP, PRIORITY_MAP, TASK_STATE_MAP } from './constants';
import type {
  CalendarConflict,
  CalendarItem,
  DeadlineChange,
  InstanceStatus,
  TaskState,
} from './types';

export interface CalendarItemPanelProps {
  item: CalendarItem;
  conflicts: CalendarConflict[];
  canReschedule: boolean;
  onClose: () => void;
  onOpenTask: (instanceId: number, stepId: number) => void;
  onOpenInstance: (instanceId: number) => void;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{label}</div>
    <div className="mt-0.5 font-body text-sm text-ink">{children}</div>
  </div>
);

const CLOSED = ['COMPLETED', 'CANCELLED', 'SKIPPED', 'REJECTED'];

export function CalendarItemPanel({
  item,
  conflicts,
  canReschedule,
  onClose,
  onOpenTask,
  onOpenInstance,
}: CalendarItemPanelProps) {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [due, setDue] = useState(toLocalInput(item.dueAt));
  const [reason, setReason] = useState('');

  const isTask = item.kind === 'TASK' && item.stepId != null;
  const historyPath = isTask
    ? `/processes/instances/${item.instanceId}/steps/${item.stepId}/deadline-history`
    : `/processes/instances/${item.instanceId}/deadline-history`;
  const { data: history } = useApiQuery<DeadlineChange[]>(
    queryKeys.processes.deadlineHistory(item.instanceId, isTask ? item.stepId : null),
    historyPath,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const reschedule = useApiMutation(
    () =>
      isTask
        ? apiClient.patch(`/processes/instances/${item.instanceId}/steps/${item.stepId}/deadline`, {
            dueAt: new Date(due).toISOString(),
            reason: reason.trim(),
          })
        : apiClient.patch(`/processes/instances/${item.instanceId}`, {
            dueAt: new Date(due).toISOString(),
            reason: reason.trim(),
          }),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Prazo reagendado', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const myConflicts = conflicts.filter((c) => c.itemKeys.includes(item.key));
  const closed = CLOSED.includes(item.status) || item.status === 'CANCELLED';
  const canEdit = canReschedule && !closed;
  const valid = due !== '' && reason.trim().length > 0 && !Number.isNaN(new Date(due).getTime());

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={`${item.code} — ${item.title}`}
        description={item.kind === 'TASK' ? `Tarefa de «${item.processTitle}»` : 'Prazo do processo'}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {item.kind === 'TASK' ? (
            <StatusBadge value={item.status as TaskState} map={TASK_STATE_MAP} variant="dot" />
          ) : (
            <StatusBadge value={item.status as InstanceStatus} map={INSTANCE_STATUS_MAP} variant="dot" />
          )}
          <StatusBadge value={item.priority} map={PRIORITY_MAP} />
          {item.isOverdue && (
            <span className="rounded-control bg-danger-subtle px-2 py-0.5 font-body text-xs text-danger-ink">
              Em atraso
            </span>
          )}
          {item.isDueSoon && (
            <span className="rounded-control bg-warning-subtle px-2 py-0.5 font-body text-xs text-warning-ink">
              Prazo próximo
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field label="Processo">
            {item.processTitle}
            <div className="font-mono text-xs text-ink-faint">{item.processCode}</div>
          </Field>
          <Field label="Responsável">{item.assignee?.fullName ?? 'Por atribuir'}</Field>
          <Field label="Data de início">{formatDateTime(item.startAt)}</Field>
          <Field label="Prazo final">{formatDateTime(item.dueAt)}</Field>
          <Field label="Duração prevista">{fmtHours(item.durationHours)}</Field>
          <Field label="Departamento">{item.department?.name ?? '—'}</Field>
          <Field label="Aprovação prevista">{formatDateTime(item.approvalDueAt)}</Field>
          <Field label="Conclusão real">{formatDateTime(item.completedAt)}</Field>
        </div>

        {item.dependencies.length > 0 && (
          <div className="mt-4">
            <div className="font-body text-xs uppercase tracking-wide text-ink-faint">
              Dependências
            </div>
            <ul className="mt-1 space-y-1">
              {item.dependencies.map((d) => (
                <li key={d.order} className="flex items-center justify-between font-body text-sm">
                  <span className="text-ink">
                    Etapa {d.order} — {d.title}
                  </span>
                  <span className={d.done ? 'text-success-ink' : 'text-warning-ink'}>
                    {d.done ? 'Concluída' : 'Por concluir'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {myConflicts.length > 0 && (
          <div className="mt-4 rounded-card border border-warning bg-warning-subtle p-3 font-body text-sm text-warning-ink">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle size={16} strokeWidth={1.75} /> Conflito de atribuição
            </div>
            {myConflicts.map((c) => (
              <p key={`${c.assigneeId}-${c.day}`} className="mt-1">
                {c.assigneeName} tem {c.totalHours}h previstas para {formatDate(c.day)} (capacidade{' '}
                {c.capacityHours}h). Considere reagendar ou reatribuir.
              </p>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="font-body text-xs uppercase tracking-wide text-ink-faint">
            Alterações do prazo
          </div>
          {!history || history.length === 0 ? (
            <p className="mt-1 font-body text-sm text-ink-faint">Sem alterações registadas.</p>
          ) : (
            <ul className="mt-1 space-y-2">
              {history.map((h) => (
                <li key={h.id} className="rounded-card border border-border p-2 font-body text-xs">
                  <div className="text-ink">
                    {formatDateTime(h.previousDueAt)} → <b>{formatDateTime(h.newDueAt)}</b>
                  </div>
                  <div className="text-ink-muted">
                    {h.author.fullName} · {formatDateTime(h.at)}
                  </div>
                  {h.reason && <div className="mt-0.5 text-ink-muted">«{h.reason}»</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {editing && (
          <div className="mt-4 space-y-3 rounded-card border border-border p-3">
            <FormField label="Novo prazo *" htmlFor="cal-due">
              <Input
                id="cal-due"
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </FormField>
            <FormField label="Justificação *" htmlFor="cal-reason">
              <Textarea
                id="cal-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full"
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button intent="ghost" onClick={() => setEditing(false)} disabled={reschedule.isPending}>
                Cancelar
              </Button>
              <Button disabled={!valid} loading={reschedule.isPending} onClick={() => reschedule.mutate(undefined)}>
                Guardar novo prazo
              </Button>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          {canEdit && !editing && (
            <Button intent="secondary" onClick={() => setEditing(true)}>
              Reagendar
            </Button>
          )}
          {isTask ? (
            <Button onClick={() => onOpenTask(item.instanceId, item.stepId as number)}>
              Abrir tarefa
            </Button>
          ) : (
            <Button onClick={() => onOpenInstance(item.instanceId)}>Abrir processo</Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
