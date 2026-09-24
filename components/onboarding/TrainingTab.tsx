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
import { Badge } from '@/components/ui/Badge';
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

export function TrainingTab({ canManagePlan = false, canManageTasks = false }: TrainingTabProps) {
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
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      {data.map((row) => (
        <button
          key={row.taskInstanceId}
          type="button"
          onClick={() => setDetailId(row.planId)}
          className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
        >
          <Avatar name={row.user.fullName} url={row.user.avatarUrl ?? undefined} size="sm" />
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
            <Badge dot={false} intent="neutral">
              Sem inscrição
            </Badge>
          )}
          {row.enrollment?.hasCertificate && (
            <Badge dot={false} intent="success">
              Certificado
            </Badge>
          )}
          <div className="hidden shrink-0 font-body text-xs text-ink-faint sm:block">
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
