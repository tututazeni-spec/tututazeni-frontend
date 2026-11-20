// components/onboarding/AssignTaskModal.tsx
// Atribui (ou remove) a pessoa responsável por uma tarefa de um plano de
// integração. PATCH /onboarding/tasks/:taskId/assignee — só ADMIN/RH.
// Só se pode atribuir a quem faz parte do plano: colaborador, gestor, buddy
// ou RH responsável.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import type { OnboardingPlanDetail } from './types';

export interface PlanMemberOption {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  roleLabel: string;
}

interface PlanPeople {
  user: { id: number; fullName: string; avatarUrl: string | null };
  manager?: { id: number; fullName: string; avatarUrl: string | null } | null;
  buddy?: { id: number; fullName: string; avatarUrl: string | null } | null;
  hrResponsible?: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}

/** Pessoas do plano a quem uma tarefa pode ser atribuída. */
export function planMemberOptions(plan: PlanPeople): PlanMemberOption[] {
  const out: PlanMemberOption[] = [
    {
      id: plan.user.id,
      fullName: plan.user.fullName,
      avatarUrl: plan.user.avatarUrl,
      roleLabel: 'Colaborador',
    },
  ];
  if (plan.manager) {
    out.push({
      id: plan.manager.id,
      fullName: plan.manager.fullName,
      avatarUrl: plan.manager.avatarUrl,
      roleLabel: 'Gestor directo',
    });
  }
  if (plan.buddy) {
    out.push({
      id: plan.buddy.id,
      fullName: plan.buddy.fullName,
      avatarUrl: plan.buddy.avatarUrl,
      roleLabel: 'Buddy / mentor',
    });
  }
  if (plan.hrResponsible) {
    out.push({
      id: plan.hrResponsible.id,
      fullName: plan.hrResponsible.fullName,
      avatarUrl: plan.hrResponsible.avatarUrl ?? null,
      roleLabel: 'RH responsável',
    });
  }
  return out;
}

export interface AssignTaskModalProps {
  taskId: number;
  planId: number;
  taskTitle: string;
  currentAssigneeId: number | null;
  onClose: () => void;
}

export function AssignTaskModal({
  taskId,
  planId,
  taskTitle,
  currentAssigneeId,
  onClose,
}: AssignTaskModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');
  const { data: plan, isLoading } = useApiQuery<OnboardingPlanDetail>(
    queryKeys.onboarding.plan(planId),
    `/onboarding/${planId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const members = plan ? planMemberOptions(plan) : [];

  const save = useApiMutation(
    (assigneeId: number | null) =>
      apiClient.patch(`/onboarding/tasks/${taskId}/assignee`, { assigneeId }),
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: (_d, assigneeId) => {
        notify({
          title:
            assigneeId === null ? 'Atribuição removida' : 'Tarefa atribuída',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setError(e.message || 'Erro ao guardar. Tente novamente.'),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Atribuir tarefa"
        description={`«${taskTitle}» — escolhe quem fica responsável, entre as pessoas deste plano.`}
        className="max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-3">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <div className="max-h-64 overflow-y-auto rounded-card border border-border bg-surface">
            {isLoading && (
              <div className="px-3 py-2 text-sm text-ink-muted">
                A carregar…
              </div>
            )}
            {members.map((m) => (
              <Button
                key={m.id}
                intent="ghost"
                disabled={save.isPending || m.id === currentAssigneeId}
                onClick={() => {
                  setError('');
                  save.mutate(m.id);
                }}
                className="h-auto w-full justify-start gap-2 rounded-none px-3 py-2 text-left"
              >
                <Avatar
                  name={m.fullName}
                  url={m.avatarUrl ?? undefined}
                  size="sm"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">
                    {m.fullName}
                    {m.id === currentAssigneeId ? ' (actual)' : ''}
                  </span>
                  <span className="block truncate text-xs text-ink-faint">
                    {m.roleLabel}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          {currentAssigneeId !== null ? (
            <Button
              intent="danger"
              disabled={save.isPending}
              onClick={() => {
                setError('');
                save.mutate(null);
              }}
            >
              Remover
            </Button>
          ) : (
            <span />
          )}
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
