// components/learning-paths/LPDetailView.tsx
// Separador "Detalhe da Trilha" — header, roadmap (stepper) e info.
// Dados próprios (path + progress) + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton, StepStatusIcon, TypeBadge } from './atoms';
import { LP_LEVEL_MAP, LP_STATUS_MAP } from './constants';
import { fmtHours, isOverdue } from './utils';
import type { LearningPath, LPProgress } from './types';

interface LPDetailViewProps {
  pathId: number;
  onBack: () => void;
}

export function LPDetailView({ pathId, onBack }: LPDetailViewProps) {
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
      onError: (e) => alert(e.message),
    },
  );
  const enrolling = enrollMutation.isPending;
  const handleEnroll = () => enrollMutation.mutate(undefined);

  if (loading || !path)
    return (
      <div>
        <Skeleton rows={5} />
      </div>
    );

  const isEnrolled = !!progress?.enrollment;
  const pct = progress?.overallPct ?? 0;

  // Encontrar próxima etapa não concluída
  const nextStep = progress?.steps.find(
    (s) => !s.locked && s.status !== 'COMPLETED',
  );

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar ao catálogo
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="h-36 bg-gradient-to-br from-blue-700 to-blue-900 relative">
          {path.thumbnailUrl && (
            <Image
              src={path.thumbnailUrl}
              alt={path.title}
              fill
              className="object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={path.pathType} />
              <StatusBadge value={path.level} map={LP_LEVEL_MAP} />
              <StatusBadge
                value={path.status}
                map={LP_STATUS_MAP}
                variant="dot"
              />
              {path.mandatory && (
                <span className="bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">
                  Obrigatório
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                {path.title}
              </h1>
              {path.shortDescription && (
                <p className="text-sm text-gray-500 mb-3">
                  {path.shortDescription}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                <span>📚 {path._count.courses} cursos</span>
                {path.totalHours > 0 && (
                  <span>⏱ {fmtHours(path.totalHours)}</span>
                )}
                <span>👥 {path._count.enrollments} inscritos</span>
                {path.deadline && (
                  <span
                    className={`font-medium ${isOverdue(path.deadline) ? 'text-red-600' : ''}`}
                  >
                    Prazo: {fmtDate(path.deadline)}
                  </span>
                )}
              </div>
              {path.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {path.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
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
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {enrolling ? 'A inscrever…' : '🚀 Iniciar trilha'}
                </button>
              )}
              {isEnrolled && (
                <div>
                  <div className="text-2xl font-bold font-mono text-blue-700 mb-1">
                    {pct}%
                  </div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mx-auto">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {progress?.completedRequired}/{progress?.totalRequired}{' '}
                    obrigatórios
                  </div>
                  {nextStep && (
                    <a
                      href={`/courses/${nextStep.courseId}`}
                      className="mt-2 block text-xs text-blue-600 hover:underline"
                    >
                      Continuar →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {(['roadmap', 'info'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
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
              status: 'NOT_ENROLLED',
              locked: idx > 0,
              completedAt: null,
              progress: 0,
              deadlineDays: lpc.deadlineDays,
            })) ??
            []
          ).map((step, idx, arr) => (
            <div key={step.courseId} className="flex gap-4">
              {/* Connector line */}
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                    step.status === 'COMPLETED'
                      ? 'bg-emerald-100 border-emerald-400'
                      : step.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 border-blue-500'
                        : step.locked
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-gray-300'
                  }`}
                >
                  <StepStatusIcon status={step.status} locked={step.locked} />
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 min-h-[24px] mt-1 ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-300'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Step card */}
              <div className={`flex-1 mb-3 ${step.locked ? 'opacity-50' : ''}`}>
                <div
                  className={`bg-white border rounded-xl overflow-hidden transition-all ${
                    step.status === 'IN_PROGRESS'
                      ? 'border-blue-300 shadow-sm'
                      : step.status === 'COMPLETED'
                        ? 'border-emerald-200'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {step.course?.thumbnailUrl ? (
                        <Image
                          src={step.course.thumbnailUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">
                          📚
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400 font-mono">
                          Etapa {step.seq + 1}
                        </span>
                        {!step.required && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded">
                            Opcional
                          </span>
                        )}
                        {step.locked && (
                          <span className="text-xs text-gray-400">
                            🔒 Bloqueado
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {step.course?.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        {step.course?.category && (
                          <span>{step.course.category}</span>
                        )}
                        {step.course?.workloadHours && (
                          <span>⏱ {fmtHours(step.course.workloadHours)}</span>
                        )}
                        {step.completedAt && (
                          <span className="text-emerald-600">
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
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg flex-shrink-0 ${
                            step.status === 'IN_PROGRESS'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {step.status === 'IN_PROGRESS'
                            ? 'Continuar'
                            : 'Iniciar'}
                        </a>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info tab */}
      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Sobre a trilha
            </div>
            {path.objective && (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-1">Objectivo</div>
                <p className="text-sm text-gray-700">{path.objective}</p>
              </div>
            )}
            {path.description && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Descrição</div>
                <p className="text-sm text-gray-700">{path.description}</p>
              </div>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
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
                className="flex justify-between py-1.5 border-b border-gray-100 last:border-0"
              >
                <span className="text-xs text-gray-500">{l}</span>
                <span className="text-xs font-medium text-gray-900">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
