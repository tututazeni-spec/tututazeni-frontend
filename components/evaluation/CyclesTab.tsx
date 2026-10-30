// components/evaluation/CyclesTab.tsx
// Separador "Ciclos" — grelha de ciclos de avaliação + acções de
// publicar/activar. Dados próprios (useApiQuery) + apresentação. Extraído
// de app/(platform)/evaluation/page.tsx.

'use client';

import { useState } from 'react';
import {
  Building2,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_ROLES } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { BadgeProps } from '@/components/ui/Badge';
import { CycleCard } from './CycleCard';
import { CreateCycleModal } from './CreateCycleModal';
import { MODEL_LABEL, STATUS_MAP } from './constants';
import type { Cycle } from './types';
import { formatDateNumeric } from '@/lib/format';

const CYCLE_TONE: Record<string, BadgeProps['intent']> = {
  DRAFT: 'neutral',
  PUBLISHED: 'info',
  ACTIVE: 'success',
  PAUSED: 'warning',
  CALIBRATING: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'neutral',
};

export function CyclesTab() {
  const notify = useToast();
  const [showCreate, setShowCreate] = useState(false);
  // Publicar/Activar/Criar espelham @Roles(ADMIN, RH) de POST
  // /evaluations/cycles(/:id/publish|/activate) (evaluation.controller.ts) —
  // um COLABORADOR pode ver este separador (participa nas suas avaliações),
  // mas não gere o ciclo. Sem isto os botões apareciam para todos e
  // rebentavam com 403 ao clicar.
  const canManageCycle = useHasRole(ADMIN_ROLES);

  // docs/modulo_evaluation.md ponto 3 — Pausar/Encerrar/Reabrir/Enviar
  // lembretes, mesmo padrão de publish/activate já existente (reload após
  // sucesso em vez de invalidação de cache, ver comentário histórico
  // acima destas duas acções).
  const runCycleAction = (
    cycleId: number,
    action: 'publish' | 'activate' | 'pause' | 'close' | 'reopen' | 'remind',
    method: 'POST' | 'PATCH',
  ) => {
    const call = method === 'POST' ? apiClient.post : apiClient.patch;
    call(`/evaluations/cycles/${cycleId}/${action}`, {})
      .then(() => window.location.reload())
      .catch((e) => {
        reportError(e, { source: `CyclesTab.${action}` });
        notify({
          title: e instanceof Error ? e.message : String(e),
          intent: 'danger',
        });
      });
  };

  // Só se elimina um ciclo sem avaliações atribuídas (o backend recusa os
  // restantes); eliminar é lógico, os dados não saem da base de dados.
  const confirm = useConfirm();
  const deleteCycle = useApiMutation<unknown, number>(
    (id) => apiClient.delete(`/evaluations/cycles/${id}`),
    {
      invalidateKeys: [queryKeys.evaluation.cycles()],
      onSuccess: () => notify({ title: 'Ciclo eliminado', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const handleDelete = async (cycle: Cycle) => {
    const ok = await confirm({
      title: 'Eliminar ciclo de avaliação',
      message: `Tens a certeza que queres eliminar "${cycle.name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) deleteCycle.mutate(cycle.id);
  };

  const { data, isLoading: loading } = useApiQuery<{
    data: Cycle[];
    meta: { total: number };
  }>(queryKeys.evaluation.cycles(), '/evaluations/cycles', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-semibold text-ink">
          Ciclos de Avaliação
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-faint">
            {data?.meta.total ?? 0} ciclos
          </span>
          {canManageCycle && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} strokeWidth={1.75} className="mr-1" />
              Novo Ciclo
            </Button>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateCycleModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data?.data.map((cycle) => {
          const participation = cycle.participation ?? {
            total: 0,
            completed: 0,
            rate: 0,
          };
          return (
            <CycleCard
              key={cycle.id}
              seed={cycle.id}
              kicker={MODEL_LABEL[cycle.model] ?? cycle.model}
              kickerIcon={ClipboardList}
              title={cycle.name}
              subtitle={[
                `${formatDateNumeric(cycle.startDate)} → ${formatDateNumeric(cycle.endDate)}`,
                cycle.selfEvalDueDate &&
                  `Autoavaliação até ${formatDateNumeric(cycle.selfEvalDueDate)}`,
                cycle.managerEvalDueDate &&
                  `Gestor até ${formatDateNumeric(cycle.managerEvalDueDate)}`,
              ]
                .filter(Boolean)
                .join(' · ')}
              status={{
                label: STATUS_MAP[cycle.status]?.label ?? cycle.status,
                intent: CYCLE_TONE[cycle.status] ?? 'neutral',
              }}
              infos={[
                {
                  icon: TrendingUp,
                  value: `${participation.rate}%`,
                  label: 'Participação',
                },
                {
                  icon: ClipboardCheck,
                  value: `${participation.completed}/${participation.total}`,
                  label: 'Avaliações',
                },
                {
                  icon: Calendar,
                  value: formatDateNumeric(cycle.startDate),
                  label: 'Início',
                },
                {
                  icon: Building2,
                  value: String(
                    (cycle.targetUnitIds?.length ?? 0) +
                      (cycle.targetDeptIds?.length ?? 0),
                  ),
                  label: 'Unidades/departamentos',
                },
              ]}
              progress={{
                value: Math.round(participation.rate),
                label: 'Participação',
              }}
              footer={
                <>
                  {canManageCycle && cycle.status === 'DRAFT' && (
                    <Button
                      type="button"
                      intent="onDark"
                      size="sm"
                      onClick={() =>
                        runCycleAction(cycle.id, 'publish', 'POST')
                      }
                    >
                      Publicar
                    </Button>
                  )}
                  {canManageCycle && cycle.status === 'PUBLISHED' && (
                    <Button
                      type="button"
                      intent="onDark"
                      size="sm"
                      onClick={() =>
                        runCycleAction(cycle.id, 'activate', 'POST')
                      }
                    >
                      Activar
                    </Button>
                  )}
                  {canManageCycle && cycle.status === 'ACTIVE' && (
                    <>
                      <Button
                        type="button"
                        intent="onDark"
                        size="sm"
                        onClick={() =>
                          runCycleAction(cycle.id, 'pause', 'PATCH')
                        }
                      >
                        Pausar
                      </Button>
                      <Button
                        type="button"
                        intent="onDark"
                        size="sm"
                        onClick={() =>
                          runCycleAction(cycle.id, 'close', 'PATCH')
                        }
                      >
                        Encerrar
                      </Button>
                      <Button
                        type="button"
                        intent="onDark"
                        size="sm"
                        onClick={() =>
                          runCycleAction(cycle.id, 'remind', 'POST')
                        }
                      >
                        Lembretes
                      </Button>
                    </>
                  )}
                  {canManageCycle && participation.total === 0 && (
                    <Button
                      type="button"
                      intent="onDarkGhost"
                      size="sm"
                      disabled={deleteCycle.isPending}
                      onClick={() => void handleDelete(cycle)}
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                      Eliminar
                    </Button>
                  )}
                  {canManageCycle &&
                    (cycle.status === 'PAUSED' ||
                      cycle.status === 'COMPLETED') && (
                      <Button
                        type="button"
                        intent="onDark"
                        size="sm"
                        onClick={() =>
                          runCycleAction(cycle.id, 'reopen', 'PATCH')
                        }
                      >
                        Reabrir
                      </Button>
                    )}
                </>
              }
            />
          );
        })}

        {(data?.data.length ?? 0) === 0 && (
          <EmptyState
            title="Nenhum ciclo criado ainda"
            description="Cria o primeiro ciclo de avaliação para começar."
            className="col-span-1 md:col-span-2 xl:col-span-3"
          />
        )}
      </div>
    </div>
  );
}
