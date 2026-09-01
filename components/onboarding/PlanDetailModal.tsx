// components/onboarding/PlanDetailModal.tsx
// Detalhe de um plano de integração de um colaborador, aberto a partir da
// lista do separador "Planos" e das linhas do Dashboard. Leitura para
// ADMIN/RH/GESTOR (GET /onboarding/:id faz assertCanAccess com esses
// papéis + o dono do plano). O rodapé "Remover plano" só aparece com
// `canDelete` (ADMIN/RH), espelhando @Roles(ADMIN, RH) no DELETE
// /onboarding/:id.
//
// Aprovar / saltar tarefas fica para o bloco C — aqui o detalhe é de
// leitura, com a excepção da remoção do plano.

'use client';

import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  CATEGORY_CFG,
  PHASE_LABELS,
  PHASE_ORDER,
  STATUS_CFG,
  TASK_STATUS_CFG,
} from './constants';
import type { OnboardingPlanDetail } from './types';

export interface PlanDetailModalProps {
  planId: number;
  /** ADMIN/RH: mostra a acção "Remover plano". */
  canDelete: boolean;
  onClose: () => void;
}

export function PlanDetailModal({
  planId,
  canDelete,
  onClose,
}: PlanDetailModalProps) {
  const confirm = useConfirm();
  const toast = useToast();

  const { data, isLoading, error } = useApiQuery<OnboardingPlanDetail>(
    queryKeys.onboarding.plan(planId),
    `/onboarding/${planId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const remove = useApiMutation(
    () => apiClient.delete(`/onboarding/${planId}`),
    {
      invalidateKeys: [
        queryKeys.onboarding.all,
        queryKeys.onboarding.plan(planId),
      ],
      onSuccess: () => {
        toast({ title: 'Plano removido.', intent: 'success' });
        onClose();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

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
                      return (
                        <li
                          key={task.id}
                          className="flex items-start gap-3 rounded-card border border-border bg-surface p-3"
                        >
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
                                ) : (
                                  <span className="text-warning-ink">
                                    Aguarda aprovação
                                  </span>
                                ))}
                              {task.skipReason && (
                                <span>Saltada: {task.skipReason}</span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div>
            {canDelete && data && (
              <Button
                intent="danger"
                onClick={onDelete}
                loading={remove.isPending}
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
