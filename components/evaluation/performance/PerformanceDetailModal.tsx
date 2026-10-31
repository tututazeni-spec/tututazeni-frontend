// components/evaluation/performance/PerformanceDetailModal.tsx
// Plano de ação de uma avaliação submetida: pontos fortes, áreas de melhoria
// e recomendações com o estado REAL (do PDI quando há ação ligada; da
// formação quando há formação associada) — docs/avaliacao_desempenho_robusta
// §6, §11. O avaliador (ou RH) pode gerar o PDI e acompanhar as ações que
// ainda não estão no PDI.

'use client';

import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LinkButton } from '@/components/ui/LinkButton';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { PerformanceHistoryPanel } from './PerformanceHistoryPanel';
import {
  RECOMMENDATION_STATUS_LABELS,
  type ItemsRecommendation,
  type PerformanceItems,
  type RecommendationStatus,
} from './apiTypes';
import {
  ACTION_TYPE_LABELS,
  IMPROVEMENT_PRIORITY_LABELS,
  RECOMMENDATION_PRIORITY_LABELS,
  type RecommendationActionType,
} from './types';

export interface PerformanceDetailModalProps {
  evaluationId: number;
  /** Avaliado — habilita o separador de evolução. */
  evaluatedId?: number;
  onClose: () => void;
}

const STATUS_INTENT: Record<
  RecommendationStatus,
  'neutral' | 'info' | 'success' | 'warning'
> = {
  PENDENTE: 'neutral',
  EM_CURSO: 'info',
  CONCLUIDA: 'success',
  CANCELADA: 'warning',
};

const TRAINING_STATUS_LABELS: Record<string, string> = {
  WAITLIST: 'Em lista de espera',
  PENDING_APPROVAL: 'Inscrição por aprovar',
  REGISTERED: 'Inscrito',
  ATTENDED: 'Presente',
  ABSENT: 'Ausente',
  CANCELLED: 'Inscrição cancelada',
  REJECTED: 'Inscrição rejeitada',
  COMPLETED: 'Formação concluída',
};

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('pt-PT') : null;
}

interface RecommendationRowProps {
  rec: ItemsRecommendation;
  canTrack: boolean;
  saving: boolean;
  onTrack: (id: number, status: RecommendationStatus) => void;
}

