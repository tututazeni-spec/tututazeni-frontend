// components/evaluation/ModelsTab.tsx
// Separador "Modelos" (docs/modulo_evaluation.md pt.4) — biblioteca de
// modelos de avaliação (critérios+pesos+escala), usados pelo ciclo/wizard
// "Nova Avaliação". Os critérios criam-se a partir do menu de três pontos de cada modelo.

'use client';

import { useState } from 'react';
import { Layers, MoreVertical, Plus, Power, Tag } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useHasRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ADMIN_ROLES } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { NavyBadge, NavyCard } from '@/components/courses/NavyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { CriteriaFormModal } from './CriteriaFormModal';
import { TemplateFormModal } from './TemplateFormModal';
import type { EvalTemplate } from './types';

export function ModelsTab() {
  const isAdmin = useHasRole(ADMIN_ROLES);
  const notify = useToast();
  const confirm = useConfirm();

  const { data: templates = [], isLoading: loading } = useApiQuery<
    EvalTemplate[]
  >(queryKeys.evaluation.templates(), '/evaluations/templates', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  // 'new' = modal aberto para criar; um id = a editar (a lista só traz
  // `_count.criteria`, por isso busca-se o detalhe completo — com os links
  // criteriaId+weight — antes de montar o modal).
  const [editingId, setEditingId] = useState<number | 'new' | undefined>(
    undefined,
  );
  const { data: editingDetail } = useApiQuery<EvalTemplate>(
    queryKeys.evaluation.templateDetail(
      typeof editingId === 'number' ? editingId : 0,
    ),
    `/evaluations/templates/${editingId}`,
    { enabled: typeof editingId === 'number' },
  );

  // Modelo a que o novo critério vai ficar ligado (detalhe completo, com os
  // critérios já ligados, porque o PATCH do modelo substitui a lista).
  const [criterionFor, setCriterionFor] = useState<EvalTemplate | undefined>(
    undefined,
  );
  const openNewCriterion = async (t: EvalTemplate) => {
    try {
      setCriterionFor(
        await apiClient.get<EvalTemplate>(`/evaluations/templates/${t.id}`),
      );
    } catch {
      notify({ title: 'Não foi possível abrir o modelo', intent: 'danger' });
    }
  };

  const toggleActive = useApiMutation(
    (t: EvalTemplate) =>
      apiClient.patch(`/evaluations/templates/${t.id}`, {
        isActive: !t.isActive,
      }),
    {
      invalidateKeys: [queryKeys.evaluation.templates()],
      onSuccess: () =>
        notify({ title: 'Estado do modelo actualizado', intent: 'success' }),
      onError: () =>
        notify({
          title: 'Não foi possível alterar o estado do modelo',
          intent: 'danger',
        }),
    },
  );

  const remove = async (t: EvalTemplate) => {
    if (
      await confirm({
        title: `Remover o modelo "${t.name}"?`,
        message: 'Ciclos já criados a partir deste modelo não são afectados.',
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      try {
        await apiClient.delete(`/evaluations/templates/${t.id}`);
        notify({ title: 'Modelo removido', intent: 'success' });
      } catch {
        notify({
          title: 'Não foi possível remover o modelo',
          intent: 'danger',
        });
      }
    }
  };

  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-ink">
          Modelos de Avaliação
        </h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setEditingId('new')}>
            <Plus size={16} strokeWidth={1.75} /> Novo Modelo
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="Sem modelos criados"
          description="Cria um modelo para reutilizar em ciclos e avaliações."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {templates.map((t) => (
            <NavyCard
              key={t.id}
              seed={t.id}
              kicker="Modelo"
              kickerIcon={Layers}
              title={t.name}
              subtitle={t.description || undefined}
              badge={
                <>
                  {t.isDefault && (
                    <NavyBadge tone="success">Por omissão</NavyBadge>
                  )}
                  {!t.isActive && (
                    <NavyBadge tone="neutral">Inactivo</NavyBadge>
                  )}
                </>
              }
              infos={[
                {
                  icon: Layers,
                  value: String(t._count?.criteria ?? t.criteria?.length ?? 0),
                  label: 'Critérios',
                },
                { icon: Tag, value: t.type, label: 'Tipo' },
              ]}
              actions={
                isAdmin && (
                  <>
                    <Button
                      type="button"
                      intent="onDarkGhost"
                      size="sm"
                      aria-label={`${t.isActive ? 'Desactivar' : 'Activar'} ${t.name}`}
                      title={t.isActive ? 'Desactivar' : 'Activar'}
                      onClick={() => toggleActive.mutate(t)}
                    >
                      <Power size={15} strokeWidth={1.75} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          intent="onDarkGhost"
                          size="icon"
                          aria-label={`Mais opções de ${t.name}`}
                          title="Mais opções"
                        >
                          <MoreVertical size={15} strokeWidth={1.75} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => void openNewCriterion(t)}
                        >
                          Novo critério de avaliação
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditingId(t.id)}>
                          Editar modelo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-danger-ink"
                          onSelect={() => void remove(t)}
                        >
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )
              }
            />
          ))}
        </div>
      )}

      {criterionFor && (
        <CriteriaFormModal
          template={criterionFor}
          onClose={() => setCriterionFor(undefined)}
        />
      )}
      {editingId === 'new' && (
        <TemplateFormModal
          template={null}
          onClose={() => setEditingId(undefined)}
        />
      )}
      {typeof editingId === 'number' && editingDetail && (
        <TemplateFormModal
          template={editingDetail}
          onClose={() => setEditingId(undefined)}
        />
      )}
    </div>
  );
}
