// components/onboarding/TemplateDetailModal.tsx
// Abre ao clicar num cartão do separador "Templates". Leitura aberta a
// qualquer utilizador autenticado — GET /onboarding/templates/:id não tem
// @Roles. A gestão de tarefas (adicionar / editar / apagar) só aparece com
// `canManage` (ADMIN/RH), espelhando @Roles(ADMIN, RH) nos endpoints
// POST/PUT/DELETE /onboarding/templates/tasks em onboarding.controller.ts.
//
// As tarefas vêm ordenadas por `seq`; aqui agrupam-se por fase (PHASE_ORDER)
// para dar a leitura de "o que acontece em cada momento do onboarding". Os
// formulários (TemplateTaskFormModal para tarefas, TemplateFormModal para os
// metadados) abrem por cima deste modal, mesmo padrão de
// CompetencyDetailModal → CompetencyFormModal.
//
// Rodapé (canManage): "Editar" → PUT /onboarding/templates/:id;
// "Apagar template" → DELETE /onboarding/templates/:id (@Roles(ADMIN, RH)).
// O backend recusa (403) apagar um template com planos associados — o
// botão já aparece desactivado nesse caso, com o toast a servir de rede.

'use client';

import { useState } from 'react';
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  CATEGORY_CFG,
  PHASE_LABELS,
  PHASE_ORDER,
  RESPONSIBLE_LABELS,
  TASK_TYPE_LABELS,
} from './constants';
import { TemplateFormModal } from './TemplateFormModal';
import { TemplateTaskFormModal } from './TemplateTaskFormModal';
import type {
  OnboardingTemplateDetail,
  TaskPhase,
  TemplateTask,
} from './types';

export interface TemplateDetailModalProps {
  templateId: number;
  /** ADMIN/RH: mostra as acções de gestão de tarefas. */
  canManage: boolean;
  onClose: () => void;
}

type FormState = { task: TemplateTask | null; phase: TaskPhase } | null;

