// components/onboarding/PlanDetailModal.tsx
// Detalhe de um plano de integração de um colaborador, aberto a partir da
// lista do separador "Planos" e das linhas do Dashboard. Leitura para
// ADMIN/RH/GESTOR (GET /onboarding/:id faz assertCanAccess com esses
// papéis + o dono do plano).
//
// Acções:
//  - "Remover plano" (rodapé) e validar documentos — `canManagePlan`
//    (ADMIN/RH). DELETE /onboarding/:id e PATCH /onboarding/documents/validate.
//  - Por tarefa, com `canManageTasks` (ADMIN/RH/GESTOR):
//      · "Aprovar" / "Rejeitar" — só quando a tarefa exige aprovação e o
//        colaborador já a marcou como feita (requiresApproval + status
//        IN_PROGRESS, que é o estado em que completeTask a deixa).
//        POST /onboarding/tasks/approve { decision }.
//      · "Saltar" — qualquer tarefa por concluir. POST /onboarding/tasks/skip
//        { reason } (motivo obrigatório).
//    Rejeitar (tarefa/documento) e Saltar abrem um painel inline com
//    textarea; Aprovar é directo.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  CATEGORY_CFG,
  PHASE_LABELS,
  PHASE_ORDER,
  STATUS_CFG,
  TASK_STATUS_CFG,
} from './constants';
import type {
  DocStatus,
  OnboardingPlanDetail,
  PlanTaskInstance,
} from './types';

export interface PlanDetailModalProps {
  planId: number;
  /** ADMIN/RH: mostra a acção "Remover plano". */
  canManagePlan: boolean;
  /** ADMIN/RH/GESTOR: mostra aprovar / rejeitar / saltar por tarefa. */
  canManageTasks?: boolean;
  onClose: () => void;
}

// Estados em que ainda faz sentido saltar uma tarefa.
const SKIPPABLE = new Set(['PENDING', 'IN_PROGRESS', 'BLOCKED']);

const DOC_LABEL: Record<DocStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};
const DOC_BADGE: Record<DocStatus, 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

type PendingAction = { taskId: number; kind: 'skip' | 'reject' } | null;

