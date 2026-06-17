// src/components/CourseAvatarReader.tsx
// Avatar de leitura com voz ElevenLabs — INNOVA Academy
//
// ─── SETUP (fazer uma vez) ────────────────────────────────────────────────────
//
//  1. Criar conta gratuita em: https://elevenlabs.io
//
//  2. Clonar a tua voz:
//     → Perfil → "Voice Lab" → "Add Voice" → "Voice Cloning"
//     → Gravar ou fazer upload de 1–5 minutos de áudio
//     → Guardar o Voice ID (ex: "abc123xyz...")
//
//  3. Obter API Key:
//     → Perfil → "API Key" → copiar
//
//  4. Adicionar ao .env.local do projecto Next.js:
//       NEXT_PUBLIC_ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//       NEXT_PUBLIC_ELEVENLABS_VOICE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
//
//  5. Usar o componente na página de aula (só para contentType === 'TEXT'):
//       import { CourseAvatarReader } from '@/components/CourseAvatarReader';
//       {lesson.contentType === 'TEXT' && lesson.textContent && (
//         <CourseAvatarReader
//           text={lesson.textContent}
//           avatarSrc="/images/avatar.png"
//           avatarName="Ana — INNOVA Academy"
//         />
//       )}
//
// ─── QUOTA GRÁTIS ─────────────────────────────────────────────────────────────
//  • 10.000 chars/mês → ~20–30 aulas médias
//  • O componente guarda o áudio em cache (sessionStorage) para não gastar
//    quota ao reler a mesma aula na mesma sessão
//  • Para quota maior: plano Starter ($5/mês) = 30.000 chars
//
// =============================================================================


'use client';

import { useState, useEffect } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseStatus    = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type CourseLevel     = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type LessonType      = 'VIDEO' | 'PDF' | 'TEXT' | 'AUDIO' | 'SLIDE' | 'LINK' | 'SCORM' | 'QUIZ';
type EnrollmentStatus= 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

interface Course {
  id: number;
  title: string;
  shortDescription: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  workloadHours: number | null;
  language: string;
  level: CourseLevel;
  status: CourseStatus;
  mandatory: boolean;
  internalCode: string | null;
  learningObjectives: string[];
  passingScore: number | null;
  createdAt: string;
  publishedAt: string | null;
  _count: { enrollments: number; feedbacks: number; modules: number };
  competencies: Array<{ competency: { id: number; name: string } }>;
}

interface Lesson {
  id: number;
  title: string;
  type: LessonType;
  seq: number;
  durationMinutes: number | null;
  isFree: boolean;
  completed: boolean;
  resumePosition: number;
}

interface CourseModule {
  id: number;
  title: string;
  seq: number;
  lessons: Lesson[];
  completedCount: number;
  totalCount: number;
}

interface CourseProgress {
  enrollment: { id: number; status: EnrollmentStatus; deadline: string | null };
  courseProgress: { totalLessons: number; completedLessons: number; pct: number };
  modules: CourseModule[];
}

interface Certificate {
  id: number;
  code: string;
  issuedAt: string;
  expiresAt: string | null;
  course: { id: number; title: string; thumbnailUrl: string | null; category: string | null };
}