export function TemplateDetailModal({
  templateId,
  canManage,
  onClose,
}: TemplateDetailModalProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(null);
  const [showEdit, setShowEdit] = useState(false);

  const { data, isLoading, error } = useApiQuery<OnboardingTemplateDetail>(
    queryKeys.onboarding.template(templateId),
    `/onboarding/templates/${templateId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const remove = useApiMutation(
    (taskId: number) =>
      apiClient.delete(`/onboarding/templates/tasks/${taskId}`),
    {
      invalidateKeys: [
        queryKeys.onboarding.all,
        queryKeys.onboarding.template(templateId),
      ],
      onSuccess: () => toast({ title: 'Tarefa removida.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const deleteTemplate = useApiMutation(
    () => apiClient.delete(`/onboarding/templates/${templateId}`),
    {
      invalidateKeys: [
        queryKeys.onboarding.all,
        queryKeys.onboarding.template(templateId),
      ],
      onSuccess: () => {
        toast({ title: 'Template eliminado.', intent: 'success' });
        onClose();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const tasks = data?.tasks ?? [];
  const nextSeq = tasks.length ? Math.max(...tasks.map((t) => t.seq)) + 1 : 0;
  const planCount = data?._count?.plans ?? 0;

  async function onDelete(task: TemplateTask) {
    const ok = await confirm({
      title: `Remover "${task.title}"?`,
      message:
        'A tarefa é removida do template. Os planos já criados não são afectados.',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) remove.mutate(task.id);
  }

  async function onDeleteTemplate() {
    const ok = await confirm({
      title: `Eliminar o template "${data?.name ?? ''}"?`,
      message:
        'O template e todas as suas tarefas são eliminados de forma permanente. Para o retirar de circulação sem perder o registo, desligue "Template activo" em Editar.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) deleteTemplate.mutate(undefined);
  }

  return (
    <>
      <Modal open onOpenChange={(open) => !open && onClose()}>
        <ModalContent
          title={data?.name ?? 'Template'}
          description={
            data
              ? `${data.durationDays} dias · ${tasks.length} tarefas${
                  data.active ? '' : ' · inactivo'
                }`
              : undefined
          }
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {isLoading ? (
            <div className="mt-5">
              <Skeleton rows={5} />
            </div>
          ) : error || !data ? (
            <div className="mt-5 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              Não foi possível carregar o template.
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {data.description && (
                <p className="font-body text-sm text-ink-muted">
                  {data.description}
                </p>
              )}

              {PHASE_ORDER.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase);
                if (phaseTasks.length === 0 && !canManage) return null;
                return (
                  <section key={phase}>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
                        {PHASE_LABELS[phase]}
                        <span className="ml-1.5 text-ink-faint">
                          ({phaseTasks.length})
                        </span>
                      </h3>
                      {canManage && (
                        <Button
                          size="sm"
                          intent="ghost"
                          onClick={() => setForm({ task: null, phase })}
                        >
                          <Plus size={14} strokeWidth={2} />
                          Adicionar tarefa
                        </Button>
                      )}
                    </div>

                    {phaseTasks.length === 0 ? (
                      <p className="rounded-card bg-surface-sunken px-3 py-2 font-body text-xs text-ink-faint">
                        Sem tarefas nesta fase.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {phaseTasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface p-3"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  dot={false}
                                  className={CATEGORY_CFG[task.category]?.cls}
                                >
                                  {CATEGORY_CFG[task.category]?.label ??
                                    task.category}
                                </Badge>
                                <span className="font-body text-sm font-medium text-ink">
                                  {task.title}
                                </span>
                              </div>
                              {task.description && (
                                <p className="mt-1 line-clamp-2 font-body text-xs text-ink-muted">
                                  {task.description}
                                </p>
                              )}
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-body text-xs text-ink-faint">
                                <span>
                                  {TASK_TYPE_LABELS[task.type] ?? task.type}
                                </span>
                                <span>
                                  {RESPONSIBLE_LABELS[task.responsible] ??
                                    task.responsible}
                                </span>
                                <span>+{task.xpReward} XP</span>
                                {task.dueDayOffset != null && (
                                  <span>até ao dia {task.dueDayOffset}</span>
                                )}
                                {task.requiresApproval && (
                                  <span>requer aprovação</span>
                                )}
                                {task.requiresEvidence && (
                                  <span>requer evidência</span>
                                )}
                              </div>
                            </div>
                            {canManage && (
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  size="sm"
                                  intent="ghost"
                                  aria-label="Editar tarefa"
                                  onClick={() => setForm({ task, phase })}
                                >
                                  <Pencil size={14} strokeWidth={2} />
                                </Button>
                                <Button
                                  size="sm"
                                  intent="ghost"
                                  aria-label="Remover tarefa"
                                  onClick={() => onDelete(task)}
                                  disabled={remove.isPending}
                                >
                                  <Trash2 size={14} strokeWidth={2} />
                                </Button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-start justify-between gap-3 border-t border-border pt-4">
            <div>
              {canManage && data && (
                <>
                  <Button
                    intent="danger"
                    onClick={onDeleteTemplate}
                    loading={deleteTemplate.isPending}
                    disabled={planCount > 0 || deleteTemplate.isPending}
                  >
                    Apagar template
                  </Button>
                  {planCount > 0 && (
                    <p className="mt-1.5 max-w-[18rem] font-body text-xs text-ink-faint">
                      Tem {planCount}{' '}
                      {planCount === 1
                        ? 'plano associado'
                        : 'planos associados'}{' '}
                      — arquive-o em Editar (desligar Template activo) em vez de
                      apagar.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="flex shrink-0 gap-3">
              {canManage && data && (
                <Button intent="secondary" onClick={() => setShowEdit(true)}>
                  Editar
                </Button>
              )}
              <Button intent="ghost" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      {form !== null && (
        <TemplateTaskFormModal
          templateId={templateId}
          task={form.task}
          defaultPhase={form.phase}
          nextSeq={nextSeq}
          onClose={() => setForm(null)}
          onSuccess={() =>
            toast({
              title: form.task ? 'Tarefa actualizada.' : 'Tarefa adicionada.',
              intent: 'success',
            })
          }
        />
      )}

      {showEdit && data && (
        <TemplateFormModal template={data} onClose={() => setShowEdit(false)} />
      )}
    </>
  );
}
