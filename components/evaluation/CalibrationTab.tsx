// components/evaluation/CalibrationTab.tsx
// Separador "Calibração" — pesquisa por ciclo, alerta de avaliadores com
// viés e ajuste manual de scores. Dados próprios (useApiMutation, pesquisa
// manual por ID) + apresentação. Extraído de
// app/(platform)/evaluation/page.tsx.

'use client';

import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { SCORE_COLOR } from './constants';
import type { CalibrationData } from './types';

export function CalibrationTab() {
  const notify = useToast();
  const [cycleId, setCycleId] = useState('');

  const loadCalibration = useApiMutation((id: string) =>
    apiClient.get<CalibrationData>(`/evaluations/calibration/${id}`),
  );
  const data = loadCalibration.data ?? null;
  const loading = loadCalibration.isPending;

  const load = () => {
    if (cycleId) loadCalibration.mutate(cycleId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="flex gap-3">
          <Input
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            placeholder="ID do ciclo..."
            className="w-48"
          />
          <Button onClick={load}>Abrir Calibração</Button>
        </CardBody>
      </Card>

      {loading && (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      )}

      {!loading && data && (
        <div className="space-y-4">
          {/* Biased evaluators alert */}
          {(data.biasedEvaluators ?? []).length > 0 && (
            <div className="bg-warning-subtle border border-warning rounded-card p-4">
              <p className="text-sm font-semibold text-warning-ink mb-2">
                <AlertTriangle
                  size={14}
                  strokeWidth={1.75}
                  className="inline align-[-2px]"
                />{' '}
                {data.biasedEvaluators?.length} avaliadores com viés detectado
              </p>
              <div className="space-y-1">
                {(data.biasedEvaluators ?? []).map((e, i) => (
                  <p key={i} className="text-xs text-warning-ink">
                    Avaliador #{e.evaluatorId}: média {e.avg.toFixed(1)} (desvio{' '}
                    {e.deviation > 0 ? '+' : ''}
                    {e.deviation.toFixed(2)})
                    {e.deviation > 0
                      ? ' — muito generoso'
                      : ' — muito rigoroso'}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Participants ranking */}
          <Card>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h4 className="font-display font-semibold text-ink">
                Participantes para Calibração
              </h4>
              <span className="text-xs text-ink-faint">
                Média global: {data.globalAvg?.toFixed(2)}
              </span>
            </div>
            <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
              {(data.participants ?? []).map((p, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-faint w-5 text-right">
                    #{i + 1}
                  </span>
                  <Avatar
                    name={p.evaluated?.fullName ?? '?'}
                    url={p.evaluated?.avatarUrl}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">
                      {p.evaluated?.fullName}
                    </p>
                    <p className="text-xs text-ink-faint">
                      {p.evaluated?.position?.name} ·{' '}
                      {p.evaluated?.department?.name}
                    </p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-sm font-bold ${SCORE_COLOR(p.avgScore)}`}
                    >
                      {p.avgScore.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-ink-faint">
                      P{p.percentile}
                    </p>
                  </div>
                  {(p.dispersion ?? 0) > 1 && (
                    <span className="text-[10px] bg-danger-subtle text-danger-ink px-1.5 py-0.5 rounded">
                      ±{p.dispersion?.toFixed(1)}
                    </span>
                  )}
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    defaultValue={p.avgScore}
                    className="w-16 text-center"
                    onBlur={async (e) => {
                      const val = parseFloat(e.target.value);
                      if (val >= 0 && val <= 5 && val !== p.avgScore) {
                        try {
                          await apiClient.post(
                            `/evaluations/calibration/${cycleId}/calibrate`,
                            {
                              evaluatedId: p.evaluated.id,
                              calibratedScore: val,
                            },
                          );
                        } catch (err) {
                          reportError(err, {
                            source: 'CalibrationTab.calibrate',
                          });
                          notify({
                            title: 'Não foi possível calibrar o score',
                            intent: 'danger',
                          });
                        }
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
