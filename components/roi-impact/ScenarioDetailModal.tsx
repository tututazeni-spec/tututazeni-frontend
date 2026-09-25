// components/roi-impact/ScenarioDetailModal.tsx
// Detalhe de um cenário simulado (docs/roi-impact.md §8): custo/benefício
// esperado, proveniência do benefício (análise de referência ou premissa
// manual) e as três projecções Otimista/Realista/Pessimista.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { fmt$, INITIATIVE_TYPE_LABELS, SCENARIO_CASE_INTENTS, SCENARIO_CASE_LABELS } from './utils';
import type { ScenarioDetail, ScenarioProjections } from './types';

export interface ScenarioDetailModalProps {
  id: number;
  onClose: () => void;
}

export function ScenarioDetailModal({ id, onClose }: ScenarioDetailModalProps) {
  const { data, isLoading } = useApiQuery<ScenarioDetail>(
    queryKeys.roiImpact.scenario(id),
    `/roi-impact/scenarios/${id}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.name ?? 'Cenário'}
        description="docs/roi-impact.md §8 — Cenários & Simulações"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {isLoading || !data ? (
          <Skeleton rows={4} wrapperClassName="space-y-3 animate-pulse" itemClassName="h-10 rounded-card bg-surface-sunken" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-ink-faint text-[10px]">Iniciativa</p>
                <p className="text-ink">{INITIATIVE_TYPE_LABELS[data.initiativeType] ?? data.initiativeType}</p>
              </div>
              <div>
                <p className="text-ink-faint text-[10px]">Público-alvo</p>
                <p className="text-ink">{data.targetAudienceCount ?? '—'} colaborador(es)</p>
              </div>
              <div>
                <p className="text-ink-faint text-[10px]">Custo estimado</p>
                <p className="text-ink">{fmt$(data.estimatedCost)}</p>
              </div>
              <div>
                <p className="text-ink-faint text-[10px]">Benefício esperado</p>
                <p className="text-ink">{data.expectedBenefit != null ? fmt$(data.expectedBenefit) : '—'}</p>
              </div>
            </div>

            {data.description && <p className="text-sm text-ink">{data.description}</p>}

            {data.basedOnAnalysis && (
              <div className="rounded-card border border-border bg-surface-sunken p-3 text-xs text-ink-muted">
                Benefício projectado a partir da análise de ROI{' '}
                <span className="font-medium text-ink">{data.basedOnAnalysis.name}</span>
                {data.basedOnAnalysis.roiPercent != null && (
                  <> (ROI medido: {data.basedOnAnalysis.roiPercent}%)</>
                )}
                .
              </div>
            )}

            {data.projections ? (
              <div className="overflow-x-auto rounded-card border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-sunken text-left text-xs text-ink-faint">
                      <th className="px-3 py-2">Cenário</th>
                      <th className="px-3 py-2">Custo</th>
                      <th className="px-3 py-2">Benefício</th>
                      <th className="px-3 py-2">ROI</th>
                      <th className="px-3 py-2">Payback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(data.projections) as (keyof ScenarioProjections)[]).map((k) => {
                      const p = data.projections![k];
                      return (
                        <tr key={k} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">
                            <Badge intent={SCENARIO_CASE_INTENTS[k]}>{SCENARIO_CASE_LABELS[k]}</Badge>
                          </td>
                          <td className="px-3 py-2 text-ink">{fmt$(p.cost)}</td>
                          <td className="px-3 py-2 text-ink">{fmt$(p.benefit)}</td>
                          <td className="px-3 py-2 font-semibold text-ink">{p.roiPercent}%</td>
                          <td className="px-3 py-2 text-ink">
                            {p.paybackMonths != null ? `${p.paybackMonths} meses` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-card bg-warning-subtle p-3 text-xs text-warning-ink">
                Sem projecção calculada — falta benefício esperado.
              </p>
            )}

            {data.assumptions && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Premissas assumidas
                </p>
                <p className="text-sm text-ink">{data.assumptions}</p>
              </div>
            )}

            {data.note && (
              <p className="rounded-card bg-surface-sunken p-3 font-body text-xs text-ink-faint">{data.note}</p>
            )}
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
