// components/roi-impact/EvaluationModelsTab.tsx
// Tab "Modelos de Avaliação" (docs/roi-impact.md §4): biblioteca de
// metodologias (Kirkpatrick/Phillips/personalizado) usadas para medir
// impacto/ROI. O modelo por omissão ("Kirkpatrick + Phillips (padrão)") é
// semeado em prisma/seed.ts, não aqui — esta tab só lista/edita o que a API
// devolve.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { RoiEvaluationModelModal } from './RoiEvaluationModelModal';
import { INITIATIVE_TYPE_LABELS, ROI_MODEL_STATUS_INTENTS, ROI_MODEL_STATUS_LABELS } from './utils';
import type { RoiEvaluationModelRow } from './types';

export function EvaluationModelsTab() {
  const notify = useToast();
  const [modalModel, setModalModel] = useState<RoiEvaluationModelRow | 'new' | null>(null);

  const { data: models, isLoading: loading } = useApiQuery<RoiEvaluationModelRow[]>(
    queryKeys.roiImpact.evaluationModels(),
    '/roi-impact/evaluation-models',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const toggleStatus = useApiMutation(
    (m: RoiEvaluationModelRow) =>
      apiClient.patch(`/roi-impact/evaluation-models/${m.id}`, {
        status: m.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO',
      }),
    {
      invalidateKeys: [queryKeys.roiImpact.evaluationModels()],
      onSuccess: () => notify({ title: 'Estado actualizado', intent: 'success' }),
      onError: (e) => notify({ title: 'Erro ao actualizar', description: e.message, intent: 'danger' }),
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
          {rows.length} modelo(s) — metodologia usada para medir impacto/ROI com rigor e comparabilidade
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
        <div className="space-y-3">
          {rows.map((m) => (
            <Card key={m.id}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-sm font-semibold text-ink">{m.name}</h4>
                      <Badge intent={ROI_MODEL_STATUS_INTENTS[m.status] ?? 'neutral'}>
                        {ROI_MODEL_STATUS_LABELS[m.status] ?? m.status}
                      </Badge>
                    </div>
                    {m.description && (
                      <p className="mt-1 font-body text-xs text-ink-faint">{m.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" intent="secondary" onClick={() => setModalModel(m)}>
                      Editar
                    </Button>
                    <Button size="sm" intent="secondary" onClick={() => toggleStatus.mutate(m)}>
                      {m.status === 'ACTIVO' ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.levels.map((l) => (
                    <Badge key={l.level} intent={l.mandatory ? 'info' : 'neutral'}>
                      L{l.level} {l.name} ({l.weight}%)
                    </Badge>
                  ))}
                </div>

                {m.applicability && (
                  <p className="mt-2 font-body text-[11px] text-ink-faint">
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
              </div>
            </Card>
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
