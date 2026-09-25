// components/roi-impact/ScenarioCompareModal.tsx
// "Comparação entre cenários alternativos" (docs/roi-impact.md §8) — mesmo
// formato do exemplo do spec (Cenário A vs. Cenário B), ordenados por ROI
// projectado (caso Realista), com o melhor cenário destacado.

'use client';

import { useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { fmt$, INITIATIVE_TYPE_LABELS } from './utils';
import type { ScenarioCompareData } from './types';

export interface ScenarioCompareModalProps {
  ids: number[];
  onClose: () => void;
}

export function ScenarioCompareModal({ ids, onClose }: ScenarioCompareModalProps) {
  const compare = useApiMutation((scenarioIds: number[]) =>
    apiClient.post<ScenarioCompareData>('/roi-impact/scenarios/compare', { ids: scenarioIds }),
  );

  useEffect(() => {
    compare.mutate(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);

  const data = compare.data;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Comparação de Cenários"
        description="docs/roi-impact.md §8 — Cenários & Simulações"
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        {compare.isPending || !data ? (
          <Skeleton rows={2} wrapperClassName="space-y-3 animate-pulse" itemClassName="h-20 rounded-card bg-surface-sunken" />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.scenarios.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  'rounded-card border-2 bg-surface p-4',
                  s.id === data.bestId ? 'border-success' : 'border-border',
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-display text-sm font-semibold text-ink">
                    Cenário {String.fromCharCode(65 + i)}
                  </p>
                  {s.id === data.bestId && (
                    <Badge intent="success">
                      <Trophy size={12} strokeWidth={2} className="mr-1 inline" />
                      Melhor ROI
                    </Badge>
                  )}
                </div>
                <p className="mb-3 text-sm font-medium text-ink">{s.name}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Iniciativa</span>
                    <span className="text-ink">
                      {INITIATIVE_TYPE_LABELS[s.initiativeType] ?? s.initiativeType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Custo estimado</span>
                    <span className="text-ink">{fmt$(s.estimatedCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Benefício esperado</span>
                    <span className="text-ink">
                      {s.expectedBenefit != null ? fmt$(s.expectedBenefit) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">ROI projectado (12 meses)</span>
                    <span className="font-semibold text-ink">
                      {s.roiPercent != null ? `${s.roiPercent}%` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Payback projectado</span>
                    <span className="text-ink">
                      {s.paybackMonths != null ? `${s.paybackMonths} meses` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
