// components/onboarding/IntegrationEvaluationTab.tsx
// Separador "Avaliação de Integração" (docs/onboarding.md ponto 9) — lista
// as avaliações já despoletadas (PlanDetailModal tem o botão "Pedir
// avaliação" para planos COMPLETED sem uma ainda). Junta o EvaluationRequest
// real do módulo Evaluation — não há aqui um formulário de avaliação
// próprio, conforme o spec pede.

'use client';

import { useState } from 'react';
import { ChevronRight, ClipboardCheck, Clock } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { PlanDetailModal } from './PlanDetailModal';
import type { OnboardingIntegrationEvaluation } from './types';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluída',
  SKIPPED: 'Ignorada',
};

export interface IntegrationEvaluationTabProps {
  canManagePlan?: boolean;
  canManageTasks?: boolean;
}

export function IntegrationEvaluationTab({
  canManagePlan = false,
  canManageTasks = false,
}: IntegrationEvaluationTabProps) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data = [], isLoading } = useApiQuery<
    OnboardingIntegrationEvaluation[]
  >(
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
    <div className="space-y-3">
      {data.map((row) => (
        <button
          key={row.planId}
          type="button"
          onClick={() => setDetailId(row.planId)}
          className="group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-card border border-border bg-gradient-to-r from-[#E8EFFC] via-[#F4F7FD] to-[#F8FAFE] px-4 py-2.5 text-left"
        >
          <div
            aria-hidden="true"
            className="relative hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[#1E4FB5] shadow-sm sm:flex"
          >
            <ClipboardCheck size={26} strokeWidth={1.5} />
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#1E4FB5] text-white">
              <Clock size={12} strokeWidth={2} />
            </span>
          </div>
          <div
            aria-hidden="true"
            className="hidden h-9 w-px bg-border sm:block"
          />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 truncate text-base font-bold text-[#0F1F3D]">
              Avaliação de Integração
            </h3>
            <div className="mt-1 flex min-w-0 items-center gap-2">
              <Avatar
                name={row.user.fullName}
                url={row.user.avatarUrl ?? undefined}
                size="sm"
                className="shrink-0"
              />
              <div className="truncate text-xs text-ink-muted">
                <span className="font-bold text-[#0F1F3D]">
                  {row.user.fullName}
                </span>
                {row.evaluation?.evaluator &&
                  ` · Avaliador: ${row.evaluation.evaluator.fullName}`}
                {row.onboardingCompletedAt &&
                  ` · Onboarding concluído ${fmtDate(row.onboardingCompletedAt)}`}
                {row.evaluation && (
                  <span className="font-semibold">
                    {` · ${STATUS_LABEL[row.evaluation.status] ?? row.evaluation.status}`}
                  </span>
                )}
                {` · ${
                  row.evaluation?.completedAt
                    ? `Concluída ${fmtDate(row.evaluation.completedAt)}`
                    : row.evaluation?.dueDate
                      ? `Prazo ${fmtDate(row.evaluation.dueDate)}`
                      : '—'
                }`}
              </div>
            </div>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white transition-transform group-hover:translate-x-0.5">
            <ChevronRight size={18} strokeWidth={2} />
          </span>
        </button>
      ))}

      {detailId !== null && (
        <PlanDetailModal
          planId={detailId}
          canManagePlan={canManagePlan}
          canManageTasks={canManageTasks}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
