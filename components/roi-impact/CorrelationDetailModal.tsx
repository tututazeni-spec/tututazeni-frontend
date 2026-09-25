// components/roi-impact/CorrelationDetailModal.tsx
// Detalhe de uma correlação executada (docs/roi-impact.md §7): variáveis,
// período, amostra, coeficiente, significância e gráfico de dispersão —
// sempre com o aviso de que correlação não implica causalidade.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScatterPlot } from './ScatterPlot';
import { correlationStrengthLabel } from './utils';
import type { CorrelationDetail } from './types';

export interface CorrelationDetailModalProps {
  id: number;
  onClose: () => void;
}

function fmtDate(v: string | null): string {
  return v ? new Date(v).toLocaleDateString('pt-PT') : '—';
}

export function CorrelationDetailModal({ id, onClose }: CorrelationDetailModalProps) {
  const { data, isLoading } = useApiQuery<CorrelationDetail>(
    queryKeys.roiImpact.correlation(id),
    `/roi-impact/correlations/${id}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.label ?? 'Correlação'}
        description="docs/roi-impact.md §7 — Correlações"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {isLoading || !data ? (
          <Skeleton rows={4} wrapperClassName="space-y-3 animate-pulse" itemClassName="h-10 rounded-card bg-surface-sunken" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-ink-faint text-[10px]">Período</p>
                <p className="text-ink">
                  {fmtDate(data.periodStart)} — {fmtDate(data.periodEnd)}
                </p>
              </div>
              <div>
                <p className="text-ink-faint text-[10px]">Amostra</p>
                <p className="text-ink">{data.sampleSize}</p>
              </div>
              <div>
                <p className="text-ink-faint text-[10px]">Coeficiente</p>
                <p className="text-ink">
                  {data.coefficient != null ? (
                    <>
                      {data.coefficient} <span className="text-ink-faint">({correlationStrengthLabel(data.coefficient)})</span>
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <p className="text-ink-faint text-[10px]">Significância</p>
                <p className="text-ink">
                  {data.pValue != null ? (
                    <Badge intent={data.significant ? 'success' : 'warning'}>
                      p = {data.pValue} {data.significant ? '(significativo)' : '(não significativo)'}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-ink-faint">
              <p>Variável X: {data.xLabel}</p>
              <p>Variável Y: {data.yLabel}</p>
            </div>

            {data.dataPoints.length > 0 ? (
              <ScatterPlot points={data.dataPoints} xLabel={data.xLabel} yLabel={data.yLabel} />
            ) : (
              <p className="rounded-card bg-surface-sunken p-4 text-center text-sm text-ink-faint">
                Sem pontos suficientes para desenhar o gráfico de dispersão.
              </p>
            )}

            {data.note && (
              <p className="rounded-card bg-surface-sunken p-3 font-body text-xs text-ink-faint">{data.note}</p>
            )}

            <p className="rounded-card bg-warning-subtle p-3 font-body text-xs text-warning-ink">
              Correlação não implica causalidade — leitura interpretativa, nunca automática.
            </p>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
