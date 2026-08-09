// components/courses/CourseDetailView.tsx
// Vista apresentacional do detalhe de curso + player — sem fetch, sem
// mutações (tudo isso vem do container, hooks/useCourseDetail.ts, usado em
// CourseDetail dentro de app/(platform)/courses/page.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.

'use client';

import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  COURSE_LEVEL_MAP,
  COURSE_STATUS_MAP,
  EnrollBadge,
  LessonIcon,
  ProgressBar,
  Skeleton,
  fmtDuration,
} from './shared';
import type { CourseDetailData, CourseProgress, Lesson } from './types';

export interface CourseDetailViewProps {
  onBack: () => void;
  course: CourseDetailData | undefined;
  loadingCourse: boolean;
  progress: CourseProgress | null;
  isEnrolled: boolean;
  progressPct: number;
  activeLesson: Lesson | null;
  onSelectLesson: (lesson: Lesson) => void;
  rating: number;
  onRatingChange: (rating: number) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  onEnroll: () => void;
  onMarkComplete: () => void;
  onFeedback: () => void;
  enrolling: boolean;
  completing: boolean;
  feedbackLoading: boolean;
}

export function CourseDetailView({
  onBack,
  course,
  loadingCourse,
  progress,
  isEnrolled,
  progressPct,
  activeLesson,
  onSelectLesson,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  onEnroll,
  onMarkComplete,
  onFeedback,
  enrolling,
  completing,
  feedbackLoading,
}: CourseDetailViewProps) {
  if (loadingCourse || !course)
    return (
      <div>
        <Skeleton rows={5} />
      </div>
    );

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar ao catálogo
      </button>

      {/* Player Layout: sidebar + content */}
      {isEnrolled && activeLesson ? (
        <div className="grid grid-cols-[1fr_300px] gap-5 mb-6">
          {/* Player principal */}
          <div>
            <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center mb-3">
              {activeLesson.type === 'VIDEO' ? (
                <div className="text-white text-center">
                  <div className="text-5xl mb-3">▶</div>
                  <div className="text-sm text-gray-300">
                    {activeLesson.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Player de vídeo aqui (embed YouTube/Vimeo/próprio)
                  </div>
                </div>
              ) : (
                <div className="text-white text-center">
                  <div className="text-5xl mb-3">
                    <LessonIcon type={activeLesson.type} />
                  </div>
                  <div className="text-sm text-gray-300">
                    {activeLesson.title}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {activeLesson.title}
                </h3>
                {activeLesson.durationMinutes && (
                  <span className="text-xs text-gray-400">
                    {fmtDuration(null, activeLesson.durationMinutes)}
                  </span>
                )}
              </div>
              <button
                onClick={onMarkComplete}
                disabled={completing || activeLesson.completed}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  activeLesson.completed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {activeLesson.completed
                  ? '✓ Concluída'
                  : completing
                    ? 'A marcar…'
                    : 'Marcar concluída'}
              </button>
            </div>
            {/* Progress */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">
                  Progresso geral
                </span>
                <span className="text-xs font-mono font-medium text-blue-700">
                  {progressPct}%
                </span>
              </div>
              <ProgressBar pct={progressPct} size="md" />
              <div className="text-xs text-gray-400 mt-1">
                {progress?.courseProgress.completedLessons}/
                {progress?.courseProgress.totalLessons} aulas concluídas
              </div>
            </div>
          </div>

          {/* Sidebar — lista de aulas */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Conteúdo do curso
            </div>
            <div className="overflow-y-auto max-h-[450px]">
              {progress?.modules.map((mod) => (
                <div key={mod.id}>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-700">
                      {mod.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {mod.completedCount}/{mod.totalCount} aulas
                    </div>
                  </div>
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => onSelectLesson(lesson)}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 cursor-pointer transition-colors ${
                        activeLesson?.id === lesson.id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                          lesson.completed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {lesson.completed ? (
                          '✓'
                        ) : (
                          <LessonIcon type={lesson.type} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs truncate ${activeLesson?.id === lesson.id ? 'text-blue-800 font-medium' : 'text-gray-700'}`}
                        >
                          {lesson.title}
                        </div>
                        {lesson.durationMinutes && (
                          <div className="text-xs text-gray-400">
                            {fmtDuration(null, lesson.durationMinutes)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Header do curso (não matriculado) */
        <div className="grid grid-cols-[1fr_320px] gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {course.category && (
                <span className="text-xs text-blue-600 font-medium">
                  {course.category}
                </span>
              )}
              <StatusBadge value={course.level} map={COURSE_LEVEL_MAP} />
              <StatusBadge
                value={course.status}
                map={COURSE_STATUS_MAP}
                variant="dot"
              />
              {course.mandatory && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded">
                  Obrigatório
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {course.title}
            </h1>
            {course.shortDescription && (
              <p className="text-sm text-gray-600 mb-4">
                {course.shortDescription}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              {course.workloadHours && (
                <span>⏱ {fmtDuration(course.workloadHours)}</span>
              )}
              <span>👥 {course._count.enrollments} matriculados</span>
              <span>📋 {course._count.modules} módulos</span>
              {course.internalCode && (
                <span className="font-mono text-xs">{course.internalCode}</span>
              )}
            </div>
            {course.learningObjectives.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                <div className="text-xs font-medium text-emerald-700 mb-2 uppercase tracking-wide">
                  Objectivos de aprendizagem
                </div>
                <ul className="space-y-1">
                  {course.learningObjectives.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-emerald-800"
                    >
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            {course.thumbnailUrl && (
              <div className="aspect-video rounded-lg overflow-hidden mb-4 relative">
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {!isEnrolled && course.status === 'PUBLISHED' && (
              <button
                onClick={onEnroll}
                disabled={enrolling}
                className="w-full py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {enrolling ? 'A matricular…' : 'Inscrever-me gratuitamente'}
              </button>
            )}
            {isEnrolled && (
              <div className="space-y-2">
                <EnrollBadge
                  status={progress!.enrollment.status}
                  deadline={progress!.enrollment.deadline}
                />
                <ProgressBar pct={progressPct} size="md" />
                <div className="text-xs text-gray-400 text-center">
                  {progressPct}% concluído
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Módulos accordion */}
      {!isEnrolled && course.modules && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-900">
            Conteúdo do curso
          </div>
          {course.modules.map((mod) => (
            <details
              key={mod.id}
              className="border-b border-gray-100 last:border-0"
            >
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-800">
                  {mod.title}
                </span>
                <span className="text-xs text-gray-400">
                  {mod.lessons?.length ?? 0} aulas
                </span>
              </summary>
              <div className="px-4 pb-2">
                {mod.lessons?.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 py-1.5 text-xs text-gray-600 border-b border-gray-50 last:border-0"
                  >
                    <LessonIcon type={l.type} />
                    <span className="flex-1">{l.title}</span>
                    {l.durationMinutes && (
                      <span className="text-gray-400">
                        {fmtDuration(null, l.durationMinutes)}
                      </span>
                    )}
                    {l.isFree && (
                      <span className="text-emerald-600 font-medium">
                        Grátis
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {/* Feedback section */}
      {isEnrolled && progress?.enrollment.status === 'COMPLETED' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Avalie este curso
          </div>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => onRatingChange(s)}
                className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
            placeholder="Partilhe a sua experiência…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
          />
          <button
            onClick={onFeedback}
            disabled={!rating || feedbackLoading}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {feedbackLoading ? 'A enviar…' : 'Enviar avaliação'}
          </button>
        </div>
      )}

      {/* Feedbacks existentes */}
      {(course.feedbacks?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Avaliações
          </div>
          <div className="space-y-3">
            {course.feedbacks?.map((f) => (
              <div
                key={f.id}
                className="border-b border-gray-100 pb-3 last:border-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {f.user.fullName}
                  </span>
                  <span className="text-amber-400">{'★'.repeat(f.rating)}</span>
                </div>
                <p className="text-xs text-gray-600">{f.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
