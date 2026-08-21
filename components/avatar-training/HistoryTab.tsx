// components/avatar-training/HistoryTab.tsx
// Separador "Histórico" — resumo + lista de sessões passadas. Dados
// próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/avatar-training/page.tsx.

'use client';

import { Play } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_CONFIG, SCORE_COLOR } from './constants';
import type { MyHistory } from './types';

const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  COMPLETED: 'success',
  IN_PROGRESS: 'info',
  PAUSED: 'warning',
  ABANDONED: 'neutral',
};

export function HistoryTab() {
  const { data, isLoading } = useApiQuery<MyHistory>(
    queryKeys.avatarTraining.myHistory(30),
    '/avatar-training/my-history',
    { params: { limit: 30 }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading)
    return (
      <Skeleton
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="bg-surface-sunken rounded-card h-28"
      />
    );

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data?.stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: data.stats.total },
            { label: 'Concluídas', value: data.stats.completed },
            { label: 'Pontuação Média', value: data.stats.avgScore ?? '–' },
            { label: 'Pontos de Experiência Total', value: data.stats.totalXP },
          ].map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-ink-faint">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="divide-y divide-border">
          {(data?.sessions ?? []).map((s) => {
            const cat =
              CATEGORY_CONFIG[s.scenario?.category ?? ''] ??
              CATEGORY_CONFIG.SOFT_SKILLS;
            const Icon = cat.icon;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken"
              >
                <div className={`p-2 rounded-control ${cat.bg} shrink-0`}>
                  <Icon size={14} strokeWidth={1.75} className={cat.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {s.scenario?.title}
                  </p>
                  <p className="text-[10px] text-ink-faint">
                    {new Date(s.startedAt).toLocaleDateString('pt')}
                    {s.scenario?.competency &&
                      ` · ${s.scenario.competency.name}`}
                  </p>
                </div>
                <Badge intent={STATUS_INTENT[s.status]} className="shrink-0">
                  {s.status}
                </Badge>
                {s.score !== null && s.score !== undefined && (
                  <span
                    className={`text-sm font-bold ${SCORE_COLOR(s.score)} w-10 text-right`}
                  >
                    {s.score}
                  </span>
                )}
              </div>
            );
          })}
          {(data?.sessions?.length ?? 0) === 0 && (
            <CardBody>
              <EmptyState
                icon={Play}
                title="Sem sessões ainda"
                description="Começa um cenário para veres o teu histórico aqui."
              />
            </CardBody>
          )}
        </div>
      </Card>
    </div>
  );
}
