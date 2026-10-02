// components/processes/InstanceDialogs.tsx
// Diálogos das acções de "Todos os Processos" (§4): editar dados/prazo,
// reatribuir responsável e consultar o histórico da instância.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { Skeleton } from './Skeleton';
import { UserPicker } from './UserPicker';
import type { InstanceRow } from './types';

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

// ─── Editar ──────────────────────────────────────────────────────────────────

export function EditInstanceModal({
  row,
  onClose,
}: {
  row: InstanceRow;
  onClose: () => void;
}) {
  const notify = useToast();
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description ?? '');
  const [dueAt, setDueAt] = useState(toDateInput(row.dueAt));
  const [reason, setReason] = useState('');

  const dueChanged = dueAt !== toDateInput(row.dueAt);
  const canSave =
    name.trim().length > 0 && (!dueChanged || reason.trim().length > 0);

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.patch(`/processes/instances/${row.id}`, body),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Processo actualizado', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={`Editar ${row.code}`}
        description="As etapas já concluídas e o histórico não são alterados."
        className="max-w-lg"
      >
        <div className="mt-4 space-y-4">
          <FormField label="Nome *" htmlFor="ei-name">
            <Input
              id="ei-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
            />
          </FormField>
          <FormField label="Descrição" htmlFor="ei-desc">
            <Textarea
              id="ei-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>
          <FormField label="Prazo final" htmlFor="ei-due">
            <Input
              id="ei-due"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </FormField>
          {dueChanged && (
            <FormField
              label="Justificação do novo prazo *"
              htmlFor="ei-reason"
              hint="Fica registada com o prazo anterior e o autor."
            >
              <Textarea
                id="ei-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full"
              />
            </FormField>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!canSave}
            loading={save.isPending}
            onClick={() =>
              save.mutate({
                title: name.trim(),
                description: description.trim(),
                ...(dueChanged
                  ? {
                      dueAt: new Date(dueAt + 'T23:59:59').toISOString(),
                      reason: reason.trim(),
                    }
                  : {}),
              })
            }
          >
            Guardar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ─── Reatribuir ──────────────────────────────────────────────────────────────

export function AssignInstanceModal({
  row,
  onClose,
}: {
  row: InstanceRow;
  onClose: () => void;
}) {
  const notify = useToast();
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');

  const assign = useApiMutation(
    () =>
      apiClient.patch(`/processes/instances/${row.id}/assign`, {
        responsibleId: Number(userId),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      }),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Responsável actualizado', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={`Atribuir responsável — ${row.code}`}
        description={`Responsável actual: ${row.currentResponsible?.fullName ?? 'por atribuir'}.`}
        className="max-w-md"
      >
        <div className="mt-4 space-y-4">
          <FormField label="Novo responsável *" htmlFor="ai-user">
            <UserPicker value={userId} onChange={setUserId} />
          </FormField>
          <FormField label="Motivo" htmlFor="ai-reason">
            <Textarea
              id="ai-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={assign.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!userId}
            loading={assign.isPending}
            onClick={() => assign.mutate(undefined)}
          >
            Atribuir
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ─── Histórico ───────────────────────────────────────────────────────────────

interface HistoryResponse {
  data: Array<{
    id: number;
    action: string;
    meta: string | null;
    createdAt: string;
    user: { id: number; fullName: string };
  }>;
}

const ACTION_LABEL: Record<string, string> = {
  INSTANCE_STARTED: 'Processo iniciado',
  INSTANCE_UPDATED: 'Dados editados',
  INSTANCE_REASSIGNED: 'Responsável reatribuído',
  INSTANCE_PRIORITY_CHANGED: 'Prioridade alterada',
  INSTANCE_SUSPENDED: 'Suspenso',
  INSTANCE_RESUMED: 'Retomado',
  INSTANCE_CANCELLED: 'Cancelado',
  INSTANCE_ARCHIVED: 'Arquivado',
  INSTANCE_DUPLICATED: 'Duplicado',
  STEP_COMPLETED: 'Etapa concluída',
  STEP_REJECTED: 'Etapa rejeitada',
  STEP_STARTED: 'Tarefa iniciada',
  STEP_BLOCKED: 'Tarefa bloqueada',
  STEP_UNBLOCKED: 'Tarefa desbloqueada',
  STEP_RETURNED: 'Tarefa devolvida',
  STEP_REOPENED: 'Tarefa reaberta',
  STEP_REASSIGNED: 'Tarefa reatribuída',
  STEP_ESCALATED: 'Tarefa escalada',
  STEP_CLARIFICATION_REQUESTED: 'Esclarecimento pedido',
  STEP_REMINDER_SENT: 'Lembrete enviado',
};

function metaSummary(meta: string | null): string {
  if (!meta) return '';
  try {
    const m = JSON.parse(meta) as Record<string, unknown>;
    return Object.entries(m)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join(' · ');
  } catch {
    return '';
  }
}

export function InstanceHistoryModal({
  row,
  onClose,
}: {
  row: InstanceRow;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useApiQuery<HistoryResponse>(
    queryKeys.processes.instanceHistory(row.id),
    `/processes/instances/${row.id}/history`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={`Histórico — ${row.code}`}
        description={row.name}
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-4">
          {isLoading && <Skeleton rows={4} />}
          {error && (
            <p className="font-body text-sm text-danger">{error.message}</p>
          )}
          {data && data.data.length === 0 && (
            <EmptyState
              title="Sem eventos"
              description="Ainda não há registos para este processo."
            />
          )}
          <ol className="space-y-3">
            {data?.data.map((ev) => (
              <li
                key={ev.id}
                className="rounded-card border border-border bg-surface p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-body text-sm font-medium text-ink">
                    {ACTION_LABEL[ev.action] ?? ev.action}
                  </span>
                  <span className="font-body text-xs text-ink-faint">
                    {formatDateTime(ev.createdAt)}
                  </span>
                </div>
                <div className="mt-0.5 font-body text-xs text-ink-muted">
                  {ev.user.fullName}
                </div>
                {metaSummary(ev.meta) && (
                  <div className="mt-1 break-words font-mono text-xs text-ink-faint">
                    {metaSummary(ev.meta)}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-5 flex justify-end">
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
