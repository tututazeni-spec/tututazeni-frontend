// components/reports/InsightsTab.tsx
// Tab "Insights IA": alertas inteligentes gerados automaticamente.
// Extraído de app/(platform)/reports/page.tsx.

'use client';

import { AlertTriangle, CheckCircle, Clock, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { defaultRange } from './utils';
import type { InsightsData } from './types';

type Tone = 'red' | 'gold' | 'green';

const TONES: Record<Tone, { bar: string; text: string }> = {
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
};

const SEV_CONFIG: Record<
  string,
  { tone: Tone; intent: BadgeProps['intent']; icon: LucideIcon }
> = {
  HIGH: { tone: 'red', intent: 'danger', icon: AlertTriangle },
  MEDIUM: { tone: 'gold', intent: 'warning', icon: Clock },
  LOW: { tone: 'green', intent: 'success', icon: CheckCircle },
};

// Rótulos apenas para exibição — as chaves (ins.severity, ins.type) devem
// permanecer em inglês, pois são usadas como chave de lookup em SEV_CONFIG.
const SEV_LABEL: Record<string, string> = {
  HIGH: 'Alto',
  MEDIUM: 'Médio',
  LOW: 'Baixo',
};

const TYPE_LABEL: Record<string, string> = {
  LEARNING: 'Aprendizado',
  PERFORMANCE: 'Performance',
  TALENT: 'Talento',
  ENGAGEMENT: 'Envolvimento',
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
        <h3 className="font-display font-semibold text-ink">
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
        const t = TONES[conf.tone];
                return (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting"
          >
            <div className={`h-1.5 w-full ${t.bar}`} />
            <div className="flex items-start gap-3 p-5">
              <Icon
                size={18}
                strokeWidth={1.75}
                className={`mt-0.5 shrink-0 ${t.text}`}
              />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={`font-body text-[10px] font-bold uppercase tracking-wide ${t.text}`}
                  >
                    {TYPE_LABEL[ins.type] ?? ins.type}
                  </span>
                  <Badge intent={conf.intent}>
                    {SEV_LABEL[ins.severity] ?? ins.severity}
                  </Badge>
                </div>
                <p className="mb-1 font-body text-sm font-medium text-ink">
                  {ins.message}
                </p>
                {ins.recommendation && (
                  <p className="rounded-control border border-border bg-surface px-3 py-1.5 font-body text-xs text-ink-muted">
                    <Lightbulb
                      size={14}
                      strokeWidth={1.75}
                      className="inline align-[-2px]"
                    />{' '}
                    <span className="font-medium">Recomendação:</span>{' '}
                    {ins.recommendation}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
