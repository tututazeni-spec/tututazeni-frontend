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
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { DOC_BADGE, DOC_LABEL } from './constants';
import { PlanDetailModal } from './PlanDetailModal';
import type { OnboardingDocumentsResponse } from './types';

export interface DocumentsTabProps {
  canManagePlan?: boolean;
  canManageTasks?: boolean;
}

export function DocumentsTab({ canManagePlan = false, canManageTasks = false }: DocumentsTabProps) {
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
        <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Submetidos ({data.submitted.length})
        </h3>
        {data.submitted.length === 0 ? (
          <EmptyState title="Sem documentos submetidos" description="Ainda não há documentos submetidos." />
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {data.submitted.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => setDetailId(doc.planId)}
                className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
              >
                <Avatar name={doc.plan.user.fullName} url={doc.plan.user.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-medium text-ink">{doc.documentType}</div>
                  <div className="truncate font-body text-xs text-ink-faint">
                    {doc.plan.user.fullName} · Enviado {fmtDate(doc.createdAt)}
                  </div>
                </div>
                <Badge dot={false} intent={DOC_BADGE[doc.status]}>
                  {DOC_LABEL[doc.status]}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Por submeter ({data.pendingSubmission.length})
        </h3>
        {data.pendingSubmission.length === 0 ? (
          <EmptyState title="Nada por submeter" description="Todos os documentos obrigatórios já foram submetidos." />
        ) : (
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {data.pendingSubmission.map((row) => (
              <button
                key={row.taskInstanceId}
                type="button"
                onClick={() => setDetailId(row.planId)}
                className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-sunken"
              >
                <Avatar name={row.plan.user.fullName} url={row.plan.user.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-medium text-ink">{row.documentType}</div>
                  <div className="truncate font-body text-xs text-ink-faint">{row.plan.user.fullName}</div>
                </div>
                {row.dueDate && (
                  <div className="shrink-0 font-body text-xs text-ink-faint">Prazo {fmtDate(row.dueDate)}</div>
                )}
                <Badge dot={false} intent="warning">
                  Por submeter
                </Badge>
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
