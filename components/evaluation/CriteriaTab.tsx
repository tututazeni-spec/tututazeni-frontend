// components/evaluation/CriteriaTab.tsx
// Separador "Critérios" (docs/modulo_evaluation.md pt.5) — biblioteca
// central de critérios reutilizáveis entre modelos de avaliação. Leitura
// aberta a MGMT_ROLES (espelha @Roles no backend); criar/editar/desactivar
// restrito a ADMIN_ROLES, tal como CyclesTab/EvaluationsTab.

'use client';

import { useState } from 'react';
import {
  Hash,
  ListChecks,
  Pencil,
  Plus,
  Power,
  Ruler,
  Scale,
  Trash2,
} from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ADMIN_ROLES } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  NAVY_ACTION,
  NavyBadge,
  NavyCard,
} from '@/components/courses/NavyCard';
import { CriteriaFormModal } from './CriteriaFormModal';
import type { EvalCriteria } from './types';

export function CriteriaTab() {
  const role = useCurrentRole();
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const notify = useToast();
  const confirm = useConfirm();

  const criteriaParams = { includeInactive: 'true' };
  const { data: criteria = [], isLoading: loading } = useApiQuery<
    EvalCriteria[]
  >(queryKeys.evaluation.criteria(criteriaParams), '/evaluations/criteria', {
    params: criteriaParams,
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  const [editing, setEditing] = useState<EvalCriteria | null | undefined>(
    undefined,
  );

  const toggleActive = useApiMutation(
    (c: EvalCriteria) =>
      apiClient.patch(`/evaluations/criteria/${c.id}`, {
        isActive: !c.isActive,
      }),
    {
      invalidateKeys: [queryKeys.evaluation.criteria()],
      optimistic: {
        key: queryKeys.evaluation.criteria(criteriaParams),
        update: (prev: EvalCriteria[] | undefined, c) =>
          prev?.map((x) =>
            x.id === c.id ? { ...x, isActive: !c.isActive } : x,
          ),
      },
      onSuccess: () =>
        notify({ title: 'Estado do critério actualizado', intent: 'success' }),
    },
  );

  const remove = async (c: EvalCriteria) => {
    if (
      await confirm({
        title: `Remover "${c.name}"?`,
        message:
          'O critério deixa de estar disponível para novos modelos, mas não afecta avaliações já criadas.',
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      try {
        await apiClient.delete(`/evaluations/criteria/${c.id}`);
        notify({ title: 'Critério removido', intent: 'success' });
      } catch {
        notify({
          title: 'Não foi possível remover o critério',
          intent: 'danger',
        });
      }
    }
  };

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-14 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink">
          Critérios — Biblioteca Central
        </h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setEditing(null)}>
            <Plus size={16} strokeWidth={1.75} /> Novo Critério
          </Button>
        )}
      </div>

      {criteria.length === 0 ? (
        <EmptyState
          title="Sem critérios criados"
          description="Cria o primeiro critério para o usar em modelos de avaliação."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {criteria.map((c) => (
            <NavyCard
              key={c.id}
              seed={c.id}
              kicker={c.category ?? 'Critério'}
              kickerIcon={ListChecks}
              title={c.name}
              subtitle={c.description || undefined}
              badge={
                <NavyBadge tone={c.isActive ? 'success' : 'neutral'}>
                  {c.isActive ? 'Activo' : 'Inactivo'}
                </NavyBadge>
              }
              infos={[
                { icon: Scale, value: String(c.weight), label: 'Peso' },
                { icon: Ruler, value: c.scale?.name ?? '—', label: 'Escala' },
                { icon: Hash, value: c.code ?? '—', label: 'Código' },
              ]}
              actions={
                isAdmin && (
                  <>
                    <button
                      type="button"
                      className={NAVY_ACTION}
                      aria-label={`Editar ${c.name}`}
                      title="Editar critério"
                      onClick={() => setEditing(c)}
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={NAVY_ACTION}
                      aria-label={`${c.isActive ? 'Desactivar' : 'Activar'} ${c.name}`}
                      title={c.isActive ? 'Desactivar' : 'Activar'}
                      onClick={() => toggleActive.mutate(c)}
                    >
                      <Power size={15} strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className={NAVY_ACTION}
                      aria-label={`Remover ${c.name}`}
                      title="Remover critério"
                      onClick={() => remove(c)}
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </>
                )
              }
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <CriteriaFormModal
          criteria={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
