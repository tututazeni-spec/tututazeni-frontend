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

import {
  headerBackground,
  PALETTE,
} from '@/components/onboarding/TemplateCard';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowLeft,
  Check,
  Star,
  Clock,
  Users,
  ClipboardList,
  Award,
  GraduationCap,
  Route,
  Download,
  Layers,
  Globe,
} from 'lucide-react';
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

  // Curso exige aprovação (Course.requiresApproval) — o registo Enrollment já
  // existe (isEnrolled fica true) mas o acesso ao conteúdo só faz sentido
  // depois de RH/instrutor aprovar (courses.controller.ts:
  // PATCH /courses/enrollments/:id/approve). Ver secção "2. Botão principal"
  // de docs/06-modulo-courses.md.
  const pendingApproval = progress?.enrollment.status === 'PENDING_APPROVAL';

  const continueOrReviewLesson = () => {
    const modules = progress?.modules ?? [];
    const target =
      modules.flatMap((m) => m.lessons).find((l) => !l.completed) ??
      modules[0]?.lessons[0];
    if (target) onSelectLesson(target);
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-5"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        Voltar ao catálogo
      </button>

      {isEnrolled && pendingApproval && (
        <Card className="p-5 mb-6 bg-warning-subtle">
          <p className="m-0 text-sm font-medium text-black">
            Pedido de inscrição enviado — aguarda aprovação
          </p>
          <p className="m-0 mt-1 text-xs text-black">
            Este curso requer aprovação para inscrição. Vais poder aceder ao
            conteúdo assim que o pedido for aprovado.
          </p>
        </Card>
      )}

      {/* Player Layout: sidebar + content */}
      {isEnrolled && !pendingApproval && activeLesson ? (
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
          <Section title="Conteúdo do curso" soft bare className="self-start">
            <div className="max-h-[450px] overflow-y-auto">
              {(progress?.modules ?? []).map((mod) => (
                <div key={mod.id}>
                  <div className="border-b border-border bg-surface-sunken px-4 py-2">
                    <div className="text-xs font-semibold text-ink">
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
                      className={`flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 transition-colors ${
                        activeLesson?.id === lesson.id
                          ? 'bg-primary-subtle'
                          : 'hover:bg-surface-sunken'
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs ${
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
                      <div className="min-w-0 flex-1">
                        <div
                          className={`truncate text-xs ${activeLesson?.id === lesson.id ? 'font-medium text-primary' : 'text-ink-muted'}`}
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
          </Section>
        </div>
      ) : (
        /* Header do curso (não matriculado) */
        <div className="grid grid-cols-[1fr_320px] gap-6 mb-6">
          <div>
            <div className="mb-4">
              {/* Desenho do cartão ROI Total (roi-impact/RoiTotalCard), com o
                  gradiente da cor do cartão do curso na lista. */}
              <div
                className="overflow-hidden rounded-panel p-5 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]"
                style={{
                  background: (([c1, c2, c3]) =>
                    `linear-gradient(160deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`)(
                    PALETTE[Math.abs(course.id) % PALETTE.length],
                  ),
                }}
              >
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <StatusBadge value={course.level} map={COURSE_LEVEL_MAP} />
                    <StatusBadge
                      value={course.status}
                      map={COURSE_STATUS_MAP}
                      variant="dot"
                    />
                    {course.mandatory && (
                      <Badge intent="danger">Obrigatório</Badge>
                    )}
                  </div>
                  <h1 className="mb-1 font-display text-xl font-bold leading-snug text-white">
                    {course.title}
                  </h1>
                  {course.category && (
                    <div className="mb-3 text-sm font-medium text-white">
                      {course.category}
                    </div>
                  )}
                  {course.shortDescription && (
                    <p className="max-w-[60ch] text-sm leading-relaxed text-white">
                      {course.shortDescription}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap mt-5 -mb-2 gap-x-6 gap-y-2 text-sm text-white">
                  {course.workloadHours && (
                    <span className="inline-flex items-center gap-2 ">
                      <Clock
                        size={14}
                        strokeWidth={1.75}
                        className="text-white"
                      />
                      {fmtDuration(course.workloadHours)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 ">
                    <Users
                      size={14}
                      strokeWidth={1.75}
                      className="text-white"
                    />
                    {course._count.enrollments} matriculados
                  </span>
                  <span className="inline-flex items-center gap-2 ">
                    <ClipboardList
                      size={14}
                      strokeWidth={1.75}
                      className="text-white"
                    />
                    {course._count.modules} módulos
                  </span>
                </div>
              </div>
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
          <Card
            className="border-transparent p-5 text-white"
            style={{
              background: headerBackground(
                PALETTE[Math.abs(course.id) % PALETTE.length],
              ),
            }}
          >
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
                {enrolling
                  ? 'A processar…'
                  : course.requiresApproval
                    ? 'Solicitar inscrição'
                    : 'Inscrever-me gratuitamente'}
              </Button>
            )}
            {!isEnrolled && course.status !== 'PUBLISHED' && (
              <Button
                disabled
                className="w-full !border-[#0F1F3D] !bg-[#0F1F3D] !text-white !opacity-100"
              >
                Curso indisponível
              </Button>
            )}
            {isEnrolled && (
              <div className="space-y-2">
                <EnrollBadge
                  status={progress!.enrollment.status}
                  deadline={progress!.enrollment.deadline}
                />
                {!pendingApproval && (
                  <>
                    <ProgressBar value={progressPct} className="h-2.5" />
                    <div className="text-xs text-white/80 text-center mb-2">
                      {progressPct}% concluído
                    </div>
                    {/* docs/06-modulo-courses.md secção 2 — "Continuar curso" /
                        "Rever curso": o resto do CTA card só mostrava o badge
                        de estado, sem acção para entrar no conteúdo quando
                        nenhuma aula estava activa. */}
                    <Button className="w-full" onClick={continueOrReviewLesson}>
                      {progress?.enrollment.status === 'COMPLETED'
                        ? 'Rever curso'
                        : 'Continuar curso'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Estado pós-conclusão — docs/06-modulo-courses.md secção 16 */}
      {isEnrolled && progress?.enrollment.status === 'COMPLETED' && (
        <Card className="p-5 mb-6 bg-success-subtle">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="m-0 text-sm font-semibold text-black flex items-center gap-2">
                <Check size={16} strokeWidth={1.75} /> Curso concluído
              </p>
              {progress.enrollment.completedAt && (
                <p className="m-0 mt-1 text-xs text-black">
                  Concluído em{' '}
                  {new Date(progress.enrollment.completedAt).toLocaleDateString(
                    'pt',
                  )}{' '}
                  · {progressPct}% do conteúdo
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button intent="secondary" onClick={continueOrReviewLesson}>
                Rever curso
              </Button>
              {progress.enrollment.certificate && (
                <>
                  <Button intent="secondary">Ver certificado</Button>
                  {progress.enrollment.certificate.fileUrl && (
                    <a
                      href={progress.enrollment.certificate.fileUrl}
                      download
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-canvas hover:bg-primary/90"
                    >
                      <Download size={14} strokeWidth={1.75} /> Descarregar
                      certificado
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Corpo: coluna principal + coluna lateral */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {(course.description ||
            course.targetAudience.length > 0 ||
            course.requiredCourse) && (
            <Section title="Sobre o curso" soft>
              {course.description && (
                <p className="mb-4 max-w-[68ch] whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {course.description}
                </p>
              )}
              {course.targetAudience.length > 0 && (
                <div className="mb-4">
                  <div className="mb-1.5 text-xs font-semibold text-ink-muted">
                    Para quem se destina
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {course.targetAudience.map((t, i) => (
                      <Badge key={i} intent="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {course.requiredCourse && (
                <div className="rounded-control bg-surface-sunken px-3 py-2 text-xs text-ink-muted">
                  <span className="font-semibold text-ink">Pré-requisito:</span>{' '}
                  {course.requiredCourse.title}
                </div>
              )}
            </Section>
          )}

          {course.competencies.length > 0 && (
            <Section title="Competências desenvolvidas" icon={Layers}>
              <div className="flex flex-wrap gap-1.5">
                {course.competencies.map((c) => (
                  <Badge key={c.competency.id} intent="info">
                    {c.competency.name}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          {(!isEnrolled || pendingApproval) && course.modules && (
            <Section
              title="Conteúdo do curso"
              soft
              icon={ClipboardList}
              aside={`${course.modules.length} módulos`}
              bare
            >
              {course.modules.map((mod) => (
                <details
                  key={mod.id}
                  className="group border-b border-border last:border-0"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-surface-sunken">
                    <span className="text-sm font-medium text-ink">
                      {mod.title}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {mod.lessons?.length ?? 0} aulas
                    </span>
                  </summary>
                  <div className="px-5 pb-2">
                    {mod.lessons?.map((l) => (
                      <div
                        key={l.id}
                        className="flex items-center gap-2 border-b border-border py-2 text-xs text-ink-muted last:border-0"
                      >
                        <LessonIcon type={l.type} />
                        <span className="flex-1">{l.title}</span>
                        {l.durationMinutes && (
                          <span className="text-ink-faint">
                            {fmtDuration(null, l.durationMinutes)}
                          </span>
                        )}
                        {l.isFree && (
                          <span className="font-medium text-success">
                            Grátis
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </Section>
          )}

          {(course.relatedCourses?.length ?? 0) > 0 && (
            <Section title="Cursos relacionados">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {course.relatedCourses!.map((rc) => (
                  <div
                    key={rc.id}
                    className="overflow-hidden rounded-card border border-border"
                  >
                    <div className="aspect-video bg-surface-sunken">
                      {rc.thumbnailUrl && (
                        <CourseThumbnail src={rc.thumbnailUrl} alt={rc.title} />
                      )}
                    </div>
                    <div className="p-2">
                      <div className="truncate text-xs font-medium text-ink">
                        {rc.title}
                      </div>
                      {rc.category && (
                        <div className="text-xs text-ink-faint">
                          {rc.category}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {isEnrolled && progress?.enrollment.status === 'COMPLETED' && (
            <Section title="Avalie este curso" icon={Star}>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => onRatingChange(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={22}
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
                className="mb-3 w-full resize-none"
              />
              <Button
                onClick={onFeedback}
                disabled={!rating || feedbackLoading}
              >
                {feedbackLoading ? 'A enviar…' : 'Enviar avaliação'}
              </Button>
            </Section>
          )}

          {(course.feedbacks?.length ?? 0) > 0 && (
            <Section title="Avaliações">
              <div className="space-y-3">
                {course.feedbacks?.map((f) => (
                  <div
                    key={f.id}
                    className="border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="mb-1 flex items-center gap-2">
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
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Informações adicionais" soft>
            <dl className="-my-2 text-sm">
              {[
                [
                  'Nível',
                  COURSE_LEVEL_MAP[course.level]?.label ?? course.level,
                ],
                course.workloadHours
                  ? ['Duração', fmtDuration(course.workloadHours)]
                  : null,
                ['Módulos', String(course._count.modules)],
                ['Idioma', course.language],
                ['Certificado', course.certificateEnabled ? 'Sim' : 'Não'],
                course.passingScore != null
                  ? ['Nota mínima', `${course.passingScore}%`]
                  : null,
              ]
                .filter((r): r is string[] => r !== null)
                .map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-4 border-b border-border py-2.5 last:border-0"
                  >
                    <dt className="text-ink-muted">{k}</dt>
                    <dd className="font-medium text-ink">{v}</dd>
                  </div>
                ))}
            </dl>
          </Section>

          {(course.primaryInstructor ||
            (course.instructors?.length ?? 0) > 0) && (
            <Section title="Instrutor(es)" soft icon={GraduationCap}>
              <div className="space-y-3">
                {course.primaryInstructor && (
                  <InstructorRow
                    name={course.primaryInstructor.fullName}
                    avatarUrl={course.primaryInstructor.avatarUrl}
                    role="Instrutor principal"
                  />
                )}
                {course.instructors
                  ?.filter((i) => i.userId !== course.primaryInstructorId)
                  .map((i) => (
                    <InstructorRow
                      key={i.id}
                      name={i.user.fullName}
                      avatarUrl={i.user.avatarUrl}
                    />
                  ))}
              </div>
            </Section>
          )}

          {course.certificateEnabled && (
            <Section title="Certificação" icon={Award}>
              <ul className="space-y-1.5 text-sm text-ink-muted">
                {course.certificateCriteria && (
                  <li>{course.certificateCriteria}</li>
                )}
                {course.passingScore != null && (
                  <li>Nota mínima: {course.passingScore}%</li>
                )}
                {course.minCompletionPercent != null && (
                  <li>Conclusão mínima: {course.minCompletionPercent}%</li>
                )}
                {course.certificateValidityDays && (
                  <li>Validade: {course.certificateValidityDays} dias</li>
                )}
              </ul>
            </Section>
          )}

          {(course.learningPaths?.length ?? 0) > 0 && (
            <Section title="Percursos de aprendizagem" icon={Route}>
              {course.learningPaths!.map((lp) => (
                <p key={lp.id} className="text-sm text-ink-muted">
                  Este curso faz parte de:{' '}
                  <span className="font-medium text-ink">{lp.title}</span>
                </p>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/** Cartão de secção: faixa azul-marinho no topo (padrão dos cartões de
 *  evaluation360) e corpo claro. `bare` dispensa o padding do corpo. */
function Section({
  title,
  icon: Icon,
  aside,
  bare,
  soft,
  className,
  children,
}: {
  title: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  aside?: string;
  bare?: boolean;
  /** Faixa a 60% de opacidade. */
  soft?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`overflow-hidden ${className ?? ''}`}>
      <h3
        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white ${
          soft ? 'bg-[#0F1F3D]/60' : 'bg-[#0F1F3D]'
        }`}
      >
        {Icon && <Icon size={16} strokeWidth={1.75} />}
        <span className="flex-1">{title}</span>
        {aside && (
          <span className="text-xs font-normal text-white/70">{aside}</span>
        )}
      </h3>
      <div className={bare ? '' : 'p-5'}>{children}</div>
    </Card>
  );
}

function InstructorRow({
  name,
  avatarUrl,
  role,
}: {
  name: string;
  avatarUrl: string | null;
  role?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div>
        <div className="text-sm font-medium text-ink">{name}</div>
        {role && <div className="text-xs text-ink-faint">{role}</div>}
      </div>
    </div>
  );
}
