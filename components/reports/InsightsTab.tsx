// components/reports/InsightsTab.tsx
// Tab "Insights IA": alertas inteligentes gerados automaticamente.
// Extraído de app/(platform)/reports/page.tsx.

'use client';

import { AlertTriangle, Brain, CheckCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { defaultRange } from './utils';
import type { InsightsData } from './types';

const SEV_CONFIG: Record<
  string,
  {
    textClass: string;
    cardClass: string;
    intent: BadgeProps['intent'];
    icon: LucideIcon;
  }
> = {
  HIGH: {
    textClass: 'text-danger-ink',
    cardClass: 'border-danger bg-danger-subtle',
    intent: 'danger',
    icon: AlertTriangle,
  },
  MEDIUM: {
    textClass: 'text-warning-ink',
    cardClass: 'border-warning bg-warning-subtle',
    intent: 'warning',
    icon: Clock,
  },
  LOW: {
    textClass: 'text-success-ink',
    cardClass: 'border-success bg-success-subtle',
    intent: 'success',
    icon: CheckCircle,
  },
};

export function InsightsTab() {
  const range = defaultRange(1);
  const { data, isLoading: loading } = useApiQuery<InsightsData>(
    queryKeys.reports.insights({ from: range.from, to: range.to }),
    '/reports/insights',
    {
      params: { from: range.from, to: range.to },
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-20 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display font-semibold text-ink">
          <Brain size={16} strokeWidth={1.75} className="text-accent" />
          Análises Inteligentes
        </h3>
        <Badge intent="info">{data?.count ?? 0} Principais Conclusões</Badge>
      </div>

      {(data?.insights ?? []).length === 0 && (
        <div className="rounded-card border border-success bg-success-subtle py-16 text-center">
          <CheckCircle
            size={36}
            strokeWidth={1.75}
            className="mx-auto mb-2 text-success"
          />
          <p className="font-body font-medium text-success-ink">
            Organização saudável!
          </p>
          <p className="font-body text-sm text-success-ink">
            Sem alertas críticos identificados
          </p>
        </div>
      )}

      {(data?.insights ?? []).map((ins, i) => {
        const conf = SEV_CONFIG[ins.severity] ?? SEV_CONFIG.LOW;
        const Icon = conf.icon;
        return (
          <Card key={i} className={conf.cardClass}>
            <CardBody className="flex items-start gap-3">
              <Icon
                size={16}
                strokeWidth={1.75}
                className={`mt-0.5 shrink-0 ${conf.textClass}`}
              />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`font-body text-[10px] font-bold uppercase tracking-wide ${conf.textClass}`}
                  >
                    {ins.type}
                  </span>
                  <Badge intent={conf.intent}>{ins.severity}</Badge>
                </div>
                <p
                  className={`mb-1 font-body text-sm font-medium ${conf.textClass}`}
                >
                  {ins.message}
                </p>
                {ins.recommendation && (
                  <p className="rounded-control border border-border bg-surface px-3 py-1.5 font-body text-xs text-ink-muted">
                    💡 <span className="font-medium">Recomendação:</span>{' '}
                    {ins.recommendation}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}