export function PlanDetailModal({
  planId,
  canManagePlan,
  canManageTasks = false,
  onClose,
}: PlanDetailModalProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [pending, setPending] = useState<PendingAction>(null);
  const [reason, setReason] = useState('');
  // Painel de rejeição de documento (id do documento) + motivo.
  const [docReject, setDocReject] = useState<number | null>(null);
  const [docReason, setDocReason] = useState('');

  const { data, isLoading, error } = useApiQuery<OnboardingPlanDetail>(
    queryKeys.onboarding.plan(planId),
    `/onboarding/${planId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [
    queryKeys.onboarding.all,
    queryKeys.onboarding.plan(planId),
  ];
  const onTaskError = (e: Error) =>
    toast({ title: e.message, intent: 'danger' });
  const afterTaskAction = (title: string) => {
    toast({ title, intent: 'success' });
    setPending(null);
    setReason('');
  };

  const remove = useApiMutation(
    () => apiClient.delete(`/onboarding/${planId}`),
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Plano removido.', intent: 'success' });
        onClose();
      },
      onError: onTaskError,
    },
  );

  const approve = useApiMutation(
    (taskInstanceId: number) =>
      apiClient.post('/onboarding/tasks/approve', {
        taskInstanceId,
        decision: 'approve',
      }),
    {
      invalidateKeys,
      onSuccess: () => afterTaskAction('Tarefa aprovada.'),
      onError: onTaskError,
    },
  );

  const reject = useApiMutation(
    (v: { taskInstanceId: number; comment: string }) =>
      apiClient.post('/onboarding/tasks/approve', {
        taskInstanceId: v.taskInstanceId,
        decision: 'reject',
        ...(v.comment.trim() ? { comment: v.comment.trim() } : {}),
      }),
    {
      invalidateKeys,
      onSuccess: () =>
        afterTaskAction('Tarefa rejeitada — volta ao colaborador.'),
      onError: onTaskError,
    },
  );

  const skip = useApiMutation(
    (v: { taskInstanceId: number; reason: string }) =>
      apiClient.post('/onboarding/tasks/skip', {
        taskInstanceId: v.taskInstanceId,
        reason: v.reason.trim(),
      }),
    {
      invalidateKeys,
      onSuccess: () => afterTaskAction('Tarefa saltada.'),
      onError: onTaskError,
    },
  );

  const validateDoc = useApiMutation(
    (v: { documentId: number; status: DocStatus; rejectionReason?: string }) =>
      apiClient.patch('/onboarding/documents/validate', {
        documentId: v.documentId,
        status: v.status,
        ...(v.rejectionReason?.trim()
          ? { rejectionReason: v.rejectionReason.trim() }
          : {}),
      }),
    {
      invalidateKeys,
      onSuccess: (_d, v) => {
        toast({
          title:
            (v as { status: DocStatus }).status === 'APPROVED'
              ? 'Documento aprovado.'
              : 'Documento rejeitado.',
          intent: 'success',
        });
        setDocReject(null);
        setDocReason('');
      },
      onError: onTaskError,
    },
  );

  const busy =
    remove.isPending ||
    approve.isPending ||
    reject.isPending ||
    skip.isPending ||
    validateDoc.isPending;

  async function onDelete() {
    const ok = await confirm({
      title: `Remover o plano de ${data?.user.fullName ?? 'este colaborador'}?`,
      message:
        'O plano de integração e as suas tarefas são eliminados de forma permanente.',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) remove.mutate(undefined);
  }

  function confirmPanel(task: PlanTaskInstance) {
    if (!pending || pending.taskId !== task.id) return;
    if (pending.kind === 'skip') {
      if (!reason.trim()) return;
      skip.mutate({ taskInstanceId: task.id, reason });
    } else {
      reject.mutate({ taskInstanceId: task.id, comment: reason });
    }
  }

  const team = data
    ? [
        { label: 'Gestor directo', person: data.manager },
        { label: 'Buddy / Mentor', person: data.buddy },
        { label: 'RH responsável', person: data.hrResponsible },
      ]
    : [];

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data ? data.user.fullName : 'Plano de integração'}
        description={data ? data.template.name : undefined}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {isLoading ? (
          <div className="mt-5">
            <Skeleton rows={5} />
          </div>
        ) : error || !data ? (
          <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            Não foi possível carregar o plano.
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Cabeçalho */}
            <div className="flex items-start gap-4 rounded-card border border-border bg-surface p-4">
              <Avatar
                name={data.user.fullName}
                url={data.user.avatarUrl ?? undefined}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-body text-sm font-semibold text-ink">
                    {data.user.fullName}
                  </span>
                  <StatusBadge value={data.status} map={STATUS_CFG} />
                </div>
                <div className="mt-0.5 font-body text-xs text-ink-faint">
                  {data.user.position?.name ?? '—'}
                  {data.user.department?.name
                    ? ` · ${data.user.department.name}`
                    : ''}
                </div>
                <div className="mt-2">
                  <ProgressBar value={data.progress} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 font-body text-xs text-ink-faint">
                  <span>
                    {data.completedTasks}/{data.totalTasks} tarefas ·{' '}
                    {data.progress}%
                  </span>
                  <span>Início {fmtDate(data.startDate)}</span>
                  {data.expectedEndDate && (
                    <span>Previsto {fmtDate(data.expectedEndDate)}</span>
                  )}
                  {data.xpEarned > 0 && <span>{data.xpEarned} XP</span>}
                </div>
              </div>
            </div>

            {/* Equipa de apoio */}
            <div className="grid grid-cols-3 gap-3">
              {team.map(({ label, person }) => (
                <div
                  key={label}
                  className="rounded-card border border-border bg-surface p-3 text-center"
                >
                  <div className="mb-2 font-body text-xs text-ink-faint">
                    {label}
                  </div>
                  {person ? (
                    <div className="flex flex-col items-center gap-1">
                      <Avatar
                        name={person.fullName}
                        url={person.avatarUrl ?? undefined}
                        size="md"
                      />
                      <div className="font-body text-xs font-medium text-ink">
                        {person.fullName}
                      </div>
                    </div>
                  ) : (
                    <div className="font-body text-xs text-ink-faint">
                      Não atribuído
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Tarefas por fase */}
            {PHASE_ORDER.map((phase) => {
              const phaseTasks = data.byPhase[phase] ?? [];
              if (phaseTasks.length === 0) return null;
              return (
                <section key={phase}>
                  <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {PHASE_LABELS[phase]}
                    <span className="ml-1.5 text-ink-faint">
                      ({phaseTasks.length})
                    </span>
                  </h3>
                  <ul className="space-y-2">
                    {phaseTasks.map((task) => {
                      const stCfg = TASK_STATUS_CFG[task.status];
                      const catCfg = CATEGORY_CFG[task.templateTask.category];
                      const awaitingApproval =
                        task.templateTask.requiresApproval &&
                        task.status === 'IN_PROGRESS';
                      const canSkip = SKIPPABLE.has(task.status);
                      const showActions =
                        canManageTasks && (awaitingApproval || canSkip);
                      const panelOpen = pending?.taskId === task.id;
                      return (
                        <li
                          key={task.id}
                          className="rounded-card border border-border bg-surface p-3"
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 text-sm ${stCfg?.cls ?? ''}`}
                            >
                              {stCfg?.icon ?? '•'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-body text-sm font-medium text-ink">
                                  {task.templateTask.title}
                                </span>
                                {catCfg && (
                                  <span
                                    className={`rounded px-1.5 py-0.5 font-body text-xs ${catCfg.cls}`}
                                  >
                                    {catCfg.label}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-body text-xs text-ink-faint">
                                {task.dueDate && (
                                  <span>Prazo {fmtDate(task.dueDate)}</span>
                                )}
                                {task.completedAt && (
                                  <span className="text-success-ink">
                                    Concluída {fmtDate(task.completedAt)}
                                  </span>
                                )}
                                {task.templateTask.requiresApproval &&
                                  (task.approvedBy ? (
                                    <span className="text-success-ink">
                                      Aprovada por {task.approvedBy.fullName}
                                    </span>
                                  ) : awaitingApproval ? (
                                    <span className="text-warning-ink">
                                      Aguarda aprovação
                                    </span>
                                  ) : (
                                    <span>Requer aprovação</span>
                                  ))}
                                {task.approvalNote && (
                                  <span>Nota: {task.approvalNote}</span>
                                )}
                                {task.skipReason && (
                                  <span>Saltada: {task.skipReason}</span>
                                )}
                              </div>
                            </div>
                            {showActions && !panelOpen && (
                              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                                {awaitingApproval && (
                                  <>
                                    <Button
                                      size="sm"
                                      intent="secondary"
                                      disabled={busy}
                                      loading={approve.isPending}
                                      onClick={() => approve.mutate(task.id)}
                                    >
                                      Aprovar
                                    </Button>
                                    <Button
                                      size="sm"
                                      intent="ghost"
                                      disabled={busy}
                                      onClick={() => {
                                        setReason('');
                                        setPending({
                                          taskId: task.id,
                                          kind: 'reject',
                                        });
                                      }}
                                    >
                                      Rejeitar
                                    </Button>
                                  </>
                                )}
                                {canSkip && (
                                  <Button
                                    size="sm"
                                    intent="ghost"
                                    disabled={busy}
                                    onClick={() => {
                                      setReason('');
                                      setPending({
                                        taskId: task.id,
                                        kind: 'skip',
                                      });
                                    }}
                                  >
                                    Saltar
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {panelOpen && (
                            <div className="mt-3 border-t border-border pt-3">
                              <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={2}
                                className="w-full"
                                placeholder={
                                  pending?.kind === 'skip'
                                    ? 'Motivo para saltar a tarefa (obrigatório)…'
                                    : 'Comentário para o colaborador (opcional)…'
                                }
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  intent="ghost"
                                  disabled={busy}
                                  onClick={() => {
                                    setPending(null);
                                    setReason('');
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  intent={
                                    pending?.kind === 'skip'
                                      ? 'primary'
                                      : 'danger'
                                  }
                                  loading={skip.isPending || reject.isPending}
                                  disabled={
                                    busy ||
                                    (pending?.kind === 'skip' && !reason.trim())
                                  }
                                  onClick={() => confirmPanel(task)}
                                >
                                  {pending?.kind === 'skip'
                                    ? 'Saltar tarefa'
                                    : 'Rejeitar tarefa'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}

            {/* Documentos */}
            {data.documents.length > 0 && (
              <section>
                <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Documentos
                  <span className="ml-1.5 text-ink-faint">
                    ({data.documents.length})
                  </span>
                </h3>
                <ul className="space-y-2">
                  {data.documents.map((doc) => {
                    const rejectOpen = docReject === doc.id;
                    return (
                      <li
                        key={doc.id}
                        className="rounded-card border border-border bg-surface p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-body text-sm font-medium text-ink">
                                {doc.documentType}
                              </span>
                              <Badge dot={false} intent={DOC_BADGE[doc.status]}>
                                {DOC_LABEL[doc.status]}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-body text-xs text-ink-faint">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                Abrir documento
                              </a>
                              <span>Enviado {fmtDate(doc.createdAt)}</span>
                              {doc.notes && <span>Nota: {doc.notes}</span>}
                              {doc.rejectionReason && (
                                <span className="text-danger-ink">
                                  Motivo: {doc.rejectionReason}
                                </span>
                              )}
                            </div>
                          </div>
                          {canManagePlan &&
                            doc.status === 'PENDING' &&
                            !rejectOpen && (
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  size="sm"
                                  intent="secondary"
                                  disabled={busy}
                                  loading={validateDoc.isPending}
                                  onClick={() =>
                                    validateDoc.mutate({
                                      documentId: doc.id,
                                      status: 'APPROVED',
                                    })
                                  }
                                >
                                  Aprovar documento
                                </Button>
                                <Button
                                  size="sm"
                                  intent="ghost"
                                  disabled={busy}
                                  onClick={() => {
                                    setDocReason('');
                                    setDocReject(doc.id);
                                  }}
                                >
                                  Rejeitar documento
                                </Button>
                              </div>
                            )}
                        </div>

                        {rejectOpen && (
                          <div className="mt-3 border-t border-border pt-3">
                            <Textarea
                              value={docReason}
                              onChange={(e) => setDocReason(e.target.value)}
                              rows={2}
                              className="w-full"
                              placeholder="Motivo da rejeição (opcional)…"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <Button
                                size="sm"
                                intent="ghost"
                                disabled={busy}
                                onClick={() => {
                                  setDocReject(null);
                                  setDocReason('');
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                intent="danger"
                                loading={validateDoc.isPending}
                                disabled={busy}
                                onClick={() =>
                                  validateDoc.mutate({
                                    documentId: doc.id,
                                    status: 'REJECTED',
                                    rejectionReason: docReason,
                                  })
                                }
                              >
                                Confirmar rejeição
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div>
            {canManagePlan && data && (
              <Button
                intent="danger"
                onClick={onDelete}
                loading={remove.isPending}
                disabled={busy}
              >
                Remover plano
              </Button>
            )}
          </div>
          <Button intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
