'use client';

import { useState, useEffect } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import Image from 'next/image';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type {
  Course,
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
  Lesson,
} from '@/components/courses/types';
import {
  COURSE_LEVEL_MAP,
  COURSE_STATUS_MAP,
  EnrollBadge,
  LessonIcon,
  ProgressBar,
  Skeleton,
  fmtDuration,
  isOverdue,
} from '@/components/courses/shared';
import { useCourseDetail } from '@/hooks/useCourseDetail';
import { CourseDetailView } from '@/components/courses/CourseDetailView';

// ─── Types ────────────────────────────────────────────────────────────────────
// Course/Lesson/CourseModule/CourseStatus/CourseLevel/LessonType/
// EnrollmentStatus vivem em components/courses/types.ts (partilhados com
// CourseDetail). CourseProgress/CourseDetailModule/CourseFeedback também lá,
// mas só usados por CourseDetail.

interface Certificate {
  id: number;
  code: string;
  issuedAt: string;
  expiresAt: string | null;
  course: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
  };
}

interface PaginatedCourses {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface AdminDashboard {
  courses: { total: number; published: number };
  enrollments: { total: number; completed: number; overdue: number };
  completionRate: number;
  topCourses: Course[];
}

interface MyEnrollment {
  id: number;
  courseId: number;
  status: EnrollmentStatus;
  deadline: string | null;
  mandatory?: boolean;
  course: {
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
    workloadHours: number | null;
  };
}

interface CertificateVerifyResult {
  valid?: boolean;
  error?: string;
  user?: { fullName: string };
  course?: { title: string };
}

// fmtDuration/isOverdue/COURSE_LEVEL_MAP/COURSE_STATUS_MAP/EnrollBadge/
// LessonIcon/ProgressBar/Skeleton vivem em components/courses/shared.tsx
// (partilhados com CourseDetailView, importados no topo do ficheiro).

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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
          />
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
              <div
                className="h-1 bg-blue-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Category */}
        {course.category && (
          <div className="text-xs text-blue-600 font-medium mb-1">
            {course.category}
          </div>
        )}
        {/* Title */}
        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
          {course.title}
        </div>
        {/* Short desc */}
        {course.shortDescription && (
          <div className="text-xs text-gray-500 mb-2 line-clamp-2">
            {course.shortDescription}
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          {course.workloadHours && (
            <span>⏱ {fmtDuration(course.workloadHours)}</span>
          )}
          <StatusBadge value={course.level} map={COURSE_LEVEL_MAP} />
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

// Um só objecto para os filtros + page: mudar qualquer filtro tem sempre de
// repor a página a 1, e um setter partilhado torna isso automático em vez de
// repetido (e potencialmente esquecido) em cada handler.
interface CatalogFilters {
  search: string;
  category: string;
  level: string;
  mandatory: string;
  page: number;
}
const INITIAL_CATALOG_FILTERS: CatalogFilters = {
  search: '',
  category: '',
  level: '',
  mandatory: '',
  page: 1,
};

function CatalogView({ onSelect }: { onSelect: (id: number) => void }) {
  const [filters, setFilters] = useState<CatalogFilters>(
    INITIAL_CATALOG_FILTERS,
  );
  const { search, category, level, mandatory, page } = filters;

  function updateFilters(patch: Partial<Omit<CatalogFilters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }
  function goToPage(delta: number) {
    setFilters((f) => ({ ...f, page: f.page + delta }));
  }

  const debouncedSearch = useDebounce(search);
  const params = {
    page,
    limit: 12,
    status: 'PUBLISHED',
    search: debouncedSearch,
    category,
    level,
    mandatory,
  };

  // Lista e categorias correm em paralelo (queries independentes).
  const {
    data,
    isLoading: loading,
    error,
  } = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list(params),
    '/courses',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );
  // Categorias mudam pouco → cache longa (STATIC).
  const { data: cats = [] } = useApiQuery<
    Array<{ category: string; count: number }>
  >(queryKeys.courses.categories(), '/courses/categories', {
    staleTime: STALE_TIME.STATIC,
  });
  const categories = cats.map((c) => c.category).filter(Boolean) as string[];

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Pesquisar cursos, competências, tópicos…"
          value={search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={level}
          onChange={(e) => updateFilters({ level: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os níveis</option>
          <option value="BEGINNER">Iniciante</option>
          <option value="INTERMEDIATE">Intermédio</option>
          <option value="ADVANCED">Avançado</option>
        </select>
        <select
          value={mandatory}
          onChange={(e) => updateFilters({ mandatory: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Obrigatório e opcional</option>
          <option value="true">Apenas obrigatórios</option>
          <option value="false">Apenas opcionais</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-500 mb-4">{error.message}</div>
      )}

      {loading && <Skeleton rows={3} />}

      {!loading && data && (
        <>
          <div className="text-xs text-gray-400 mb-4">
            {data.total} cursos encontrados
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {data.data.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onSelect(course.id)}
              />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Página {data.page} de {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => goToPage(-1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                <button
                  disabled={page === data.totalPages}
                  onClick={() => goToPage(1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                >
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

// Container: useCourseDetail trata as queries de curso/progresso, a
// auto-selecção da 1ª aula incompleta e as 3 mutações; a apresentação
// (player/header/módulos/feedback) vive em
// components/courses/CourseDetailView.tsx.
function CourseDetail({
  courseId,
  onBack,
}: {
  courseId: number;
  onBack: () => void;
}) {
  const {
    course,
    loadingCourse,
    progress,
    isEnrolled,
    progressPct,
    activeLesson,
    setActiveLesson,
    rating,
    setRating,
    comment,
    setComment,
    handleEnroll,
    handleMarkComplete,
    handleFeedback,
    enrolling,
    completing,
    feedbackLoading,
  } = useCourseDetail(courseId);

  return (
    <CourseDetailView
      onBack={onBack}
      course={course}
      loadingCourse={loadingCourse}
      progress={progress}
      isEnrolled={isEnrolled}
      progressPct={progressPct}
      activeLesson={activeLesson}
      onSelectLesson={setActiveLesson}
      rating={rating}
      onRatingChange={setRating}
      comment={comment}
      onCommentChange={setComment}
      onEnroll={handleEnroll}
      onMarkComplete={handleMarkComplete}
      onFeedback={handleFeedback}
      enrolling={enrolling}
      completing={completing}
      feedbackLoading={feedbackLoading}
    />
  );
}

// ─── View: My Enrollments ────────────────────────────────────────────────────

function MyEnrollmentsView({ onSelect }: { onSelect: (id: number) => void }) {
  const [filter, setFilter] = useState('');

  const {
    data = [],
    isLoading: loading,
    error,
  } = useApiQuery<MyEnrollment[]>(
    queryKeys.courses.myEnrollments(),
    '/courses/my/enrollments',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const filtered = filter ? data.filter((e) => e.status === filter) : data;

  if (loading) return <Skeleton />;
  if (error) return <div className="text-sm text-red-500">{error.message}</div>;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === s
                ? 'bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {
              {
                '': 'Todos',
                NOT_STARTED: 'Não iniciados',
                IN_PROGRESS: 'Em progresso',
                COMPLETED: 'Concluídos',
              }[s]
            }
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem matrículas encontradas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(e.courseId)}
            >
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                {e.course.thumbnailUrl ? (
                  <Image
                    src={e.course.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">
                    📚
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {e.course.title}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  {e.course.category && <span>{e.course.category}</span>}
                  {e.course.workloadHours && (
                    <span>⏱ {fmtDuration(e.course.workloadHours)}</span>
                  )}
                </div>
                <EnrollBadge status={e.status} deadline={e.deadline} />
              </div>
              {e.mandatory && (
                <span className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded flex-shrink-0">
                  Obrigatório
                </span>
              )}
              {e.deadline && (
                <div
                  className={`text-xs flex-shrink-0 ${isOverdue(e.deadline) ? 'text-red-600' : 'text-gray-400'}`}
                >
                  {isOverdue(e.deadline)
                    ? '⚠ Atrasado'
                    : `Prazo: ${fmtDate(e.deadline)}`}
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
  const [verifyResult, setVerifyResult] =
    useState<CertificateVerifyResult | null>(null);

  const { data = [], isLoading: loading } = useApiQuery<Certificate[]>(
    queryKeys.courses.myCertificates(),
    '/courses/my/certificates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // Verificação on-demand de um código → mutação (acção pontual, não cacheada).
  const verifyMut = useApiMutation(
    (code: string) =>
      apiClient.get<CertificateVerifyResult>(
        `/courses/certificates/verify/${code}`,
      ),
    {
      onSuccess: (r) => setVerifyResult(r),
      onError: (e) => setVerifyResult({ error: e.message }),
    },
  );
  const verify = () => {
    if (verifyCode.trim()) verifyMut.mutate(verifyCode.trim());
  };

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Verificar certificado */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Verificar certificado
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Código do certificado (ex: CERT-1-42-1234567890)"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
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
          <div
            className={`mt-3 p-3 rounded-lg text-sm ${verifyResult.error ? 'bg-red-50 text-red-700' : verifyResult.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}
          >
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
          {data.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-5 text-white">
                <div className="text-xs text-blue-200 mb-1">
                  Certificado de conclusão
                </div>
                <div className="text-base font-semibold">
                  {cert.course.title}
                </div>
                <div className="text-xs text-blue-300 mt-1 font-mono">
                  {cert.code}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Emitido: {fmtDate(cert.issuedAt)}</span>
                  {cert.expiresAt && (
                    <span
                      className={
                        new Date() > new Date(cert.expiresAt)
                          ? 'text-red-600'
                          : ''
                      }
                    >
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
    queryKeys.courses.adminDashboard(),
    '/courses/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Total de cursos',
            value: data.courses.total,
            sub: `${data.courses.published} publicados`,
          },
          {
            label: 'Total matrículas',
            value: data.enrollments.total,
            sub: undefined,
          },
          {
            label: 'Taxa de conclusão',
            value: `${data.completionRate}%`,
            sub: `${data.enrollments.completed} concluídas`,
            color: 'text-emerald-600',
          },
          {
            label: 'Atrasos',
            value: data.enrollments.overdue,
            sub: 'deadlines vencidos',
            color: data.enrollments.overdue > 0 ? 'text-red-600' : undefined,
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
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
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {c.title}
                </div>
                <div className="text-xs text-gray-400">
                  {c.category ?? '—'} · {c.level}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {c._count.enrollments} matrículas
              </div>
              <StatusBadge
                value={c.status}
                map={COURSE_STATUS_MAP}
                variant="dot"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

type View = 'catalog' | 'detail' | 'my-courses' | 'certificates' | 'dashboard';
type TopLevelView = Exclude<View, 'detail'>;

// view e selectedId eram dois useState separados sempre definidos em conjunto
// (handleSelect/handleBack) — um único estado torna "detail sem id" irrepresentável.
type Nav = { view: TopLevelView } | { view: 'detail'; selectedId: number };

const NAV: Array<{ id: TopLevelView; label: string }> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-courses', label: 'Os meus cursos' },
  { id: 'certificates', label: 'Certificados' },
  { id: 'dashboard', label: 'Dashboard (Admin)' },
];

const TITLES: Record<View, string> = {
  catalog: 'Catálogo de Cursos',
  detail: 'Curso',
  'my-courses': 'Os meus cursos',
  certificates: 'Os meus certificados',
  dashboard: 'Dashboard de Formação',
};

export default function CoursesPage() {
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Academia Corporativa
          </p>
        </div>
        {nav.view === 'catalog' && (
          <button
            onClick={() => alert('Abrir formulário de criação de curso')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Criar curso
          </button>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <CourseDetail courseId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-courses' && (
        <MyEnrollmentsView onSelect={handleSelect} />
      )}
      {nav.view === 'certificates' && <CertificatesView />}
      {nav.view === 'dashboard' && (
        <AdminDashboardView onSelect={handleSelect} />
      )}
    </div>
  );
}
