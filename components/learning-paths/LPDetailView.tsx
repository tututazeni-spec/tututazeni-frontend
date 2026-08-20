// components/learning-paths/LPDetailView.tsx
// Separador "Detalhe da Trilha" — header, roadmap (stepper) e info.
// Dados próprios (path + progress) + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx. Migrado para a fundação de
// design: header/CTA passam a Card + Button, badges a StatusBadge/Badge,
// progresso a ProgressBar, tabs internas ao mesmo padrão pill do
// container (bg-surface-sunken). StepStatusIcon (só usado aqui) deixa de
// viver em atoms.tsx e passa a helper local — último consumidor do
// ficheiro, eliminado nesta migração.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, Circle, Lock, PlayCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LP_LEVEL_MAP, LP_STATUS_MAP, LP_TYPE_MAP } from './constants';
import { fmtHours, isOverdue } from './utils';
import type { LearningPath, LPProgress, StepStatus } from './types';

interface LPDetailViewProps {
  pathId: number;
  onBack: () => void;
}

function StepStatusIcon({
  status,
  locked,
}: {
  status: StepStatus;
  locked: boolean;
}) {
  if (locked)
    return <Lock size={18} strokeWidth={1.75} className="text-ink-faint" />;
  if (status === 'COMPLETED')
    return (
      <CheckCircle2 size={18} strokeWidth={1.75} className="text-success" />
    );
  if (status === 'IN_PROGRESS')
    return <PlayCircle size={18} strokeWidth={1.75} className="text-info" />;
  return <Circle size={18} strokeWidth={1.75} className="text-ink-faint" />;
}

