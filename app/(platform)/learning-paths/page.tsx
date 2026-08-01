'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '../../../hooks/useApiQuery';
import { apiClient } from '../../../lib/apiClient';
import { queryKeys } from '../../../lib/queryKeys';
import { STALE_TIME } from '../../../lib/queryClient';
import { useDebounce } from '../../../hooks/useDebounce';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

type LPStatus    = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type LPLevel     = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
type LPType      = 'ONBOARDING' | 'UPSKILLING' | 'RESKILLING' | 'COMPLIANCE' | 'LEADERSHIP' | 'CERTIFICATION' | 'CUSTOM';
type StepStatus  = 'NOT_ENROLLED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

interface LPStep {
  seq: number;
  courseId: number;
  required: boolean;
  deadlineDays: number | null;
  course: {
    id: number; title: string; thumbnailUrl: string | null;
    category: string | null; level: string; workloadHours: number | null;
    _count: { modules: number };
  };
  status: StepStatus;
  locked: boolean;
  completedAt: string | null;
  progress: number;
}

interface LPProgress {
  learningPathId: number;
  userId: number;
  enrollment: { id: number; status: string; deadline: string | null; completedAt: string | null } | null;
  overallPct: number;
  completedRequired: number;
  totalRequired: number;
  totalSteps: number;
  steps: LPStep[];
  isOverdue: boolean;
}

interface LearningPath {
  id: number;
  title: string;
  shortDescription: string | null;
  description: string | null;
  objective: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  tags: string[];
  level: LPLevel;
  pathType: LPType;
  status: LPStatus;
  mandatory: boolean;
  totalHours: number;
  deadline: string | null;
  createdAt: string;
  publishedAt: string | null;
  _count: { courses: number; enrollments: number };
  courses?: any[];
  milestones?: any[];
}

interface PaginatedLPs {
  data: LearningPath[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LPAnalytics {
  learningPathId: number;
  enrollments: { total: number; completed: number; inProgress: number; notStarted: number };
  completionRate: number;
  overdue: number;
  stepDropoff: Array<{ seq: number; courseId: number; title: string; completed: number }>;
}

type View = 'catalog' | 'detail' | 'my-paths' | 'dashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtHours(h: number): string {
  if (!h) return '—';
  return h < 1 ? `${h * 60}min` : `${h}h`;
}

function isOverdue(deadline: string | null): boolean {
  return !!deadline && new Date() > new Date(deadline);
}

// ─── Badge components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LPStatus }) {
  const cfg: Record<LPStatus, { label: string; cls: string }> = {
    DRAFT:     { label: 'Rascunho',  cls: 'bg-gray-100 text-gray-500' },
    PUBLISHED: { label: 'Publicado', cls: 'bg-emerald-50 text-emerald-700' },
    ARCHIVED:  { label: 'Arquivado', cls: 'bg-gray-100 text-gray-400' },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />{label}
    </span>
  );
}

