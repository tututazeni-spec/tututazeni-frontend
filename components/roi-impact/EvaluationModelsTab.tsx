// components/roi-impact/EvaluationModelsTab.tsx
// Tab "Modelos de Avaliação" (docs/roi-impact.md §4): biblioteca de
// metodologias (Kirkpatrick/Phillips/personalizado) usadas para medir
// impacto/ROI. O modelo por omissão ("Kirkpatrick + Phillips (padrão)") é
// semeado em prisma/seed.ts, não aqui — esta tab só lista/edita o que a API
// devolve.

'use client';

import { useState } from 'react';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { NavyPanel } from './NavyPanel';
import { RoiEvaluationModelModal } from './RoiEvaluationModelModal';
import { INITIATIVE_TYPE_LABELS, ROI_MODEL_STATUS_LABELS } from './utils';
import type { RoiEvaluationModelRow } from './types';

export function EvaluationModelsTab() {
  const notify = useToast();
  const [modalModel, setModalModel] = useState<
    RoiEvaluationModelRow | 'new' | null
  >(null);

  const { data: models, isLoading: loading } = useApiQuery<
    RoiEvaluationModelRow[]
  >(queryKeys.roiImpact.evaluationModels(), '/roi-impact/evaluation-models', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  const toggleStatus = useApiMutation(
    (m: RoiEvaluationModelRow) =>
      apiClient.patch(`/roi-impact/evaluation-models/${m.id}`, {
        status: m.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO',
      }),
    {
      invalidateKeys: [queryKeys.roiImpact.evaluationModels()],
      onSuccess: () =>
        notify({ title: 'Estado actualizado', intent: 'success' }),
      onError: (e) =>
        notify({
          title: 'Erro ao actualizar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const rows = models ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-ink-muted">
          {rows.length} modelo(s) — metodologia usada para medir impacto/ROI com
          rigor e comparabilidade
        </p>
        <Button size="sm" onClick={() => setModalModel('new')}>
          <Plus size={14} strokeWidth={1.75} className="mr-1" />
          Novo Modelo
        </Button>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Sem modelos de avaliação ainda"
            description="Cria o primeiro modelo para configurar a metodologia usada nas análises de ROI."
            className="border-none"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((m) => (
            <NavyPanel
              key={m.id}
              variant={m.id}
              soft
              className="flex min-w-0 flex-col"
              title={m.name}
              icon={ClipboardCheck}
              aside={
                <span className="rounded-full bg-white/10 px-3 py-1 font-body text-xs font-semibold">
                  {ROI_MODEL_STATUS_LABELS[m.status] ?? m.status}
                </span>
              }
            >
              {m.description && (
                <p className="-mt-2 mb-3 font-body text-xs font-medium text-white/90">
                  {m.description}
                </p>
              )}

              <ul className="flex flex-wrap gap-1.5">
                {m.levels.map((l) => (
                  <li
                    key={l.level}
                    className={cn(
                      'rounded-full px-2.5 py-1 font-body text-[11px] font-semibold text-white',
                      l.mandatory
                        ? 'bg-white/25'
                        : 'border border-white/25 bg-white/5',
                    )}
                  >
                    L{l.level} {l.name} ({l.weight}%)
                  </li>
                ))}
              </ul>

              {m.applicability && (
                <p className="mt-3 font-body text-[11px] font-medium text-white/80">
                  Aplicável a:{' '}
                  {[
                    m.applicability.initiativeTypes
                      ?.map((t) => INITIATIVE_TYPE_LABELS[t] ?? t)
                      .join(', '),
                    m.applicability.criticality?.join(', '),
                    m.applicability.minCost != null
                      ? `custo ≥ AOA ${m.applicability.minCost.toLocaleString()}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'todas as iniciativas'}
                </p>
              )}

              <div className="mt-auto flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalModel(m)}
                  className="rounded-full border border-white/40 px-2.5 py-0.5 font-body text-[11px] font-medium text-white/90 transition-colors hover:border-white hover:bg-white/15 hover:text-white disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={toggleStatus.isPending}
                  onClick={() => toggleStatus.mutate(m)}
                  className="rounded-full border border-white/40 px-2.5 py-0.5 font-body text-[11px] font-medium text-white/90 transition-colors hover:border-white hover:bg-white/15 hover:text-white disabled:opacity-40"
                >
                  {m.status === 'ACTIVO' ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </NavyPanel>
          ))}
        </div>
      )}

      {modalModel && (
        <RoiEvaluationModelModal
          model={modalModel === 'new' ? undefined : modalModel}
          onClose={() => setModalModel(null)}
        />
      )}
    </div>
  );
}
