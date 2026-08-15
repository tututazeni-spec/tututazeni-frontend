// components/roi-impact/SimulatorTab.tsx
// Tab "Simulador": what-if de taxa de conclusão vs. ROI projectado.
// Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { useState } from 'react';
import { Brain } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { fmt$ } from './utils';
import type { SimulateResult } from './types';

export function SimulatorTab() {
  const [targetRate, setTargetRate] = useState(80);

  const simulateMutation = useApiMutation((rate: number) =>
    apiClient.post<SimulateResult>('/roi-impact/simulate', {
      targetCompletionRate: rate,
    }),
  );
  const result = simulateMutation.data ?? null;
  const loading = simulateMutation.isPending;

  const run = () => simulateMutation.mutate(targetRate);

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="p-5">
          <h4 className="mb-4 flex items-center gap-2 font-display font-semibold text-ink">
            <Brain size={16} strokeWidth={1.75} className="text-accent" />
            Simulador What-If — Impacto de Taxa de Conclusão
          </h4>
          <div className="mb-4 flex items-center gap-4">
            <label className="shrink-0 font-body text-sm text-ink-muted">Meta de Conclusão:</label>
            <input
              type="range"
              min={10}
              max={100}
              value={targetRate}
              onChange={(e) => setTargetRate(+e.target.value)}
              className="flex-1 accent-primary"
            />
            <span className="w-14 text-right font-display text-xl font-bold text-accent">
              {targetRate}%
            </span>
          </div>
          <Button onClick={run} loading={loading} className="w-full">
            {loading ? 'A calcular…' : 'Calcular Impacto'}
          </Button>
        </CardBody>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Narrative */}
          <div className="rounded-card border border-accent-subtle bg-accent-subtle p-5">
            <p className="font-body text-sm leading-relaxed text-accent">💡 {result.narrative}</p>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Estado Actual', data: result.current, border: 'border-border' },
              { label: `Com ${targetRate}% conclusão`, data: result.projected, border: 'border-accent' },
            ].map((item) => (
              <div key={item.label} className={cn('rounded-card border-2 bg-surface p-4', item.border)}>
                <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {item.label}
                </p>
                {[
                  { label: 'Taxa Conclusão', value: `${item.data.completionRate ?? 0}%` },
                  { label: 'Custo', value: fmt$(item.data.cost ?? 0) },
                  { label: 'Benefício', value: fmt$(item.data.benefit ?? 0) },
                  { label: 'ROI', value: `${item.data.roi ?? 0}%` },
                ].map((m) => (
                  <div key={m.label} className="flex justify-between py-0.5 font-body text-xs">
                    <span className="text-ink-muted">{m.label}</span>
                    <span className="font-semibold text-ink">{m.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Delta */}
          <Card>
            <CardBody>
              <p className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Impacto Projectado
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'ROI Lift',
                    value: `${result.delta.roiLift >= 0 ? '+' : ''}${result.delta.roiLift}pts`,
                    color: result.delta.roiLift >= 0 ? 'text-success-ink' : 'text-danger-ink',
                  },
                  {
                    label: 'Benefício Extra',
                    value: fmt$(result.delta.benefitDelta),
                    color: result.delta.benefitDelta >= 0 ? 'text-success-ink' : 'text-danger-ink',
                  },
                  {
                    label: 'Custo Delta',
                    value: fmt$(result.delta.costDelta),
                    color: 'text-ink',
                  },
                ].map((d) => (
                  <div key={d.label} className="rounded-control bg-surface-sunken p-2 text-center">
                    <p className={cn('font-display text-xl font-bold', d.color)}>{d.value}</p>
                    <p className="font-body text-[10px] text-ink-faint">{d.label}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
