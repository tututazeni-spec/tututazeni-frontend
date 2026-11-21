// components/onboarding/DocumentsTab.tsx
// Separador "Documentos" (docs/onboarding.md ponto 6) — vista transversal.
// GET /onboarding/documents devolve dois grupos: `submitted` (documentos
// reais, com o estado real) e `pendingSubmission` (tarefas de categoria
// DOCUMENTS ainda por concluir — nada foi submetido para elas; não há FK
// no schema entre um OnboardingDocument e a tarefa que o pediu, por isso
// não tentamos fundir os dois numa única lista "precisa"). Validar
// documento continua a viver no PlanDetailModal (ADMIN/RH).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { DOC_LABEL } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import type { OnboardingDocumentsResponse } from './types';

// Mesma grelha no cabeçalho e nas linhas (desenho de "Documentos submetidos").
const SUBMITTED_GRID =
  'grid grid-cols-[minmax(0,2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-8 px-4';

export interface DocumentsTabProps {
  canManagePlan?: boolean;
  canManageTasks?: boolean;
}

export function DocumentsTab({
  canManagePlan = false,
  canManageTasks = false,
}: DocumentsTabProps) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const { data, isLoading } = useApiQuery<OnboardingDocumentsResponse>(
    queryKeys.onboarding.documents({}),
    '/onboarding/documents',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="m-0 mb-3 text-lg font-bold text-ink">
          Submetidos ({data.submitted.length})
        </h2>
        {data.submitted.length === 0 ? (
          <EmptyState
            title="Sem documentos submetidos"
            description="Ainda não há documentos submetidos."
          />
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
            <div
              className={cn(
                SUBMITTED_GRID,
                'bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white',
              )}
            >
              <div>Colaborador</div>
              <div>Documento</div>
              <div>Submetido</div>
              <div>Estado</div>
            </div>
            {data.submitted.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setDetailId(doc.planId)}
                className={cn(
                  SUBMITTED_GRID,
                  'w-full cursor-pointer border-b border-brand-line bg-surface py-3 text-left font-body text-sm text-ink-muted last:border-0',
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={doc.plan.user.fullName}
                    url={doc.plan.user.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <span className="truncate font-semibold text-ink">
                    {doc.plan.user.fullName}
                  </span>
                </div>
                <div className="break-words font-semibold text-ink">
                  {doc.documentType}
                </div>
                <div className="text-ink">{fmtDate(doc.createdAt)}</div>
                <div>
                  <span className="text-xs font-bold text-ink">
                    {DOC_LABEL[doc.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="m-0 mb-3 text-lg font-bold text-ink">
          Por submeter ({data.pendingSubmission.length})
        </h2>
        {data.pendingSubmission.length === 0 ? (
          <EmptyState
            title="Nada por submeter"
            description="Todos os documentos obrigatórios já foram submetidos."
          />
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
            <div
              className={cn(
                SUBMITTED_GRID,
                'bg-brand-dark py-3 text-xs font-semibold uppercase tracking-wider text-white',
              )}
            >
              <div>Colaborador</div>
              <div>Documento</div>
              <div>Prazo</div>
              <div>Estado</div>
            </div>
            {data.pendingSubmission.map((row) => (
              <button
                key={row.taskInstanceId}
                type="button"
                onClick={() => setDetailId(row.planId)}
                className={cn(
                  SUBMITTED_GRID,
                  'w-full cursor-pointer border-b border-brand-line bg-surface py-3 text-left font-body text-sm text-ink-muted last:border-0',
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={row.plan.user.fullName}
                    url={row.plan.user.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <span className="truncate font-semibold text-ink">
                    {row.plan.user.fullName}
                  </span>
                </div>
                <div className="break-words font-semibold text-ink">
                  {row.documentType}
                </div>
                <div className="text-ink">
                  {row.dueDate ? fmtDate(row.dueDate) : '—'}
                </div>
                <div>
                  <span className="text-xs font-bold text-ink">
                    Por submeter
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

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
