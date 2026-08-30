// components/roi-impact/ExecutiveTab.tsx
// Tab "Executivo": ROI hero, breakdown por domínio, alertas e
// insights automáticos. Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { CONFIDENCE_INTENTS, CONFIDENCE_LABELS, fmt$, ptInsight } from './utils';
import type { ExecutiveData } from './types';

const ALERT_INTENT_CLASSES = {
  danger: {
    card: 'border-danger bg-danger-subtle',
    text: 'text-ink',
  },
  warning: {
    card: 'border-warning bg-warning-subtle',
    text: 'text-ink',
  },
} as const;

export function ExecutiveTab() {
  const { data, isLoading: loading } = useApiQuery<ExecutiveData>(
    queryKeys.roiImpact.executive(),
    '/roi-impact/executive',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const h = data?.headline ?? {};
  const d = data?.domains ?? {};

  const domains: {
    label: string;
    value: string;
    sub: string;
  }[] = [
    {
      label: 'Aprendizagem',
      value: `${d.learning?.roi ?? 0}%`,
      sub: `${fmt$(d.learning?.cost ?? 0)} investido · ${d.learning?.completions ?? 0} conclusões`,
    },
    {
      label: 'Retenção',
      value: fmt$(d.retention?.savedValue ?? 0),
      sub: `Taxa de Rotatividade: ${d.retention?.turnoverRate ?? 0}%`,
    },
    {
      label: 'Performance',
      value: d.performance?.lift ? `+${d.performance.lift}pts` : '–',
      sub: `Benefício produtivo: ${fmt$(d.performance?.benefit ?? 0)}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ROI Hero */}
      <div className="rounded-panel border border-border bg-surface p-6 text-ink">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="mb-1 font-body text-sm text-ink-muted">
              ROI Total do Investimento em Pessoas
            </p>
            <p className="font-display text-6xl font-black">{h.overallRoi ?? 0}%</p>
            <p className="mt-1 font-body text-sm text-ink-muted">
              Rácio Benefício-Custo:{' '}
              {(h.totalCost ?? 0) > 0
                ? ((h.totalBenefit ?? 0) / (h.totalCost ?? 1)).toFixed(2)
                : '–'}{' '}
              · Status: {h.status}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 font-body text-xs text-ink-muted">Benefício Total</p>
            <p className="font-display text-3xl font-bold">{fmt$(h.totalBenefit ?? 0)}</p>
            <p className="mt-1 font-body text-xs text-ink-muted">
              Custo: {fmt$(h.totalCost ?? 0)}
            </p>
          </div>
        </div>
        {h.narrative && (
          <p className="rounded-card bg-ink/5 px-4 py-3 font-body text-sm leading-relaxed text-ink">
            {ptInsight(h.narrative)}
          </p>
        )}
      </div>

      {/* Domain breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {domains.map((item) => (
          <Card key={item.label}>
            <CardBody>
              <p className="font-display text-2xl font-bold text-ink">{item.value}</p>
              <p className="mb-1 font-body text-xs text-ink-muted">{item.label}</p>
              <p className="font-body text-[10px] text-ink-faint">{item.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(data?.alerts ?? []).map((a, i) => {
            const cfg = a.severity === 'HIGH' ? ALERT_INTENT_CLASSES.danger : ALERT_INTENT_CLASSES.warning;
            return (
              <div
                key={i}
                className={cn('rounded-card border px-4 py-3', cfg.card)}
              >
                <p className={cn('font-body text-sm', cfg.text)}>{ptInsight(a.message)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Top insights */}
      {(data?.topInsights ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-display font-semibold text-ink">
            Principais conclusões autómaticos
          </h4>
          {(data?.topInsights ?? []).slice(0, 4).map((ins, i) => (
            <p key={i} className="mb-1 font-body text-xs text-ink">
              {ptInsight(ins)}
            </p>
          ))}
          {data?.confidence && CONFIDENCE_LABELS[data.confidence] && (
            <div className="mt-2">
              <Badge intent={CONFIDENCE_INTENTS[data.confidence]} dot={false}>
                {CONFIDENCE_LABELS[data.confidence]}
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
