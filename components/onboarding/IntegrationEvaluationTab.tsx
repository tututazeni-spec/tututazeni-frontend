// components/onboarding/IntegrationEvaluationTab.tsx
// Separador "Avaliação de Integração" (docs/onboarding.md ponto 9) — lista
// as avaliações já despoletadas (PlanDetailModal tem o botão "Pedir
// avaliação" para planos COMPLETED sem uma ainda). Junta o EvaluationRequest
// real do módulo Evaluation — não há aqui um formulário de avaliação
// próprio, conforme o spec pede.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OnboardingIntegrationEvaluation } from './types';

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'neutral'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  IN_PROGRESS: 'warning',
};

export function IntegrationEvaluationTab() {
  const { data = [], isLoading } = useApiQuery<OnboardingIntegrationEvaluation[]>(
    queryKeys.onboarding.integrationEvaluations(),
    '/onboarding/integration-evaluations',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={5} />;

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem avaliações de integração"
        description="Ainda não foi pedida nenhuma Avaliação de Integração — isso faz-se no detalhe de um plano concluído, aba 'Onboardings'."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      {data.map((row) => (
        <div key={row.planId} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
          <Avatar name={row.user.fullName} url={row.user.avatarUrl ?? undefined} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-body text-sm font-medium text-ink">{row.user.fullName}</div>
            <div className="truncate font-body text-xs text-ink-faint">
              {row.evaluation?.evaluator && `Avaliador: ${row.evaluation.evaluator.fullName}`}
              {row.onboardingCompletedAt && ` · Onboarding concluído ${fmtDate(row.onboardingCompletedAt)}`}
            </div>
          </div>
          <div className="hidden shrink-0 font-body text-xs text-ink-faint sm:block">
            {row.evaluation?.completedAt
              ? `Concluída ${fmtDate(row.evaluation.completedAt)}`
              : row.evaluation?.dueDate
                ? `Prazo ${fmtDate(row.evaluation.dueDate)}`
                : '—'}
          </div>
          {row.evaluation && (
            <Badge dot={false} intent={STATUS_BADGE[row.evaluation.status] ?? 'neutral'}>
              {row.evaluation.status}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
