// components/performance/CyclesTab.tsx
// Separador "Ciclos" — criar e activar avaliações de desempenho (departamento
// específico ou todos). Só chega aqui quem tem EVAL_CREATOR_ROLES (ADMIN,
// GESTOR, RH, DIRECTOR, LIDER) — ver NAV em constants.ts e o guard em
// app/(platform)/performance/page.tsx (não só escondido, nem montado para
// quem não tem o papel).

'use client';

import { useState } from 'react';
import { CalendarClock, Layers, PlayCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDate as fmtDate } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CreatePerformanceCycleModal } from './CreatePerformanceCycleModal';
import type { Cycle } from './types';

const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  PLANNED: 'neutral',
  ACTIVE: 'success',
  CLOSED: 'warning',
  CANCELLED: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Rascunho',
  ACTIVE: 'Activo',
  CLOSED: 'Encerrado',
  CANCELLED: 'Cancelado',
};

export function CyclesTab() {
  const notify = useToast();
  const confirm = useConfirm();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useApiQuery<Cycle[]>(queryKeys.performance.cycles(), '/performance/cycles');
  const cycles = data ?? [];

  const activate = useApiMutation(
    (id: number) => apiClient.patch(`/performance/cycles/${id}/activate`),
    {
      invalidateKeys: [queryKeys.performance.cycles(), queryKeys.performance.currentCycle()],
      onSuccess: () => notify({ title: 'Ciclo activado — população-alvo inscrita e notificada', intent: 'success' }),
    },
  );

  const handleActivate = async (cycle: Cycle) => {
    const ok = await confirm({
      title: 'Activar avaliação',
      message: `Activar "${cycle.name}"? A população-alvo (${
        cycle.targetDepartmentIds.length === 0
          ? 'todos os departamentos'
          : `${cycle.targetDepartmentIds.length} departamento(s)`
      }) é inscrita e notificada de imediato.`,
    });
    if (ok) activate.mutate(cycle.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Layers size={14} strokeWidth={1.75} />
          Nova Avaliação
        </Button>
      </div>

      {isLoading && <Skeleton />}

      {!isLoading && cycles.length === 0 && (
        <EmptyState
          icon={Layers}
          title="Sem ciclos de avaliação"
          description="Cria a primeira avaliação de desempenho para um departamento específico ou para todos."
          action={{ label: 'Nova Avaliação', onClick: () => setShowCreate(true) }}
        />
      )}

      <div className="space-y-3">
        {cycles.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 rounded-card border border-border bg-surface p-5"
          >
            <div className="flex-1">
              <div className="mb-0.5 flex items-center gap-2 text-sm font-semibold text-ink">
                {c.name}
                {c.code && <span className="text-xs font-normal text-ink-faint">({c.code})</span>}
                <Badge intent={STATUS_INTENT[c.status]}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={12} strokeWidth={1.75} />
                  {fmtDate(c.startDate)} → {fmtDate(c.endDate)}
                </span>
                <span>{c._count.reviews} avaliações</span>
                <span>
                  {c.targetDepartmentIds.length === 0
                    ? 'Todos os departamentos'
                    : `${c.targetDepartmentIds.length} departamento(s)`}
                </span>
                <span>
                  Pesos: {c.goalsWeight}/{c.competenciesWeight}/{c.behaviorsWeight}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.status === 'PLANNED' && (
                <Button size="sm" onClick={() => handleActivate(c)} loading={activate.isPending}>
                  <PlayCircle size={14} strokeWidth={1.75} />
                  Activar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreatePerformanceCycleModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
