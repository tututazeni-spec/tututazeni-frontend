// components/courses/CourseDetailView.tsx
// Vista apresentacional do detalhe de curso + player — sem fetch, sem
// mutações (tudo isso vem do container, hooks/useCourseDetail.ts, usado em
// CourseDetail dentro de app/(platform)/courses/page.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.
//
// Migrado para a fundação de design: área do player passa a bg-ink/
// text-canvas (mesmo padrão de components/courses-learn/ContentPlayer.tsx),
// cartões passam a Card, botões a Button, badges a Badge, avaliação por
// estrelas passa a ícone Star da lucide-react (mesmo padrão de
// components/ai-tutor/MessageBubble.tsx).

'use client';

import { ArrowLeft, Check, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  COURSE_LEVEL_MAP,
  COURSE_STATUS_MAP,
  EnrollBadge,
  LessonIcon,
  Skeleton,
  fmtDuration,
} from './shared';
import { CourseThumbnail } from './CourseThumbnail';
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
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-5"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        Voltar ao catálogo
      </button>

      {/* Player Layout: sidebar + content */}
      {isEnrolled && activeLesson ? (
        <div className="grid grid-cols-[1fr_300px] gap-5 mb-6">
          {/* Player principal */}
          <div>
            <div className="bg-ink rounded-card overflow-hidden aspect-video flex items-center justify-center mb-3">
              {activeLesson.type === 'VIDEO' ? (
                <div className="text-canvas text-center">
                  <div className="text-5xl mb-3">▶</div>
                  <div className="text-sm text-canvas/80">
                    {activeLesson.title}
                  </div>
                  <div className="text-xs text-canvas/60 mt-1">
                    Player de vídeo aqui (embed YouTube/Vimeo/próprio)
                  </div>
                </div>
              ) : (
                <div className="text-canvas text-center">
                  <div className="text-5xl mb-3">
                    <LessonIcon type={activeLesson.type} />
                  </div>
                  <div className="text-sm text-canvas/80">
                    {activeLesson.title}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {activeLesson.title}
                </h3>
                {activeLesson.durationMinutes && (
                  <span className="text-xs text-ink-faint">
                    {fmtDuration(null, activeLesson.durationMinutes)}
                  </span>
                )}
              </div>
              <Button
                onClick={onMarkComplete}
                disabled={completing || activeLesson.completed}
                intent={activeLesson.completed ? 'secondary' : 'primary'}
              >
                {activeLesson.completed ? (
                  <>
                    <Check size={16} strokeWidth={1.75} /> Concluída
                  </>
                ) : completing ? (
                  'A marcar…'
                ) : (
                  'Marcar concluída'
                )}
              </Button>
            </div>
            {/* Progress */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-ink-muted">
                  Progresso geral
                </span>
                <span className="text-xs font-mono font-medium text-primary">
                  {progressPct}%
                </span>
              </div>
              <ProgressBar value={progressPct} className="h-2.5" />
              <div className="text-xs text-ink-faint mt-1">
                {progress?.courseProgress?.completedLessons ?? 0}/
                {progress?.courseProgress?.totalLessons ?? 0} aulas concluídas
              </div>
            </Card>
          </div>

          {/* Sidebar — lista de aulas */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
              Conteúdo do curso
            </div>
            <div className="overflow-y-auto max-h-[450px]">
              {(progress?.modules ?? []).map((mod) => (
                <div key={mod.id}>
                  <div className="px-4 py-2 bg-surface-sunken border-b border-border">
                    <div className="text-xs font-medium text-ink-muted">
                      {mod.title}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {mod.completedCount}/{mod.totalCount} aulas
                    </div>
                  </div>
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => onSelectLesson(lesson)}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-border cursor-pointer transition-colors ${
                        activeLesson?.id === lesson.id
                          ? 'bg-primary-subtle'
                          : 'hover:bg-surface-sunken'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                          lesson.completed
                            ? 'bg-success-subtle text-success-ink'
                            : 'bg-surface-sunken text-ink-faint'
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
                          className={`text-xs truncate ${activeLesson?.id === lesson.id ? 'text-primary font-medium' : 'text-ink-muted'}`}
                        >
                          {lesson.title}
                        </div>
                        {lesson.durationMinutes && (
                          <div className="text-xs text-ink-faint">
                            {fmtDuration(null, lesson.durationMinutes)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        /* Header do curso (não matriculado) */
        <div className="grid grid-cols-[1fr_320px] gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {course.category && (
                <span className="text-xs text-primary font-medium">
                  {course.category}
                </span>
              )}
              <StatusBadge value={course.level} map={COURSE_LEVEL_MAP} />
              <StatusBadge
                value={course.status}
                map={COURSE_STATUS_MAP}
                variant="dot"
              />
              {course.mandatory && <Badge intent="danger">Obrigatório</Badge>}
            </div>
            <h1 className="text-2xl font-semibold text-ink mb-2">
              {course.title}
            </h1>
            {course.shortDescription && (
              <p className="text-sm text-ink-muted mb-4">
                {course.shortDescription}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-ink-muted mb-4">
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
              <div className="bg-success-subtle rounded-card p-4 mb-4">
                <div className="text-xs font-medium text-success-ink mb-2 uppercase tracking-wide">
                  Objectivos de aprendizagem
                </div>
                <ul className="space-y-1">
                  {course.learningObjectives.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-success-ink"
                    >
                      <span className="mt-0.5">✓</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA card */}
          <Card className="p-5">
            {course.thumbnailUrl && (
              <div className="aspect-video rounded-control overflow-hidden mb-4 relative">
                <CourseThumbnail src={course.thumbnailUrl} alt={course.title} />
              </div>
            )}
            {!isEnrolled && course.status === 'PUBLISHED' && (
              <Button
                onClick={onEnroll}
                disabled={enrolling}
                className="w-full"
              >
                {enrolling ? 'A matricular…' : 'Inscrever-me gratuitamente'}
              </Button>
            )}
            {isEnrolled && (
              <div className="space-y-2">
                <EnrollBadge
                  status={progress!.enrollment.status}
                  deadline={progress!.enrollment.deadline}
                />
                <ProgressBar value={progressPct} className="h-2.5" />
                <div className="text-xs text-ink-faint text-center">
                  {progressPct}% concluído
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Módulos accordion */}
      {!isEnrolled && course.modules && (
        <Card className="overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-ink">
            Conteúdo do curso
          </div>
          {course.modules.map((mod) => (
            <details
              key={mod.id}
              className="border-b border-border last:border-0"
            >
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-sunken">
                <span className="text-sm font-medium text-ink">
                  {mod.title}
                </span>
                <span className="text-xs text-ink-faint">
                  {mod.lessons?.length ?? 0} aulas
                </span>
              </summary>
              <div className="px-4 pb-2">
                {mod.lessons?.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 py-1.5 text-xs text-ink-muted border-b border-border last:border-0"
                  >
                    <LessonIcon type={l.type} />
                    <span className="flex-1">{l.title}</span>
                    {l.durationMinutes && (
                      <span className="text-ink-faint">
                        {fmtDuration(null, l.durationMinutes)}
                      </span>
                    )}
                    {l.isFree && (
                      <span className="text-success font-medium">Grátis</span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </Card>
      )}

      {/* Feedback section */}
      {isEnrolled && progress?.enrollment.status === 'COMPLETED' && (
        <Card className="p-5 mb-6">
          <div className="text-sm font-semibold text-ink mb-3">
            Avalie este curso
          </div>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => onRatingChange(s)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={20}
                  strokeWidth={1.75}
                  className={
                    s <= rating
                      ? 'fill-current text-warning-ink'
                      : 'text-ink-faint'
                  }
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={3}
            placeholder="Partilhe a sua experiência…"
            className="w-full resize-none mb-3"
          />
          <Button onClick={onFeedback} disabled={!rating || feedbackLoading}>
            {feedbackLoading ? 'A enviar…' : 'Enviar avaliação'}
          </Button>
        </Card>
      )}

      {/* Feedbacks existentes */}
      {(course.feedbacks?.length ?? 0) > 0 && (
        <Card className="p-5">
          <div className="text-sm font-semibold text-ink mb-3">Avaliações</div>
          <div className="space-y-3">
            {course.feedbacks?.map((f) => (
              <div
                key={f.id}
                className="border-b border-border pb-3 last:border-0"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-ink">
                    {f.user.fullName}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: f.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        strokeWidth={1.75}
                        className="fill-current text-warning-ink"
                      />
                    ))}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">{f.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
