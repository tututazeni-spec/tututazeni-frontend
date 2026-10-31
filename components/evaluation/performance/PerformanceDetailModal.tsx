// components/evaluation/performance/PerformanceDetailModal.tsx
// Plano de ação de uma avaliação submetida: pontos fortes, áreas de melhoria
// e recomendações com o estado REAL (do PDI quando há ação ligada; da
// formação quando há formação associada) — docs/avaliacao_desempenho_robusta
// §6, §11. O avaliador (ou RH) pode gerar o PDI e acompanhar as ações que
// ainda não estão no PDI.

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  MapPin,
  Sparkles,
  Star,
  Wand2,
} from 'lucide-react';
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
import { Select } from '@/components/ui/Select';
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

/** Desenho do painel esquerdo do modal (public/images). */
const PLAN_PANEL_IMAGE = '/images/Plano de ação da avaliação.jpeg';

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
    <li className="space-y-3 rounded-card border border-border bg-surface p-4">
      <p className="text-sm font-bold text-ink">{rec.action}</p>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <dl className="space-y-1 text-xs text-ink-muted">
          <div>
            <dt className="inline font-semibold text-ink">Objetivo: </dt>
            <dd className="inline">{rec.objective}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">Tipo: </dt>
            <dd className="inline">
              {ACTION_TYPE_LABELS[rec.actionType as RecommendationActionType] ??
                rec.actionType}
            </dd>
          </div>
          {rec.dueDate && (
            <div>
              <dt className="inline font-semibold text-ink">Prazo: </dt>
              <dd className="inline">{formatDate(rec.dueDate)}</dd>
            </div>
          )}
        </dl>
        <div aria-hidden className="hidden w-px bg-border sm:block" />
        <div className="space-y-1 text-xs text-ink-muted">
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
          <p>
            <span className="font-semibold text-ink">Indicador: </span>
            {rec.successIndicator}
          </p>
          {rec.responsible && (
            <p>
              <span className="font-semibold text-ink">Responsável: </span>
              {rec.responsible.fullName}
            </p>
          )}
          {rec.training && (
            <p>
              <span className="font-semibold text-ink">Formação: </span>
              {rec.training.title} ·{' '}
              {rec.trainingParticipation
                ? (TRAINING_STATUS_LABELS[rec.trainingParticipation.status] ??
                  rec.trainingParticipation.status)
                : 'Sem inscrição'}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {rec.source === 'PDI' ? (
          <p className="text-xs text-ink-faint">
            Estado gerido no PDI — atualize a ação no plano.
          </p>
        ) : (
          trackable && (
            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <span>Estado</span>
              <Select
                variant="underline"
                icon={MapPin}
                placeholder="Estado da recomendação"
                items={Object.entries(RECOMMENDATION_STATUS_LABELS).map(
                  ([value, label]) => ({ value, label }),
                )}
                value={rec.status}
                disabled={saving}
                onValueChange={(v) =>
                  onTrack(rec.id, v as RecommendationStatus)
                }
                className="w-48"
              />
            </div>
          )
        )}
        <div className="flex min-w-[140px] flex-1 items-center gap-3">
          <ProgressBar
            value={rec.progressPct}
            intent={rec.status === 'CONCLUIDA' ? 'success' : 'accent'}
          />
          <span className="w-10 shrink-0 text-right text-xs text-ink-muted">
            {rec.progressPct}%
          </span>
        </div>
      </div>
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
        hideHeading
        className="max-h-[90vh] max-w-4xl overflow-y-auto p-0"
      >
        <div className="flex min-h-[520px]">
          {/* Painel do desenho "Plano de ação da avaliação" (public/images). */}
          <aside className="hidden w-[260px] shrink-0 flex-col bg-[linear-gradient(160deg,#04234f_0%,#06396e_38%,#072652_72%,#0b3f7a_100%)] sm:flex">
            {/* Ilustração recortada do desenho; o texto abaixo é HTML real. */}
            <div
              aria-hidden
              className="h-[250px] shrink-0 bg-no-repeat"
              style={{
                backgroundImage: `url("${encodeURI(PLAN_PANEL_IMAGE)}")`,
                backgroundSize: '890px auto',
                backgroundPosition: '0 -16px',
                WebkitMaskImage:
                  'linear-gradient(to bottom, #000 80%, transparent 100%)',
                maskImage:
                  'linear-gradient(to bottom, #000 80%, transparent 100%)',
              }}
            />
            <div className="px-6 pb-8 pt-2 text-white">
              <p className="font-display text-2xl font-bold leading-tight">
                Notas e Resultados
              </p>
              <p className="mt-2 text-sm text-white/85">
                O seu desempenho em destaque
              </p>
            </div>
          </aside>
          <div className="min-w-0 flex-1 p-5 pr-12 sm:p-6 sm:pr-12">
            {evaluatedId && (
              <div role="tablist" className="mt-0 flex gap-1.5">
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
                <QueryError
                  error={itemsQ.error}
                  onRetry={() => itemsQ.refetch()}
                />
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
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Sparkles
                      size={16}
                      strokeWidth={1.75}
                      className="text-success-ink"
                      aria-hidden
                    />
                    Pontos Fortes
                  </h3>
                  {items.strengths.length === 0 && (
                    <p className="text-xs text-ink-faint">Sem registos.</p>
                  )}
                  <ul className="space-y-2">
                    {items.strengths.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-start gap-3 rounded-card bg-success-subtle px-4 py-2.5 text-success-ink"
                      >
                        <CheckCircle2
                          size={18}
                          strokeWidth={1.75}
                          className="mt-0.5 shrink-0"
                          aria-hidden
                        />
                        <div className="text-xs">
                          <p className="text-sm font-medium">
                            {s.competency} — nota {s.score}/5
                          </p>
                          {s.description && <p>{s.description}</p>}
                          {s.evidence && <p>Evidência: {s.evidence}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-label="Áreas de melhoria" className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Star
                      size={16}
                      strokeWidth={1.75}
                      className="text-warning-ink"
                      aria-hidden
                    />
                    Áreas de Melhoria
                  </h3>
                  {items.improvements.length === 0 && (
                    <p className="text-xs text-ink-faint">Sem registos.</p>
                  )}
                  <ul className="space-y-2">
                    {items.improvements.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-start gap-3 rounded-card bg-warning-subtle px-4 py-2.5 text-warning-ink"
                      >
                        <AlertCircle
                          size={18}
                          strokeWidth={1.75}
                          className="mt-0.5 shrink-0"
                          aria-hidden
                        />
                        <div className="text-xs">
                          <p className="text-sm font-medium">
                            {a.competency} — nota {a.score}/5 · prioridade{' '}
                            {IMPROVEMENT_PRIORITY_LABELS[a.priority]}
                          </p>
                          {a.description && <p>{a.description}</p>}
                          {a.evidence && <p>Evidência: {a.evidence}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-label="Recomendações" className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Lightbulb
                        size={16}
                        strokeWidth={1.75}
                        className="text-info-ink"
                        aria-hidden
                      />
                      Recomendações
                    </h3>
                    {canManage && unlinked > 0 && (
                      <Button
                        size="sm"
                        loading={generate.isPending}
                        onClick={() => generate.mutate(undefined)}
                      >
                        <Wand2 size={14} strokeWidth={1.75} aria-hidden />
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
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
