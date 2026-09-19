// components/live-classes/EvaluationsView.tsx
// Separador "Avaliações" (docs/aulas-ao-vivo.md secção 12) — resumo (médias
// por rubrica + NPS) e lista de respostas PostClassResponse de todas as
// aulas. Só visível a ADMIN/RH/LIDER (ver CAN_VIEW_LIVE_CLASSES_REPORTS_ROLES
// e live-classes.controller.ts).

'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { EvaluationsSummary, LiveEvaluationResponse, PaginatedMeta } from './types';

function Score({ value }: { value: number | null }) {
  if (value == null) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={12} strokeWidth={1.75} className="text-warning-ink" />
      {value}
    </span>
  );
}

export function EvaluationsView() {
  const [page, setPage] = useState(1);

  const { data: summary, isLoading: loadingSummary } = useApiQuery<EvaluationsSummary>(
    queryKeys.liveClasses.evaluationsSummary({}),
    '/live-classes/evaluations/summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const params = { page, limit: 20 };
  const { data, isLoading } = useApiQuery<PaginatedMeta<LiveEvaluationResponse>>(
    queryKeys.liveClasses.evaluations(params),
    '/live-classes/evaluations',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const rows = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <div className="space-y-6">
      {loadingSummary || !summary ? (
        <Skeleton rows={1} itemClassName="skeleton-shimmer h-24 rounded-card" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard label="Respostas" value={summary.responses} intent="primary" />
          <KpiCard label="Avaliação da sessão" value={summary.avgRating ?? '—'} intent="accent" />
          <KpiCard label="Formador" value={summary.avgInstructorRating ?? '—'} />
          <KpiCard label="Conteúdo" value={summary.avgContentRating ?? '—'} />
          <KpiCard label="Organização / Aplicabilidade" value={summary.avgOrganizationRating ?? '—'} />
          <KpiCard label="NPS" value={summary.nps ?? '—'} intent="warning" />
        </div>
      )}

      {isLoading ? (
        <Skeleton rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sem avaliações"
          description="As avaliações aparecem aqui depois de os participantes responderem à avaliação pós-aula (Etapa 8)."
        />
      ) : (
        <Card className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{r.evaluation.liveClass.topic}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-body text-xs text-ink-faint">
                  <span>{r.user.fullName}</span>
                  <span>· {r.evaluation.liveClass.course?.title ?? '—'}</span>
                  <span>· {formatDateTime(r.createdAt)}</span>
                </div>
                {r.feedback && <p className="mt-1 font-body text-sm text-ink-muted">{r.feedback}</p>}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-5">
                <div>
                  <div className="text-ink-faint">Sessão</div>
                  <Score value={r.rating} />
                </div>
                <div>
                  <div className="text-ink-faint">Formador</div>
                  <Score value={r.instructorRating} />
                </div>
                <div>
                  <div className="text-ink-faint">Conteúdo</div>
                  <Score value={r.contentRating} />
                </div>
                <div>
                  <div className="text-ink-faint">Organização</div>
                  <Score value={r.organizationRating} />
                </div>
                <div>
                  <div className="text-ink-faint">Aplicabilidade</div>
                  <Score value={r.applicabilityRating} />
                </div>
              </div>
              {r.nps != null && (
                <span className="rounded bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted">
                  NPS {r.nps}
                </span>
              )}
            </div>
          ))}
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button intent="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </Button>
          <span className="py-2 px-3 text-sm text-ink-muted">
            {page} / {totalPages}
          </span>
          <Button intent="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Seguinte →
          </Button>
        </div>
      )}
    </div>
  );
}
