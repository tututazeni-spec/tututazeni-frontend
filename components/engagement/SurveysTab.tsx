// components/engagement/SurveysTab.tsx
// Separador "Surveys" — grelha de surveys filtrável por estado. Dados
// próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SurveyItem } from './types';

const TYPE_ICON: Record<string, string> = {
  CLIMATE: '🌡️',
  PULSE: '💓',
  ENPS: '📊',
  ONBOARDING: '👋',
  OFFBOARDING: '🚪',
  WELLBEING: '🌿',
  CUSTOM: '⚙️',
};

const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'neutral',
};

const STATUS_FILTERS = ['ACTIVE', 'DRAFT', 'COMPLETED', ''] as const;

export function SurveysTab() {
  const [status, setStatus] = useState('ACTIVE');

  const params = { limit: 30, ...(status ? { status } : {}) };
  const { data, isLoading } = useApiQuery<{
    data: SurveyItem[];
    meta: { total: number };
  }>(queryKeys.engagement.surveys(params), '/engagement/surveys', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (isLoading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    );

  return (
    <div className="space-y-4">
      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            size="sm"
            intent={status === s ? 'primary' : 'ghost'}
            onClick={() => setStatus(s)}
          >
            {s || 'Todos'}
          </Button>
        ))}
        <span className="ml-auto font-body text-xs text-ink-faint">
          {data?.meta.total ?? 0} surveys
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.data.map((s) => (
          <Card key={s.id}>
            <CardBody>
              <div className="mb-3 flex items-start justify-between">
                <span className="text-2xl">{TYPE_ICON[s.type] ?? '📋'}</span>
                <Badge intent={STATUS_INTENT[s.status] ?? 'neutral'}>{s.status}</Badge>
              </div>
              <h4 className="mb-1 font-display text-sm font-semibold text-ink">{s.title}</h4>
              <p className="mb-3 line-clamp-2 font-body text-xs text-ink-faint">
                {s.description}
              </p>

              <div className="mb-3 flex items-center gap-3 font-body text-xs text-ink-muted">
                <span>📝 {s._count?.questions ?? 0} perguntas</span>
                <span>👥 {s._count?.responses ?? 0} respostas</span>
              </div>

              {s.status === 'ACTIVE' && (
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-ink-faint">Participação</span>
                    <span className="font-semibold text-primary">
                      {s.participationRate ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={s.participationRate ?? 0} />
                </div>
              )}

              {s.endDate && (
                <p className="mt-2 font-body text-[10px] text-ink-faint">
                  ⏳ Termina: {new Date(s.endDate).toLocaleDateString('pt')}
                </p>
              )}
            </CardBody>
          </Card>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={BarChart2}
              title="Nenhum survey encontrado"
              description="Não há surveys para o filtro seleccionado."
            />
          </div>
        )}
      </div>
    </div>
  );
}
