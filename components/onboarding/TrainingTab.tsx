// components/onboarding/TrainingTab.tsx
// Separador "Formação" (docs/onboarding.md ponto 7) — tarefas de categoria
// TRAINING associadas à inscrição real (Enrollment) do colaborador no
// mesmo curso. GET /onboarding/training faz o join; esta vista é só
// leitura (a integração não duplica gestão de cursos/formações).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { PHASE_LABELS } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import type { OnboardingTrainingRow } from './types';

export interface TrainingTabProps {
  canManagePlan?: boolean;
  canManageTasks?: boolean;
}

export function TrainingTab({
  canManagePlan = false,
  canManageTasks = false,
}: TrainingTabProps) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data = [], isLoading } = useApiQuery<OnboardingTrainingRow[]>(
    queryKeys.onboarding.training({}),
    '/onboarding/training',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={5} />;

  if (data.length === 0) {
    return (
      <EmptyState
        title="Sem formação associada"
        description="Nenhum plano de integração tem tarefas de formação (categoria 'Formação obrigatória')."
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <button
          key={row.taskInstanceId}
          type="button"
          onClick={() => setDetailId(row.planId)}
          className="relative flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden rounded-[18px] border border-brand-line bg-surface px-4 py-[11px] text-left shadow-[0_4px_12px_rgba(21,47,89,0.10)]"
        >
          <Avatar
            name={row.user.fullName}
            url={row.user.avatarUrl ?? undefined}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-body text-sm font-medium text-ink">
              {row.course?.title ?? row.title}
            </div>
            <div className="truncate font-body text-xs text-ink-faint">
              {row.user.fullName} · {PHASE_LABELS[row.phase]}
              {!row.isMandatory && ' · opcional'}
            </div>
          </div>
          {row.enrollment ? (
            <div className="w-32 shrink-0">
              <ProgressBar value={row.enrollment.progress} />
              <div className="mt-0.5 text-right font-body text-xs text-ink-faint">
                {row.enrollment.progress}%
              </div>
            </div>
          ) : (
            <span className="font-body text-xs font-bold text-ink">
              Sem inscrição
            </span>
          )}
          {row.enrollment?.hasCertificate && (
            <span className="font-body text-xs font-bold text-ink">
              Certificado
            </span>
          )}
          <div className="hidden shrink-0 font-body text-xs font-semibold text-ink sm:block">
            {row.dueDate ? fmtDate(row.dueDate) : '—'}
          </div>
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