function RecommendationRow({
  rec,
  canTrack,
  saving,
  onTrack,
}: RecommendationRowProps) {
  const trackable = canTrack && rec.source === 'RECOMENDACAO';
  return (
    <li className="space-y-2 rounded-card border border-border bg-surface p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-ink">{rec.action}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge intent={STATUS_INTENT[rec.status]}>
            {RECOMMENDATION_STATUS_LABELS[rec.status]}
          </Badge>
          {rec.overdue && <Badge intent="danger">Em atraso</Badge>}
          <Badge intent="neutral">
            Prioridade {rec.priority} —{' '}
            {RECOMMENDATION_PRIORITY_LABELS[rec.priority]}
          </Badge>
        </div>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-xs text-ink-muted sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold text-ink">Objetivo: </dt>
          <dd className="inline">{rec.objective}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-ink">Indicador: </dt>
          <dd className="inline">{rec.successIndicator}</dd>
        </div>
        <div>
          <dt className="inline font-semibold text-ink">Tipo: </dt>
          <dd className="inline">
            {ACTION_TYPE_LABELS[rec.actionType as RecommendationActionType] ??
              rec.actionType}
          </dd>
        </div>
        {rec.responsible && (
          <div>
            <dt className="inline font-semibold text-ink">Responsável: </dt>
            <dd className="inline">{rec.responsible.fullName}</dd>
          </div>
        )}
        {rec.dueDate && (
          <div>
            <dt className="inline font-semibold text-ink">Prazo: </dt>
            <dd className="inline">{formatDate(rec.dueDate)}</dd>
          </div>
        )}
        {rec.training && (
          <div>
            <dt className="inline font-semibold text-ink">Formação: </dt>
            <dd className="inline">
              {rec.training.title} ·{' '}
              {rec.trainingParticipation
                ? (TRAINING_STATUS_LABELS[rec.trainingParticipation.status] ??
                  rec.trainingParticipation.status)
                : 'Sem inscrição'}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex items-center gap-3">
        <ProgressBar
          value={rec.progressPct}
          intent={rec.status === 'CONCLUIDA' ? 'success' : 'accent'}
        />
        <span className="w-10 shrink-0 text-right text-xs text-ink-muted">
          {rec.progressPct}%
        </span>
      </div>
      {rec.source === 'PDI' ? (
        <p className="text-xs text-ink-faint">
          Estado gerido no PDI — atualize a ação no plano.
        </p>
      ) : (
        trackable && (
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            Estado
            <NativeSelect
              density="sm"
              aria-label={`Estado da recomendação ${rec.action}`}
              value={rec.status}
              disabled={saving}
              onChange={(e) =>
                onTrack(rec.id, e.target.value as RecommendationStatus)
              }
            >
              {Object.entries(RECOMMENDATION_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </NativeSelect>
          </label>
        )
      )}
    </li>
  );
}

export function PerformanceDetailModal({
  evaluationId,
  evaluatedId,
  onClose,
}: PerformanceDetailModalProps) {
  const notify = useToast();
  const me = useCurrentUser();
  const [tab, setTab] = useState<'plan' | 'history'>('plan');
  const itemsQ = useApiQuery<PerformanceItems>(
    queryKeys.evaluation.performanceItems(evaluationId),
    `/evaluations/performance/${evaluationId}/items`,
  );
  const items = itemsQ.data;
  const role = me.data?.role?.name;
  const canManage =
    role === 'ADMIN' ||
    role === 'RH' ||
    (!!me.data && me.data.id !== evaluatedId);

  const generate = useApiMutation(
    () => apiClient.post(`/evaluations/performance/${evaluationId}/pdi`, {}),
    {
      invalidateKeys: [queryKeys.evaluation.performanceItems(evaluationId)],
      onSuccess: () =>
        notify({
          title: 'PDI gerado a partir das recomendações',
          intent: 'success',
        }),
      onError: (e) =>
        notify({
          title: 'Não foi possível gerar o PDI',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const track = useApiMutation(
    (v: { id: number; status: RecommendationStatus }) =>
      apiClient.patch(`/evaluations/recommendations/${v.id}`, {
        status: v.status,
        ...(v.status === 'EM_CURSO' ? { progressPct: 50 } : {}),
      }),
    {
      invalidateKeys: [queryKeys.evaluation.performanceItems(evaluationId)],
      onError: (e) =>
        notify({
          title: 'Não foi possível atualizar a recomendação',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const unlinked =
    items?.recommendations.filter(
      (r) => r.source === 'RECOMENDACAO' && r.status !== 'CANCELADA',
    ).length ?? 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Plano de ação da avaliação"
        description="Pontos fortes, áreas de melhoria e recomendações com o estado real."
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        {evaluatedId && (
          <div role="tablist" className="mt-4 flex gap-1.5">
            {(
              [
                ['plan', 'Plano de ação'],
                ['history', 'Evolução'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={
                  tab === k
                    ? 'rounded-pill border-[1.5px] border-brand bg-brand px-3 py-1 text-xs font-semibold text-white'
                    : 'rounded-pill border-[1.5px] border-border-strong bg-surface px-3 py-1 text-xs font-semibold text-ink-muted hover:bg-surface-sunken'
                }
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === 'history' && evaluatedId ? (
          <div className="mt-4">
            <PerformanceHistoryPanel userId={evaluatedId} />
          </div>
        ) : itemsQ.isLoading ? (
          <Skeleton
            rows={3}
            wrapperClassName="mt-4 space-y-3"
            itemClassName="skeleton-shimmer h-16 rounded-card"
          />
        ) : itemsQ.isError ? (
          <div className="mt-4">
            <QueryError error={itemsQ.error} onRetry={() => itemsQ.refetch()} />
          </div>
        ) : items ? (
          <div className="mt-4 space-y-5">
            {items.pdiPlanId && (
              <AlertCard
                variant="success"
                title="Esta avaliação já tem PDI"
                message="As ações ligadas ao PDI mostram o estado do plano; atualize-as lá."
                actionUrl="/development-plans"
                actionLabel="Ver planos de desenvolvimento"
              />
            )}

            <section aria-label="Pontos fortes" className="space-y-2">
              <h3 className="text-sm font-semibold text-success-ink">
                Pontos Fortes
              </h3>
              {items.strengths.length === 0 && (
                <p className="text-xs text-ink-faint">Sem registos.</p>
              )}
              <ul className="space-y-2">
                {items.strengths.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-card bg-success-subtle p-3 text-xs text-success-ink"
                  >
                    <p className="font-semibold">
                      {s.competency} — nota {s.score}/5
                    </p>
                    <p>{s.description}</p>
                    {s.evidence && <p>Evidência: {s.evidence}</p>}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Áreas de melhoria" className="space-y-2">
              <h3 className="text-sm font-semibold text-warning-ink">
                Áreas de Melhoria
              </h3>
              {items.improvements.length === 0 && (
                <p className="text-xs text-ink-faint">Sem registos.</p>
              )}
              <ul className="space-y-2">
                {items.improvements.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-card bg-warning-subtle p-3 text-xs text-warning-ink"
                  >
                    <p className="font-semibold">
                      {a.competency} — nota {a.score}/5 · prioridade{' '}
                      {IMPROVEMENT_PRIORITY_LABELS[a.priority]}
                    </p>
                    <p>{a.description}</p>
                    {a.evidence && <p>Evidência: {a.evidence}</p>}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-label="Recomendações" className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">
                  Recomendações
                </h3>
                {canManage && unlinked > 0 && (
                  <Button
                    size="sm"
                    loading={generate.isPending}
                    onClick={() => generate.mutate(undefined)}
                  >
                    {items.pdiPlanId
                      ? `Acrescentar ${unlinked} ao PDI`
                      : 'Gerar PDI'}
                  </Button>
                )}
              </div>
              {items.recommendations.length === 0 && (
                <p className="text-xs text-ink-faint">Sem registos.</p>
              )}
              <ul className="space-y-2">
                {items.recommendations.map((r) => (
                  <RecommendationRow
                    key={r.id}
                    rec={r}
                    canTrack={canManage}
                    saving={track.isPending}
                    onTrack={(id, status) => track.mutate({ id, status })}
                  />
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <LinkButton onClick={onClose}>Fechar</LinkButton>
        </div>
      </ModalContent>
    </Modal>
  );
}