interface PaginatedCourses {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminDashboard {
  courses:        { total: number; published: number };
  enrollments:    { total: number; completed: number; overdue: number };
  completionRate: number;
  topCourses:     Course[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(h: number | null, minutes?: number | null): string {
  if (minutes) return minutes < 60 ? `${minutes}min` : `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
  if (!h) return '—';
  return `${h}h`;
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(deadline: string | null): boolean {
  return !!deadline && new Date() > new Date(deadline);
}

// ─── Badge components ─────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: CourseLevel }) {
  const cfg: Record<CourseLevel, { label: string; cls: string }> = {
    BEGINNER:     { label: 'Iniciante',     cls: 'bg-emerald-50 text-emerald-700' },
    INTERMEDIATE: { label: 'Intermédio',    cls: 'bg-amber-50 text-amber-700' },
    ADVANCED:     { label: 'Avançado',      cls: 'bg-red-50 text-red-700' },
  };
  const { label, cls } = cfg[level];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const cfg: Record<CourseStatus, { label: string; cls: string }> = {
    DRAFT:     { label: 'Rascunho',   cls: 'bg-gray-100 text-gray-500' },
    PUBLISHED: { label: 'Publicado',  cls: 'bg-emerald-50 text-emerald-700' },
    ARCHIVED:  { label: 'Arquivado',  cls: 'bg-gray-100 text-gray-400' },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />{label}
    </span>
  );
}

function EnrollBadge({ status, deadline }: { status: EnrollmentStatus; deadline: string | null }) {
  const overdue = isOverdue(deadline);
  const cfg: Record<EnrollmentStatus, { label: string; cls: string }> = {
    NOT_STARTED: { label: 'Não iniciado', cls: 'bg-gray-100 text-gray-500' },
    IN_PROGRESS: { label: 'Em progresso', cls: 'bg-blue-50 text-blue-700' },
    COMPLETED:   { label: 'Concluído',    cls: 'bg-emerald-50 text-emerald-700' },
    EXPIRED:     { label: 'Expirado',     cls: 'bg-red-50 text-red-600' },
  };
  const { label, cls } = cfg[status];
  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>
      {overdue && status !== 'COMPLETED' && (
        <span className="text-xs text-red-600 font-medium">⚠ Prazo expirado</span>
      )}
    </div>
  );
}

function LessonIcon({ type }: { type: LessonType }) {
  const icons: Record<LessonType, string> = {
    VIDEO: '▶', PDF: '📄', TEXT: '📝', AUDIO: '🎵',
    SLIDE: '📊', LINK: '🔗', SCORM: '📦', QUIZ: '❓',
  };
  return <span className="text-sm">{icons[type] ?? '📄'}</span>;
}

function ProgressBar({ pct, size = 'sm' }: { pct: number; size?: 'sm' | 'md' }) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={`w-full ${h} bg-gray-100 rounded-full overflow-hidden`}>
      <div
        className={`${h} bg-blue-600 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-28 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  onClick,
  enrollmentStatus,
  progress,
}: {
  course: Course;
  onClick: () => void;
  enrollmentStatus?: EnrollmentStatus;
  progress?: number;
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            📚
          </div>
        )}
        {course.mandatory && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">
            Obrigatório
          </span>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-gray-200">
              <div className="h-1 bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Category */}
        {course.category && (
          <div className="text-xs text-blue-600 font-medium mb-1">{course.category}</div>
        )}
        {/* Title */}
        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</div>
        {/* Short desc */}
        {course.shortDescription && (
          <div className="text-xs text-gray-500 mb-2 line-clamp-2">{course.shortDescription}</div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          {course.workloadHours && <span>⏱ {fmtDuration(course.workloadHours)}</span>}
          <LevelBadge level={course.level} />
          <span>👥 {course._count.enrollments}</span>
        </div>

        {/* Enrollment status */}
        {enrollmentStatus && (
          <EnrollBadge status={enrollmentStatus} deadline={null} />
        )}
      </div>
    </div>
  );
}

// ─── View: Catalog ────────────────────────────────────────────────────────────

function CatalogView({ onSelect }: { onSelect: (id: number) => void }) {
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel]     = useState('');
  const [mandatory, setMandatory] = useState('');
  const [page, setPage]       = useState(1);

  const debouncedSearch = useDebounce(search);
  const params = {
    page, limit: 12, status: 'PUBLISHED',
    search: debouncedSearch, category, level, mandatory,
  };

  // Lista e categorias correm em paralelo (queries independentes).
  const { data, isLoading: loading, error } = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list(params), '/courses',
    { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
  );
  // Categorias mudam pouco → cache longa (STATIC).
  const { data: cats = [] } = useApiQuery<Array<{ category: string; count: number }>>(
    queryKeys.courses.categories(), '/courses/categories',
    { staleTime: STALE_TIME.STATIC },
  );
  const categories = cats.map(c => c.category).filter(Boolean) as string[];

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Pesquisar cursos, competências, tópicos…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os níveis</option>
          <option value="BEGINNER">Iniciante</option>
          <option value="INTERMEDIATE">Intermédio</option>
          <option value="ADVANCED">Avançado</option>
        </select>
        <select value={mandatory} onChange={e => { setMandatory(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Obrigatório e opcional</option>
          <option value="true">Apenas obrigatórios</option>
          <option value="false">Apenas opcionais</option>
        </select>
      </div>

      {error && <div className="text-sm text-red-500 mb-4">{error.message}</div>}

      {loading && <Skeleton rows={3} />}

      {!loading && data && (
        <>
          <div className="text-xs text-gray-400 mb-4">{data.total} cursos encontrados</div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {data.data.map(course => (
              <CourseCard key={course.id} course={course} onClick={() => onSelect(course.id)} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Página {data.page} de {data.totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  ← Anterior
                </button>
                <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── View: Course Detail + Player ────────────────────────────────────────────

function CourseDetail({ courseId, onBack }: { courseId: number; onBack: () => void }) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');

  // course e progress em paralelo. O progress dá 4xx quando não inscrito → o RQ
  // não repete 4xx; tratamos a ausência como "não inscrito" (progress = null).
  const { data: course, isLoading: loadingCourse } = useApiQuery<
    Course & { modules: any[]; feedbacks: any[] }
  >(queryKeys.courses.detail(courseId), `/courses/${courseId}`, {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
  const { data: progress = null } = useApiQuery<CourseProgress>(
    queryKeys.courses.progress(courseId), `/courses/${courseId}/progress`,
    { staleTime: STALE_TIME.DYNAMIC, retry: false },
  );

  // Auto-selecciona a 1ª aula incompleta quando o progresso chega.
  useEffect(() => {
    if (!progress || activeLesson) return;
    for (const mod of progress.modules) {
      const pending = mod.lessons.find((l: Lesson) => !l.completed);
      if (pending) { setActiveLesson(pending); break; }
    }
  }, [progress, activeLesson]);

  const enroll = useApiMutation(
    () => apiClient.post(`/courses/${courseId}/enroll`, {}),
    {
      invalidateKeys: [
        queryKeys.courses.detail(courseId),
        queryKeys.courses.progress(courseId),
        queryKeys.courses.myEnrollments(),
      ],
      onError: (e) => alert(e.message),
    },
  );

  const markComplete = useApiMutation(
    (lessonId: number) => apiClient.post(`/courses/lessons/${lessonId}/complete`, {}),
    {
      invalidateKeys: [
        queryKeys.courses.progress(courseId),
        queryKeys.courses.detail(courseId),
      ],
      onError: (e) => alert(e.message),
    },
  );

  const feedback = useApiMutation(
    () => apiClient.post(`/courses/${courseId}/feedback`, { rating, comment }),
    {
      invalidateKeys: [queryKeys.courses.detail(courseId)],
      onSuccess: () => { alert('Obrigado pelo feedback!'); setRating(0); setComment(''); },
      onError: (e) => alert(e.message),
    },
  );

  const handleEnroll = () => enroll.mutate(undefined);
  const handleMarkComplete = () => { if (activeLesson) markComplete.mutate(activeLesson.id); };
  const handleFeedback = () => { if (rating) feedback.mutate(undefined); };
  const enrolling = enroll.isPending;
  const completing = markComplete.isPending;
  const feedbackLoading = feedback.isPending;

  if (loadingCourse || !course) return <div><Skeleton rows={5} /></div>;

  const isEnrolled = !!progress?.enrollment;
  const progressPct = progress?.courseProgress.pct ?? 0;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
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
                  <div className="text-sm text-gray-300">{activeLesson.title}</div>
                  <div className="text-xs text-gray-500 mt-1">Player de vídeo aqui (embed YouTube/Vimeo/próprio)</div>
                </div>
              ) : (
                <div className="text-white text-center">
                  <div className="text-5xl mb-3"><LessonIcon type={activeLesson.type} /></div>
                  <div className="text-sm text-gray-300">{activeLesson.title}</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{activeLesson.title}</h3>
                {activeLesson.durationMinutes && (
                  <span className="text-xs text-gray-400">{fmtDuration(null, activeLesson.durationMinutes)}</span>
                )}
              </div>
              <button
                onClick={handleMarkComplete}
                disabled={completing || activeLesson.completed}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  activeLesson.completed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {activeLesson.completed ? '✓ Concluída' : completing ? 'A marcar…' : 'Marcar concluída'}
              </button>
            </div>
            {/* Progress */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Progresso geral</span>
                <span className="text-xs font-mono font-medium text-blue-700">{progressPct}%</span>
              </div>
              <ProgressBar pct={progressPct} size="md" />
              <div className="text-xs text-gray-400 mt-1">
                {progress?.courseProgress.completedLessons}/{progress?.courseProgress.totalLessons} aulas concluídas
              </div>
            </div>
          </div>

          {/* Sidebar — lista de aulas */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Conteúdo do curso
            </div>
            <div className="overflow-y-auto max-h-[450px]">
              {progress?.modules.map(mod => (
                <div key={mod.id}>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-700">{mod.title}</div>
                    <div className="text-xs text-gray-400">{mod.completedCount}/{mod.totalCount} aulas</div>
                  </div>
                  {mod.lessons.map(lesson => (
                    <div
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 cursor-pointer transition-colors ${
                        activeLesson?.id === lesson.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                        lesson.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {lesson.completed ? '✓' : <LessonIcon type={lesson.type} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs truncate ${activeLesson?.id === lesson.id ? 'text-blue-800 font-medium' : 'text-gray-700'}`}>
                          {lesson.title}
                        </div>
                        {lesson.durationMinutes && (
                          <div className="text-xs text-gray-400">{fmtDuration(null, lesson.durationMinutes)}</div>
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
              {course.category && <span className="text-xs text-blue-600 font-medium">{course.category}</span>}
              <LevelBadge level={course.level} />
              <StatusBadge status={course.status} />
              {course.mandatory && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded">Obrigatório</span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{course.title}</h1>
            {course.shortDescription && (
              <p className="text-sm text-gray-600 mb-4">{course.shortDescription}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              {course.workloadHours && <span>⏱ {fmtDuration(course.workloadHours)}</span>}
              <span>👥 {course._count.enrollments} matriculados</span>
              <span>📋 {course._count.modules} módulos</span>
              {course.internalCode && <span className="font-mono text-xs">{course.internalCode}</span>}
            </div>
            {course.learningObjectives.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                <div className="text-xs font-medium text-emerald-700 mb-2 uppercase tracking-wide">Objectivos de aprendizagem</div>
                <ul className="space-y-1">
                  {course.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-emerald-800">
                      <span className="text-emerald-500 mt-0.5">✓</span>{obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* CTA card */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            {course.thumbnailUrl && (
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}
            {!isEnrolled && course.status === 'PUBLISHED' && (
              <button
                onClick={handleEnroll}
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
                <div className="text-xs text-gray-400 text-center">{progressPct}% concluído</div>
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
          {course.modules.map((mod: any) => (
            <details key={mod.id} className="border-b border-gray-100 last:border-0">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50">
                <span className="text-sm font-medium text-gray-800">{mod.title}</span>
                <span className="text-xs text-gray-400">{mod.lessons?.length ?? 0} aulas</span>
              </summary>
              <div className="px-4 pb-2">
                {mod.lessons?.map((l: any) => (
                  <div key={l.id} className="flex items-center gap-2 py-1.5 text-xs text-gray-600 border-b border-gray-50 last:border-0">
                    <LessonIcon type={l.type} />
                    <span className="flex-1">{l.title}</span>
                    {l.durationMinutes && <span className="text-gray-400">{fmtDuration(null, l.durationMinutes)}</span>}
                    {l.isFree && <span className="text-emerald-600 font-medium">Grátis</span>}
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
          <div className="text-sm font-semibold text-gray-900 mb-3">Avalie este curso</div>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className={`text-2xl transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Partilhe a sua experiência…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
          />
          <button
            onClick={handleFeedback}
            disabled={!rating || feedbackLoading}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {feedbackLoading ? 'A enviar…' : 'Enviar avaliação'}
          </button>
        </div>
      )}

      {/* Feedbacks existentes */}
      {course.feedbacks?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3">Avaliações</div>
          <div className="space-y-3">
            {course.feedbacks.map((f: any) => (
              <div key={f.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-800">{f.user.fullName}</span>
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

// ─── View: My Enrollments ────────────────────────────────────────────────────

function MyEnrollmentsView({ onSelect }: { onSelect: (id: number) => void }) {
  const [filter, setFilter] = useState('');

  const { data = [], isLoading: loading, error } = useApiQuery<any[]>(
    queryKeys.courses.myEnrollments(), '/courses/my/enrollments',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const filtered = filter ? data.filter(e => e.status === filter) : data;

  if (loading) return <Skeleton />;
  if (error)   return <div className="text-sm text-red-500">{error.message}</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === s ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {{ '': 'Todos', NOT_STARTED: 'Não iniciados', IN_PROGRESS: 'Em progresso', COMPLETED: 'Concluídos' }[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem matrículas encontradas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e: any) => (
            <div
              key={e.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(e.courseId)}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {e.course.thumbnailUrl ? (
                  <img src={e.course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">📚</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">{e.course.title}</div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  {e.course.category && <span>{e.course.category}</span>}
                  {e.course.workloadHours && <span>⏱ {fmtDuration(e.course.workloadHours)}</span>}
                </div>
                <EnrollBadge status={e.status} deadline={e.deadline} />
              </div>
              {e.mandatory && (
                <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded flex-shrink-0">Obrigatório</span>
              )}
              {e.deadline && (
                <div className={`text-xs flex-shrink-0 ${isOverdue(e.deadline) ? 'text-red-600' : 'text-gray-400'}`}>
                  {isOverdue(e.deadline) ? '⚠ Atrasado' : `Prazo: ${fmtDate(e.deadline)}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Certificates ───────────────────────────────────────────────────────

function CertificatesView() {
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const { data = [], isLoading: loading } = useApiQuery<Certificate[]>(
    queryKeys.courses.myCertificates(), '/courses/my/certificates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // Verificação on-demand de um código → mutação (acção pontual, não cacheada).
  const verifyMut = useApiMutation(
    (code: string) => apiClient.get<any>(`/courses/certificates/verify/${code}`),
    {
      onSuccess: (r) => setVerifyResult(r),
      onError: (e) => setVerifyResult({ error: e.message }),
    },
  );
  const verify = () => { if (verifyCode.trim()) verifyMut.mutate(verifyCode.trim()); };

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Verificar certificado */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Verificar certificado</div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Código do certificado (ex: CERT-1-42-1234567890)"
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={verify}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            Verificar
          </button>
        </div>
        {verifyResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${verifyResult.error ? 'bg-red-50 text-red-700' : verifyResult.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
            {verifyResult.error
              ? `❌ ${verifyResult.error}`
              : verifyResult.valid
                ? `✅ Certificado válido — ${verifyResult.user?.fullName} — ${verifyResult.course?.title}`
                : `⚠ Certificado expirado`}
          </div>
        )}
      </div>

      {/* Meus certificados */}
      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem certificados ainda. Conclua um curso para obter o seu!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data.map(cert => (
            <div key={cert.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-5 text-white">
                <div className="text-xs text-blue-200 mb-1">Certificado de conclusão</div>
                <div className="text-base font-semibold">{cert.course.title}</div>
                <div className="text-xs text-blue-300 mt-1 font-mono">{cert.code}</div>
              </div>
              <div className="px-4 py-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Emitido: {fmtDate(cert.issuedAt)}</span>
                  {cert.expiresAt && (
                    <span className={new Date() > new Date(cert.expiresAt) ? 'text-red-600' : ''}>
                      Validade: {fmtDate(cert.expiresAt)}
                    </span>
                  )}
                </div>
                <button className="mt-2 w-full py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                  ⬇ Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Admin Dashboard ───────────────────────────────────────────────────

function AdminDashboardView({ onSelect }: { onSelect: (id: number) => void }) {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.courses.adminDashboard(), '/courses/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de cursos',   value: data.courses.total,        sub: `${data.courses.published} publicados` },
          { label: 'Total matrículas',  value: data.enrollments.total,    sub: undefined },
          { label: 'Taxa de conclusão', value: `${data.completionRate}%`, sub: `${data.enrollments.completed} concluídas`, color: 'text-emerald-600' },
          { label: 'Atrasos',           value: data.enrollments.overdue,  sub: 'deadlines vencidos', color: data.enrollments.overdue > 0 ? 'text-red-600' : undefined },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
            {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Top cursos */}
      {data.topCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cursos mais populares
          </div>
          {data.topCourses.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(c.id)}
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">{idx + 1}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{c.title}</div>
                <div className="text-xs text-gray-400">{c.category ?? '—'} · {c.level}</div>
              </div>
              <div className="text-sm text-gray-500">{(c as any)._count.enrollments} matrículas</div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

type View = 'catalog' | 'detail' | 'my-courses' | 'certificates' | 'dashboard';

const NAV: Array<{ id: View; label: string }> = [
  { id: 'catalog',      label: 'Catálogo' },
  { id: 'my-courses',   label: 'Os meus cursos' },
  { id: 'certificates', label: 'Certificados' },
  { id: 'dashboard',    label: 'Dashboard (Admin)' },
];

const TITLES: Record<View, string> = {
  catalog:      'Catálogo de Cursos',
  detail:       'Curso',
  'my-courses': 'Os meus cursos',
  certificates: 'Os meus certificados',
  dashboard:    'Dashboard de Formação',
};

export default function CoursesPage() {
  const [view, setView]         = useState<View>('catalog');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('catalog');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{TITLES[view]}</h1>
          <p className="text-sm text-gray-400 mt-0.5">INNOVA — Academia Corporativa</p>
        </div>
        {view === 'catalog' && (
          <button
            onClick={() => alert('Abrir formulário de criação de curso')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Criar curso
          </button>
        )}
      </div>

      {/* Tabs */}
      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'catalog'      && <CatalogView onSelect={handleSelect} />}
      {view === 'detail' && selectedId !== null && (
        <CourseDetail courseId={selectedId} onBack={handleBack} />
      )}
      {view === 'my-courses'   && <MyEnrollmentsView onSelect={handleSelect} />}
      {view === 'certificates' && <CertificatesView />}
      {view === 'dashboard'    && <AdminDashboardView onSelect={handleSelect} />}
    </div>
  );
}
