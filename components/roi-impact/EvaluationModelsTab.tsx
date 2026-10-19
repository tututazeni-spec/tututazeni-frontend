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
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { EventBadge } from '@/components/events/EventBadges';
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
          {rows.map((m) => {
            const palette = PALETTE[Math.abs(m.id) % PALETTE.length];
            return (
              <div
                key={m.id}
                className="relative min-w-0 overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]"
              >
                <div
                  aria-hidden
                  className="absolute right-0 top-0 hidden h-[58%] w-[26%] items-center justify-center text-white/70 sm:flex"
                  style={{
                    clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
                    background: `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
                  }}
                >
                  <ClipboardCheck size={44} strokeWidth={1.25} />
                </div>

                <div className="relative space-y-5 p-6 sm:pr-[28%]">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventBadge
                      color={m.status === 'ACTIVO' ? '#16A765' : '#64748B'}
                    >
                      {ROI_MODEL_STATUS_LABELS[m.status] ?? m.status}
                    </EventBadge>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      aria-hidden
                      className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: palette[3] }}
                    >
                      <ClipboardCheck size={28} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="break-words font-display text-[24px] font-bold leading-tight text-[#0F1F3D]">
                        {m.name}
                      </h3>
                      {m.description && (
                        <p className="mt-0.5 break-words text-base text-[#49658A]">
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <ul className="flex flex-wrap gap-2">
                    {m.levels.map((l) => (
                      <li
                        key={l.level}
                        className={cn(
                          'rounded-full border px-3 py-1 font-body text-xs font-semibold',
                          l.mandatory
                            ? 'border-[#0F1F3D] bg-[#0F1F3D] text-white'
                            : 'border-[#D8E2F0] bg-white text-[#0F1F3D]',
                        )}
                      >
                        L{l.level} {l.name} ({l.weight}%)
                      </li>
                    ))}
                  </ul>

                  {m.applicability && (
                    <p className="font-body text-xs text-[#49658A]">
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

                  <div className="flex items-center justify-end gap-2 border-t border-[#E6ECF4] pt-4">
                    <Button
                      size="sm"
                      intent="secondary"
                      onClick={() => setModalModel(m)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      disabled={toggleStatus.isPending}
                      onClick={() => toggleStatus.mutate(m)}
                    >
                      {m.status === 'ACTIVO' ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
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