function LevelBadge({ level }: { level: LPLevel }) {
  const cfg: Record<LPLevel, { label: string; cls: string }> = {
    BEGINNER:     { label: 'Básico',       cls: 'bg-emerald-50 text-emerald-700' },
    INTERMEDIATE: { label: 'Intermédio',   cls: 'bg-amber-50 text-amber-700' },
    ADVANCED:     { label: 'Avançado',     cls: 'bg-red-50 text-red-700' },
  };
  const { label, cls } = cfg[level];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

function TypeBadge({ type }: { type: LPType }) {
  const labels: Record<LPType, string> = {
    ONBOARDING:  'Onboarding', UPSKILLING: 'Upskilling', RESKILLING: 'Reskilling',
    COMPLIANCE:  'Compliance', LEADERSHIP: 'Liderança',  CERTIFICATION: 'Certificação',
    CUSTOM:      'Personalizado',
  };
  return (
    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
      {labels[type]}
    </span>
  );
}

function StepStatusIcon({ status, locked }: { status: StepStatus; locked: boolean }) {
  if (locked)                    return <span className="text-gray-300 text-lg">🔒</span>;
  if (status === 'COMPLETED')    return <span className="text-emerald-500 text-lg">✅</span>;
  if (status === 'IN_PROGRESS')  return <span className="text-blue-500 text-lg">▶️</span>;
  return <span className="text-gray-300 text-lg">○</span>;
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── LP Card ─────────────────────────────────────────────────────────────────

function LearningPathCard({
  path,
  onClick,
  enrolled,
  progress,
}: {
  path: LearningPath;
  onClick: () => void;
  enrolled?: boolean;
  progress?: number;
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-900 relative overflow-hidden">
        {path.thumbnailUrl ? (
          <Image src={path.thumbnailUrl} alt={path.title} fill className="object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🗺️</div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <TypeBadge type={path.pathType} />
        </div>
        {path.mandatory && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">
            Obrigatório
          </span>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1.5 bg-black/20">
              <div className="h-1.5 bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {path.category && (
          <div className="text-xs text-blue-600 font-medium mb-1">{path.category}</div>
        )}
        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{path.title}</div>
        {path.shortDescription && (
          <div className="text-xs text-gray-500 mb-2 line-clamp-2">{path.shortDescription}</div>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          <span>📚 {path._count.courses} cursos</span>
          {path.totalHours > 0 && <span>⏱ {fmtHours(path.totalHours)}</span>}
          <LevelBadge level={path.level} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">👥 {path._count.enrollments} inscritos</span>
          {enrolled && progress !== undefined && (
            <span className={`text-xs font-medium ${progress >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
              {progress >= 100 ? '✓ Concluído' : `${progress}%`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── View: Catalog ────────────────────────────────────────────────────────────

function CatalogView({ onSelect }: { onSelect: (id: number) => void }) {
  const [search, setSearch]     = useState('');
  const [level, setLevel]       = useState('');
  const [pathType, setPathType] = useState('');
  const [mandatory, setMandatory] = useState('');
  const [page, setPage]         = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const params = {
    page, limit: 12, status: 'PUBLISHED',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(level     ? { level }     : {}),
    ...(pathType  ? { pathType }  : {}),
    ...(mandatory ? { mandatory } : {}),
  };
  const { data, isLoading: loading, error } = useApiQuery<PaginatedLPs>(
    queryKeys.learningPaths.catalog(params), '/learning-paths',
    { params, staleTime: STALE_TIME.SEMI_STATIC, placeholderData: keepPreviousData },
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Pesquisar trilhas, tags, categorias…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os níveis</option>
          <option value="BEGINNER">Básico</option>
          <option value="INTERMEDIATE">Intermédio</option>
          <option value="ADVANCED">Avançado</option>
        </select>
        <select value={pathType} onChange={e => { setPathType(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os tipos</option>
          <option value="ONBOARDING">Onboarding</option>
          <option value="UPSKILLING">Upskilling</option>
          <option value="COMPLIANCE">Compliance</option>
          <option value="LEADERSHIP">Liderança</option>
          <option value="CERTIFICATION">Certificação</option>
        </select>
        <select value={mandatory} onChange={e => { setMandatory(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas</option>
          <option value="true">Apenas obrigatórias</option>
          <option value="false">Apenas opcionais</option>
        </select>
      </div>

      {error && <div className="text-sm text-red-500 mb-4">{error.message}</div>}
      {loading && <Skeleton />}

      {!loading && data && (
        <>
          <div className="text-xs text-gray-400 mb-4">{data.total} trilhas encontradas</div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {data.data.map(path => (
              <LearningPathCard key={path.id} path={path} onClick={() => onSelect(path.id)} />
            ))}
          </div>
          {data.data.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Nenhuma trilha encontrada
            </div>
          )}
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

// ─── View: LP Detail + Roadmap ────────────────────────────────────────────────

function LPDetailView({ pathId, onBack }: { pathId: number; onBack: () => void }) {
  const [enrolling, setEnrolling] = useState(false);
  const [tab, setTab]           = useState<'roadmap' | 'info'>('roadmap');

  const pathQuery = useApiQuery<LearningPath>(
    queryKeys.learningPaths.detail(pathId), `/learning-paths/${pathId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const progressQuery = useApiQuery<LPProgress>(
    queryKeys.learningPaths.progress(pathId), `/learning-paths/${pathId}/progress`,
    { staleTime: STALE_TIME.DYNAMIC, retry: false },
  );

  const path     = pathQuery.data ?? null;
  const progress = progressQuery.data ?? null;
  const loading  = pathQuery.isLoading;

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await apiClient.post(`/learning-paths/${pathId}/enroll`, {});
      await Promise.all([pathQuery.refetch(), progressQuery.refetch()]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading || !path) return <div><Skeleton rows={5} /></div>;

  const isEnrolled = !!progress?.enrollment;
  const pct        = progress?.overallPct ?? 0;

  // Encontrar próxima etapa não concluída
  const nextStep = progress?.steps.find(s => !s.locked && s.status !== 'COMPLETED');

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5">
        ← Voltar ao catálogo
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="h-36 bg-gradient-to-br from-blue-700 to-blue-900 relative">
          {path.thumbnailUrl && (
            <Image src={path.thumbnailUrl} alt={path.title} fill className="object-cover opacity-40" />
          )}
          <div className="absolute inset-0 flex items-end p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge type={path.pathType} />
              <LevelBadge level={path.level} />
              <StatusBadge status={path.status} />
              {path.mandatory && (
                <span className="bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">Obrigatório</span>
              )}
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900 mb-2">{path.title}</h1>
              {path.shortDescription && (
                <p className="text-sm text-gray-500 mb-3">{path.shortDescription}</p>
              )}
              <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                <span>📚 {path._count.courses} cursos</span>
                {path.totalHours > 0 && <span>⏱ {fmtHours(path.totalHours)}</span>}
                <span>👥 {path._count.enrollments} inscritos</span>
                {path.deadline && <span className={`font-medium ${isOverdue(path.deadline) ? 'text-red-600' : ''}`}>
                  Prazo: {fmtDate(path.deadline)}
                </span>}
              </div>
              {path.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {path.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded">{t}</span>
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
                  <div className="text-2xl font-bold font-mono text-blue-700 mb-1">{pct}%</div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mx-auto">
                    <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {progress?.completedRequired}/{progress?.totalRequired} obrigatórios
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
        {(['roadmap', 'info'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ roadmap: 'Roadmap da trilha', info: 'Detalhes' }[t]}
          </button>
        ))}
      </div>

      {/* Roadmap (stepper visual) */}
      {tab === 'roadmap' && (
        <div className="space-y-0">
          {(progress?.steps ?? (path.courses?.map((lpc: any, idx: number) => ({
            seq: lpc.seq, courseId: lpc.courseId, required: lpc.required,
            course: lpc.course, status: 'NOT_ENROLLED', locked: idx > 0, completedAt: null, progress: 0, deadlineDays: lpc.deadlineDays,
          })) ?? [])).map((step, idx, arr) => (
            <div key={step.courseId} className="flex gap-4">
              {/* Connector line */}
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                  step.status === 'COMPLETED' ? 'bg-emerald-100 border-emerald-400' :
                  step.status === 'IN_PROGRESS' ? 'bg-blue-100 border-blue-500' :
                  step.locked ? 'bg-gray-50 border-gray-200' :
                  'bg-white border-gray-300'
                }`}>
                  <StepStatusIcon status={step.status} locked={step.locked} />
                </div>
                {idx < arr.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[24px] mt-1 ${
                    step.status === 'COMPLETED' ? 'bg-emerald-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>

              {/* Step card */}
              <div className={`flex-1 mb-3 ${step.locked ? 'opacity-50' : ''}`}>
                <div className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  step.status === 'IN_PROGRESS' ? 'border-blue-300 shadow-sm' :
                  step.status === 'COMPLETED'   ? 'border-emerald-200' :
                  'border-gray-200'
                }`}>
                  <div className="flex items-center gap-4 p-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {step.course?.thumbnailUrl ? (
                        <Image src={step.course.thumbnailUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">📚</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400 font-mono">Etapa {step.seq + 1}</span>
                        {!step.required && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded">Opcional</span>
                        )}
                        {step.locked && (
                          <span className="text-xs text-gray-400">🔒 Bloqueado</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{step.course?.title}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        {step.course?.category && <span>{step.course.category}</span>}
                        {step.course?.workloadHours && <span>⏱ {fmtHours(step.course.workloadHours)}</span>}
                        {step.completedAt && <span className="text-emerald-600">✓ {fmtDate(step.completedAt)}</span>}
                      </div>
                    </div>

                    {/* CTA */}
                    {!step.locked && step.status !== 'COMPLETED' && isEnrolled && (
                      <a
                        href={`/courses/${step.courseId}`}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg flex-shrink-0 ${
                          step.status === 'IN_PROGRESS'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {step.status === 'IN_PROGRESS' ? 'Continuar' : 'Iniciar'}
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
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Sobre a trilha</div>
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
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Detalhes</div>
            {[
              ['Tipo',       path.pathType],
              ['Nível',      path.level],
              ['Cursos',     String(path._count.courses)],
              ['Duração',    fmtHours(path.totalHours)],
              ['Inscritos',  String(path._count.enrollments)],
              ['Publicado',  fmtDate(path.publishedAt)],
              ['Prazo',      fmtDate(path.deadline)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
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

// ─── View: My Paths ───────────────────────────────────────────────────────────

function MyPathsView({ onSelect }: { onSelect: (id: number) => void }) {
  const [filter, setFilter]   = useState('');

  const { data = [], isLoading } = useApiQuery<any[]>(
    queryKeys.learningPaths.myEnrollments(), '/learning-paths/my/enrollments',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const filtered = filter ? data.filter(e => e.status === filter) : data;

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {['', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === s ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {{ '': 'Todas', NOT_STARTED: 'Não iniciadas', IN_PROGRESS: 'Em progresso', COMPLETED: 'Concluídas' }[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Sem trilhas encontradas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e: any) => (
            <div
              key={e.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(e.learningPathId)}
            >
              <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center relative">
                {e.learningPath?.thumbnailUrl ? (
                  <Image src={e.learningPath.thumbnailUrl} alt="" fill className="object-cover opacity-80" />
                ) : (
                  <span className="text-2xl">🗺️</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">{e.learningPath?.title}</div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {e.learningPath?.pathType && <TypeBadge type={e.learningPath.pathType} />}
                  <span>📚 {e.learningPath?._count?.courses ?? 0} cursos</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-medium ${
                  e.status === 'COMPLETED' ? 'text-emerald-600' :
                  e.status === 'IN_PROGRESS' ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {e.status === 'COMPLETED' ? '✓ Concluído' :
                   e.status === 'IN_PROGRESS' ? 'Em progresso' : 'Não iniciado'}
                </div>
                {e.deadline && (
                  <div className={`text-xs ${isOverdue(e.deadline) ? 'text-red-600' : 'text-gray-400'}`}>
                    {isOverdue(e.deadline) ? '⚠ Prazo expirado' : `Prazo: ${fmtDate(e.deadline)}`}
                  </div>
                )}
                {e.mandatory && (
                  <div className="text-xs text-red-600 font-medium">Obrigatório</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View: Admin Dashboard ────────────────────────────────────────────────────

function DashboardView({ onSelect }: { onSelect: (id: number) => void }) {
  const { data, isLoading } = useApiQuery<any>(
    queryKeys.learningPaths.adminDashboard(), '/learning-paths/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de trilhas',  value: data.paths.total,                                         },
          { label: 'Publicadas',        value: data.paths.published,      color: 'text-emerald-600'      },
          { label: 'Matrículas',        value: data.enrollments.total                                    },
          { label: 'Taxa conclusão',    value: `${data.completionRate}%`, color: 'text-blue-600'         },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Top trilhas */}
      {data.topPaths.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Trilhas mais populares
          </div>
          {data.topPaths.map((p: any, idx: number) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(p.id)}
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">{idx + 1}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{p.title}</div>
                <div className="text-xs text-gray-400"><TypeBadge type={p.pathType} /></div>
              </div>
              <div className="text-sm text-gray-500">{p._count.enrollments} matrículas</div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

const NAV: Array<{ id: Exclude<View, 'detail'>; label: string }> = [
  { id: 'catalog',    label: 'Catálogo' },
  { id: 'my-paths',   label: 'As minhas trilhas' },
  { id: 'dashboard',  label: 'Dashboard (Admin)' },
];

const TITLES: Record<View, string> = {
  catalog:   'Trilhas de Aprendizagem',
  detail:    'Detalhe da Trilha',
  'my-paths':'As minhas trilhas',
  dashboard: 'Dashboard de Learning Paths',
};

export default function LearningPathsPage() {
  const [view, setView]         = useState<View>('catalog');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => { setSelectedId(id); setView('detail'); };
  const handleBack   = () => { setSelectedId(null); setView('catalog'); };

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
            onClick={() => alert('Abrir formulário de criação de trilha')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Criar trilha
          </button>
        )}
      </div>

      {/* Tabs */}
      {view !== 'detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {view === 'catalog'   && <CatalogView onSelect={handleSelect} />}
      {view === 'detail' && selectedId !== null && (
        <LPDetailView pathId={selectedId} onBack={handleBack} />
      )}
      {view === 'my-paths'  && <MyPathsView onSelect={handleSelect} />}
      {view === 'dashboard' && <DashboardView onSelect={handleSelect} />}
    </div>
  );
}