export function LPDetailView({ pathId, onBack }: LPDetailViewProps) {
  const notify = useToast();
  const [tab, setTab] = useState<'roadmap' | 'info'>('roadmap');

  const pathQuery = useApiQuery<LearningPath>(
    queryKeys.learningPaths.detail(pathId),
    `/learning-paths/${pathId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const progressQuery = useApiQuery<LPProgress>(
    queryKeys.learningPaths.progress(pathId),
    `/learning-paths/${pathId}/progress`,
    { staleTime: STALE_TIME.DYNAMIC, retry: false },
  );

  const path = pathQuery.data ?? null;
  const progress = progressQuery.data ?? null;
  const loading = pathQuery.isLoading;

  const enrollMutation = useApiMutation(
    () => apiClient.post(`/learning-paths/${pathId}/enroll`, {}),
    {
      invalidateKeys: [
        queryKeys.learningPaths.detail(pathId),
        queryKeys.learningPaths.progress(pathId),
      ],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const enrolling = enrollMutation.isPending;
  const handleEnroll = () => enrollMutation.mutate(undefined);

  if (loading || !path)
    return (
      <Skeleton
        rows={5}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  const isEnrolled = !!progress?.enrollment;
  const pct = progress?.overallPct ?? 0;

  // Encontrar próxima etapa não concluída
  const nextStep = progress?.steps.find(
    (s) => !s.locked && s.status !== 'COMPLETED',
  );

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        ← Voltar ao catálogo
      </Button>

      {/* Header */}
      <Card className="mb-5 overflow-hidden">
        <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary to-primary-active">
          {path.thumbnailUrl && (
            <Image
              src={path.thumbnailUrl}
              alt={path.title}
              fill
              className="object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={path.pathType} map={LP_TYPE_MAP} />
              <StatusBadge value={path.level} map={LP_LEVEL_MAP} />
              <StatusBadge
                value={path.status}
                map={LP_STATUS_MAP}
                variant="dot"
              />
              {path.mandatory && <Badge intent="danger">Obrigatório</Badge>}
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="mb-2 font-display text-xl font-semibold text-ink">
                {path.title}
              </h1>
              {path.shortDescription && (
                <p className="mb-3 font-body text-sm text-ink-muted">
                  {path.shortDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-4 font-body text-xs text-ink-faint">
                <span>📚 {path._count.courses} cursos</span>
                {path.totalHours > 0 && (
                  <span>⏱ {fmtHours(path.totalHours)}</span>
                )}
                <span>👥 {path._count.enrollments} inscritos</span>
                {path.deadline && (
                  <span
                    className={`font-medium ${isOverdue(path.deadline) ? 'text-danger' : ''}`}
                  >
                    Prazo: {fmtDate(path.deadline)}
                  </span>
                )}
              </div>
              {path.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {path.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-info-subtle px-2 py-0.5 font-body text-xs text-info-ink"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 text-center">
              {!isEnrolled && path.status === 'PUBLISHED' && (
                <Button onClick={handleEnroll} loading={enrolling}>
                  {enrolling ? 'A inscrever…' : '🚀 Iniciar trilha'}
                </Button>
              )}
              {isEnrolled && (
                <div>
                  <div className="mb-1 font-display text-2xl font-bold text-primary">
                    {pct}%
                  </div>
                  <ProgressBar value={pct} className="mx-auto w-24" />
                  <div className="mt-1 font-body text-xs text-ink-faint">
                    {progress?.completedRequired}/{progress?.totalRequired}{' '}
                    obrigatórios
                  </div>
                  {nextStep && (
                    <a
                      href={`/courses/${nextStep.courseId}`}
                      className="mt-2 block font-body text-xs text-primary hover:underline"
                    >
                      Continuar →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-5 flex w-fit gap-1 rounded-xl bg-surface-sunken p-1">
        {(['roadmap', 'info'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 font-body text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-surface text-ink shadow-resting'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {{ roadmap: 'Roadmap da trilha', info: 'Detalhes' }[t]}
          </button>
        ))}
      </div>

      {/* Roadmap (stepper visual) */}
      {tab === 'roadmap' && (
        <div className="space-y-0">
          {(
            progress?.steps ??
            path.courses?.map((lpc, idx) => ({
              seq: lpc.seq,
              courseId: lpc.courseId,
              required: lpc.required,
              course: lpc.course,
              status: 'NOT_ENROLLED' as StepStatus,
              locked: idx > 0,
              completedAt: null,
              progress: 0,
              deadlineDays: lpc.deadlineDays,
            })) ??
            []
          ).map((step, idx, arr) => (
            <div key={step.courseId} className="flex gap-4">
              {/* Connector line */}
              <div className="flex flex-shrink-0 flex-col items-center pt-1">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    step.status === 'COMPLETED'
                      ? 'border-success bg-success-subtle'
                      : step.status === 'IN_PROGRESS'
                        ? 'border-info bg-info-subtle'
                        : step.locked
                          ? 'border-border bg-surface-sunken'
                          : 'border-border-strong bg-surface'
                  }`}
                >
                  <StepStatusIcon status={step.status} locked={step.locked} />
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`mt-1 min-h-[24px] w-0.5 flex-1 ${
                      step.status === 'COMPLETED' ? 'bg-success' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Step card */}
              <div className={`mb-3 flex-1 ${step.locked ? 'opacity-50' : ''}`}>
                <Card
                  className={`overflow-hidden transition-all ${
                    step.status === 'IN_PROGRESS'
                      ? 'border-info shadow-resting'
                      : step.status === 'COMPLETED'
                        ? 'border-success'
                        : ''
                  }`}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-control bg-surface-sunken">
                      {step.course?.thumbnailUrl ? (
                        <Image
                          src={step.course.thumbnailUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl text-ink-faint">
                          📚
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="mb-0.5 flex items-center gap-2">
                        <span className="font-mono text-xs text-ink-faint">
                          Etapa {step.seq + 1}
                        </span>
                        {!step.required && (
                          <span className="rounded bg-info-subtle px-1.5 font-body text-xs text-info-ink">
                            Opcional
                          </span>
                        )}
                        {step.locked && (
                          <span className="flex items-center gap-1 font-body text-xs text-ink-faint">
                            <Lock size={12} strokeWidth={1.75} /> Bloqueado
                          </span>
                        )}
                      </div>
                      <div className="font-body text-sm font-medium text-ink">
                        {step.course?.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 font-body text-xs text-ink-faint">
                        {step.course?.category && (
                          <span>{step.course.category}</span>
                        )}
                        {step.course?.workloadHours && (
                          <span>⏱ {fmtHours(step.course.workloadHours)}</span>
                        )}
                        {step.completedAt && (
                          <span className="text-success">
                            ✓ {fmtDate(step.completedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CTA */}
                    {!step.locked &&
                      step.status !== 'COMPLETED' &&
                      isEnrolled && (
                        <a
                          href={`/courses/${step.courseId}`}
                          className={`flex-shrink-0 rounded-lg px-3 py-1.5 font-body text-xs font-medium ${
                            step.status === 'IN_PROGRESS'
                              ? 'bg-primary text-canvas hover:bg-primary-hover'
                              : 'bg-surface-sunken text-ink hover:bg-border'
                          }`}
                        >
                          {step.status === 'IN_PROGRESS'
                            ? 'Continuar'
                            : 'Iniciar'}
                        </a>
                      )}
                  </div>
                </Card>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info tab */}
      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-5">
          <Card className="p-5">
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Sobre a trilha
            </div>
            {path.objective && (
              <div className="mb-3">
                <div className="mb-1 font-body text-xs text-ink-faint">
                  Objectivo
                </div>
                <p className="font-body text-sm text-ink">{path.objective}</p>
              </div>
            )}
            {path.description && (
              <div>
                <div className="mb-1 font-body text-xs text-ink-faint">
                  Descrição
                </div>
                <p className="font-body text-sm text-ink">{path.description}</p>
              </div>
            )}
          </Card>
          <Card className="p-5">
            <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Detalhes
            </div>
            {[
              ['Tipo', path.pathType],
              ['Nível', path.level],
              ['Cursos', String(path._count.courses)],
              ['Duração', fmtHours(path.totalHours)],
              ['Inscritos', String(path._count.enrollments)],
              ['Publicado', fmtDate(path.publishedAt)],
              ['Prazo', fmtDate(path.deadline)],
            ].map(([l, v]) => (
              <div
                key={l}
                className="flex justify-between border-b border-border py-1.5 last:border-0"
              >
                <span className="font-body text-xs text-ink-muted">{l}</span>
                <span className="font-body text-xs font-medium text-ink">
                  {v}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
