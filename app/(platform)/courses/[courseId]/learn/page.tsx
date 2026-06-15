// EXEMPLO DE INTEGRAÇÃO — src/app/(dashboard)/courses/[courseId]/learn/page.tsx
//
// Este ficheiro mostra apenas COMO e ONDE colocar o CourseAvatarReader
// dentro da página de aula existente. Não substitui a tua página completa.
//
// PASSO 1: Coloca o ficheiro CourseAvatarReader.tsx em src/components/
// PASSO 2: Coloca a imagem do teu avatar em public/images/avatar.png
// PASSO 3: Importa e adiciona o componente conforme abaixo
//
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { sanitizeHtml } from '@/lib/sanitize';
import { CourseAvatarReader } from '@/components/CourseAvatarReader';

// ─── Tipo do conteúdo da lição ───────────────────────────────────────────────
// (adapta conforme o teu schema)
 
interface Lesson {
  id: number;
  title: string;
  contentType: 'TEXT' | 'VIDEO' | 'PDF' | 'AUDIO' | 'SLIDE' | 'LINK';
  textContent: string | null;
  contentUrl: string | null;
  durationMinutes: number | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonType  = 'VIDEO' | 'PDF' | 'TEXT' | 'AUDIO' | 'SLIDE' | 'LINK' | 'SCORM' | 'QUIZ';
type ModuleType  = 'THEORETICAL' | 'PRACTICAL' | 'ASSESSMENT' | 'PROJECT';
type ModuleStatus= 'DRAFT' | 'PUBLISHED';

interface LessonProgress {
  id: number;
  title: string;
  type: LessonType;
  seq: number;
  durationMinutes: number | null;
  isFree: boolean;
  completed: boolean;
  completedAt: string | null;
  resumePosition: number;
}

interface ModuleMaterial {
  id: number;
  title: string;
  url: string;
  fileType: string | null;
  fileSizeKb: number | null;
}

interface ModuleProgress {
  id: number;
  title: string;
  seq: number;
  type: ModuleType | null;
  mandatory: boolean;
  completedCount: number;
  totalCount: number;
  pct: number;
  completed: boolean;
  locked: boolean;
  lockedReason: string | undefined;
  materials: ModuleMaterial[];
  lessons: LessonProgress[];
}

interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  learningObjectives: string[];
  seq: number;
  status: ModuleStatus;
  type: ModuleType | null;
  progressionType: string;
  completionRule: string;
  minCompletionPercent: number;
  mandatory: boolean;
  dripDays: number | null;
  availableFrom: string | null;
  lessons: any[];
  materials: ModuleMaterial[];
  _count: { lessons: number };
}

// ─── API ──────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min: number | null): string {
  if (!min) return '';
  return min < 60 ? `${min}min` : `${Math.floor(min / 60)}h ${min % 60}min`;
}

function lessonIcon(type: LessonType): string {
  return { VIDEO: '▶', PDF: '📄', TEXT: '📝', AUDIO: '🎵', SLIDE: '📊', LINK: '🔗', SCORM: '📦', QUIZ: '❓' }[type] ?? '📄';
}

function moduleTypeLabel(type: ModuleType | null): string {
  if (!type) return '';
  return { THEORETICAL: 'Teórico', PRACTICAL: 'Prático', ASSESSMENT: 'Avaliação', PROJECT: 'Projecto' }[type] ?? type;
}

function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const r   = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2563eb" strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
    </div>
  );
}

// ─── Module Status Icon ───────────────────────────────────────────────────────

function ModuleStatusIcon({ locked, completed, pct }: { locked: boolean; completed: boolean; pct: number }) {
  if (locked)    return <span className="text-gray-300 text-base">🔒</span>;
  if (completed) return <span className="text-emerald-500 text-base">✅</span>;
  if (pct > 0)   return <span className="text-blue-500 text-base">▶️</span>;
  return <span className="text-gray-300 text-base">○</span>;
}

// ─── Lesson Row ───────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  isActive,
  isLocked,
  onClick,
}: {
  lesson: LessonProgress;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={!isLocked ? onClick : undefined}
      className={`flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 transition-colors ${
        isLocked ? 'opacity-40 cursor-not-allowed' :
        isActive  ? 'bg-blue-50 cursor-pointer' :
                    'hover:bg-gray-50 cursor-pointer'
      }`}
    >
      {/* Completion indicator */}
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
        lesson.completed ? 'bg-emerald-100 text-emerald-700' :
        isActive         ? 'bg-blue-600 text-white' :
                           'bg-gray-100 text-gray-400'
      }`}>
        {lesson.completed ? '✓' : lessonIcon(lesson.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`text-xs truncate font-medium ${
          isActive ? 'text-blue-800' : lesson.completed ? 'text-gray-500' : 'text-gray-700'
        }`}>
          {lesson.title}
        </div>
        {lesson.durationMinutes && (
          <div className="text-xs text-gray-400">{fmtDuration(lesson.durationMinutes)}</div>
        )}
      </div>

      {isLocked && <span className="text-gray-300 text-xs">🔒</span>}
    </div>
  );
}

// ─── Module Accordion (sidebar) ───────────────────────────────────────────────

function ModuleAccordion({
  module: mod,
  activeLesson,
  onSelectLesson,
  defaultOpen,
}: {
  module: ModuleProgress;
  activeLesson: LessonProgress | null;
  onSelectLesson: (lesson: LessonProgress) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`border-b border-gray-100 last:border-0 ${mod.locked ? 'opacity-60' : ''}`}>
      {/* Module header */}
      <div
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
          open ? 'bg-gray-50' : 'hover:bg-gray-50'
        }`}
        onClick={() => !mod.locked && setOpen(v => !v)}
      >
        <ModuleStatusIcon locked={mod.locked} completed={mod.completed} pct={mod.pct} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`text-xs font-semibold truncate ${mod.locked ? 'text-gray-400' : 'text-gray-800'}`}>
              {mod.title}
            </span>
            {!mod.mandatory && (
              <span className="text-xs px-1.5 py-0 bg-blue-50 text-blue-600 rounded">Opcional</span>
            )}
            {mod.type && (
              <span className="text-xs text-gray-400">{moduleTypeLabel(mod.type)}</span>
            )}
          </div>
          {!mod.locked && mod.totalCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${mod.pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{mod.completedCount}/{mod.totalCount}</span>
            </div>
          )}
          {mod.locked && mod.lockedReason && (
            <div className="text-xs text-amber-600">{mod.lockedReason}</div>
          )}
        </div>

        {!mod.locked && (
          <span className="text-gray-400 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Lessons */}
      {open && !mod.locked && (
        <div className="border-t border-gray-100">
          {mod.lessons.map(lesson => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              isActive={activeLesson?.id === lesson.id}
              isLocked={mod.locked}
              onClick={() => onSelectLesson(lesson)}
            />
          ))}

          {/* Materiais complementares */}
          {mod.materials.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1.5">
                Materiais
              </div>
              {mod.materials.map(mat => (
                <a
                  key={mat.id}
                  href={mat.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <span>📎</span>
                  <span className="truncate">{mat.title}</span>
                  {mat.fileType && <span className="text-gray-400">{mat.fileType}</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Content Player ───────────────────────────────────────────────────────────

function ContentPlayer({
  lesson,
  onComplete,
  completing,
  currentModule,
}: {
  lesson: LessonProgress;
  onComplete: () => void;
  completing: boolean;
  currentModule: ModuleProgress | null;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Module breadcrumb */}
      {currentModule && (
        <div className="px-6 py-2 border-b border-gray-100 bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
          <span className="font-medium">{currentModule.title}</span>
          <span className="text-gray-300">›</span>
          <span>{lesson.title}</span>
        </div>
      )}

      {/* Player area */}
      <div className="flex-1 bg-gray-950 flex items-center justify-center">
        {lesson.type === 'VIDEO' ? (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">▶</div>
            <div className="text-base font-medium">{lesson.title}</div>
            <div className="text-sm text-gray-400 mt-2">Player de vídeo (YouTube / Vimeo / próprio)</div>
          </div>
        ) : lesson.type === 'PDF' ? (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-base font-medium">{lesson.title}</div>
            <a href="#" className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300">
              Abrir PDF →
            </a>
          </div>
        ) : lesson.type === 'TEXT' ? (
          <div className="max-w-2xl mx-auto text-white p-8">
            <h2 className="text-xl font-semibold mb-4">{lesson.title}</h2>
            <p className="text-gray-300 leading-relaxed">Conteúdo de texto da aula aqui…</p>
          </div>
        ) : (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">{lessonIcon(lesson.type)}</div>
            <div className="text-base font-medium">{lesson.title}</div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
        <div>
          <div className="text-sm font-medium text-gray-900">{lesson.title}</div>
          {lesson.durationMinutes && (
            <div className="text-xs text-gray-400">{fmtDuration(lesson.durationMinutes)}</div>
          )}
        </div>
        <button
          onClick={onComplete}
          disabled={completing || lesson.completed}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${
            lesson.completed
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-blue-700 text-white hover:bg-blue-800'
          }`}
        >
          {lesson.completed ? '✓ Concluída' : completing ? 'A marcar…' : 'Marcar como concluída →'}
        </button>
      </div>
    </div>
  );
}

// ─── Module Completion Celebration ───────────────────────────────────────────

function ModuleCompletedBanner({ module: mod, onContinue }: { module: ModuleProgress; onContinue: () => void }) {
  return (
    <div className="flex-1 bg-gray-950 flex items-center justify-center">
      <div className="text-white text-center max-w-sm">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Módulo concluído!</h2>
        <p className="text-gray-300 mb-6">Concluíste "{mod.title}" com sucesso.</p>
        <button
          onClick={onContinue}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          Continuar para o próximo módulo →
        </button>
      </div>
    </div>
  );
}

// ─── Admin Module Builder ─────────────────────────────────────────────────────

function ModuleBuilder({ courseId }: { courseId: number }) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<number | null>(null);
  const [creatingModule, setCreatingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const course = await apiFetch<any>(`/courses/${courseId}`);
      setModules(course.modules ?? []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleCreateModule = async () => {
    if (!newModuleTitle.trim()) return;
    setSaving(true);
    try {
      const maxSeq = modules.reduce((m, mod) => Math.max(m, mod.seq), -1);
      await apiFetch('/modules', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          title: newModuleTitle,
          seq:   maxSeq + 1,
        }),
      });
      setNewModuleTitle('');
      setCreatingModule(false);
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (moduleId: number) => {
    try {
      await apiFetch(`/modules/${moduleId}/publish`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (moduleId: number) => {
    if (!confirm('Eliminar módulo? Esta acção não pode ser desfeita.')) return;
    try {
      await apiFetch(`/modules/${moduleId}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <Skeleton rows={4} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {modules.length} módulos
        </div>
        <button
          onClick={() => setCreatingModule(true)}
          className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg hover:bg-blue-800"
        >
          + Adicionar módulo
        </button>
      </div>

      {/* Create module form */}
      {creatingModule && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
          <div className="text-xs font-medium text-blue-700 mb-2">Novo módulo</div>
          <input
            type="text"
            placeholder="Título do módulo"
            value={newModuleTitle}
            onChange={e => setNewModuleTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateModule()}
            autoFocus
            className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreateModule}
              disabled={!newModuleTitle.trim() || saving}
              className="px-3 py-1.5 bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {saving ? 'A criar…' : 'Criar'}
            </button>
            <button
              onClick={() => { setCreatingModule(false); setNewModuleTitle(''); }}
              className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Module list */}
      <div className="space-y-2">
        {modules.map((mod, idx) => (
          <div key={mod.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Drag handle */}
              <span className="text-gray-300 cursor-grab text-sm">⠿</span>
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-mono flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex-1">
                {editingModule === mod.id ? (
                  <input
                    type="text"
                    defaultValue={mod.title}
                    autoFocus
                    onBlur={async e => {
                      if (e.target.value !== mod.title) {
                        await apiFetch(`/modules/${mod.id}`, {
                          method: 'PUT',
                          body:   JSON.stringify({ title: e.target.value }),
                        });
                        await load();
                      }
                      setEditingModule(null);
                    }}
                    className="text-sm font-medium border border-blue-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{mod.title}</span>
                    {mod.type && (
                      <span className="text-xs text-gray-400">{moduleTypeLabel(mod.type)}</span>
                    )}
                    <span className={`text-xs px-1.5 rounded ${mod.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {mod.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                    </span>
                    {!mod.mandatory && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 rounded">Opcional</span>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-0.5">
                  {mod._count.lessons} aulas
                  {mod.dripDays ? ` · Drip: ${mod.dripDays} dias` : ''}
                  {mod.progressionType === 'SEQUENTIAL' ? ' · Sequencial' : ' · Livre'}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                <button
                  onClick={() => setEditingModule(mod.id)}
                  className="w-7 h-7 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg flex items-center justify-center"
                  title="Editar"
                >
                  ✏
                </button>
                {mod.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublish(mod.id)}
                    className="w-7 h-7 text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded-lg flex items-center justify-center"
                    title="Publicar"
                  >
                    ↑
                  </button>
                )}
                <button
                  onClick={() => handleDelete(mod.id)}
                  className="w-7 h-7 text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg flex items-center justify-center"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lessons preview */}
            {mod.lessons.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2">
                {mod.lessons.slice(0, 3).map((l: any) => (
                  <div key={l.id} className="flex items-center gap-2 py-1 text-xs text-gray-500">
                    <span>{lessonIcon(l.type)}</span>
                    <span className="truncate">{l.title}</span>
                    {l.durationMinutes && <span className="text-gray-300">{fmtDuration(l.durationMinutes)}</span>}
                  </div>
                ))}
                {mod.lessons.length > 3 && (
                  <div className="text-xs text-gray-400 mt-1">+{mod.lessons.length - 3} mais aulas</div>
                )}
              </div>
            )}
          </div>
        ))}

        {modules.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Sem módulos. Adicione o primeiro módulo acima.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageMode = 'learn' | 'build';

export default function CourseLearnPage() {
  const params = useParams();
  const courseId = parseInt(params?.courseId as string ?? '0');

  const [mode, setMode]           = useState<PageMode>('learn');
  const [modules, setModules]     = useState<ModuleProgress[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeLesson, setActiveLesson]   = useState<LessonProgress | null>(null);
  const [activeModule, setActiveModule]   = useState<ModuleProgress | null>(null);
  const [completing, setCompleting]       = useState(false);
  const [justCompletedModule, setJustCompletedModule] = useState<ModuleProgress | null>(null);
  const [overallPct, setOverallPct]       = useState(0);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<ModuleProgress[]>(`/courses/${courseId}/progress`);
      setModules(data);

      // Calcular progresso geral
      const total     = data.reduce((s, m) => s + m.totalCount, 0);
      const completed = data.reduce((s, m) => s + m.completedCount, 0);
      setOverallPct(total > 0 ? Math.round((completed / total) * 100) : 0);

      // Auto-seleccionar aula activa (continuar de onde parou)
      if (!activeLesson) {
        for (const mod of data) {
          if (mod.locked) continue;
          const pending = mod.lessons.find(l => !l.completed);
          if (pending) {
            setActiveLesson(pending);
            setActiveModule(mod);
            break;
          }
        }
      }
    } catch (e: any) {
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const handleSelectLesson = (lesson: LessonProgress, mod: ModuleProgress) => {
    if (mod.locked) return;
    setActiveLesson(lesson);
    setActiveModule(mod);
    setJustCompletedModule(null);
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || !activeModule) return;
    setCompleting(true);
    try {
      await apiFetch('/lessons/progress', {
        method: 'POST',
        body:   JSON.stringify({ lessonId: activeLesson.id }),
      });

      // Recarregar progresso
      await loadProgress();

      // Verificar se módulo foi concluído
      const updatedModules = await apiFetch<ModuleProgress[]>(`/courses/${courseId}/progress`);
      const updatedModule  = updatedModules.find(m => m.id === activeModule.id);
      if (updatedModule?.completed && !activeModule.completed) {
        setJustCompletedModule(updatedModule);
        return;
      }

      // Auto-avançar para próxima aula
      const currentModule = updatedModules.find(m => m.id === activeModule.id);
      if (currentModule) {
        const currentIdx = currentModule.lessons.findIndex(l => l.id === activeLesson.id);
        const nextLesson = currentModule.lessons[currentIdx + 1];
        if (nextLesson && !nextLesson.completed) {
          setActiveLesson(nextLesson);
          setActiveModule(currentModule);
        }
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleContinueAfterModule = () => {
    setJustCompletedModule(null);
    // Seleccionar primeira aula do próximo módulo
    if (!activeModule) return;
    const nextMod = modules.find(m => m.seq === activeModule.seq + 1 && !m.locked);
    if (nextMod) {
      const firstLesson = nextMod.lessons[0];
      if (firstLesson) {
        setActiveLesson(firstLesson);
        setActiveModule(nextMod);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-4">
          <button className="text-sm text-gray-500 hover:text-gray-800">← Voltar</button>
          <div>
            <div className="text-sm font-semibold text-gray-900">Curso #{courseId}</div>
            <div className="text-xs text-gray-400">
              {overallPct}% concluído · {modules.reduce((s, m) => s + m.completedCount, 0)}/{modules.reduce((s, m) => s + m.totalCount, 0)} aulas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall progress */}
          <div className="flex items-center gap-2">
            <ProgressRing pct={overallPct} size={32} />
            <span className="text-xs font-mono text-gray-600">{overallPct}%</span>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['learn', 'build'] as PageMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {{ learn: 'Aprender', build: 'Construtor' }[m]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2 py-1"
          >
            {sidebarOpen ? '⊟ Ocultar' : '⊞ Estrutura'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className={`flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white ${
            mode === 'build' ? 'w-full' : 'w-72'
          }`}>
            {mode === 'learn' ? (
              <div>
                {/* Sidebar header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Conteúdo do curso
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-1.5 bg-blue-600 rounded-full" style={{ width: `${overallPct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-gray-500">{overallPct}%</span>
                  </div>
                </div>

                {loading ? <div className="p-4"><Skeleton /></div> : (
                  modules.map((mod, idx) => (
                    <ModuleAccordion
                      key={mod.id}
                      module={mod}
                      activeLesson={activeLesson}
                      onSelectLesson={lesson => handleSelectLesson(lesson, mod)}
                      defaultOpen={!mod.locked && (idx === 0 || (idx > 0 && modules[idx - 1].completed))}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="p-4">
                <ModuleBuilder courseId={courseId} />
              </div>
            )}
          </div>
        )}

        {/* Player area */}
        {mode === 'learn' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {justCompletedModule ? (
              <ModuleCompletedBanner
                module={justCompletedModule}
                onContinue={handleContinueAfterModule}
              />
            ) : activeLesson ? (
              <ContentPlayer
                lesson={activeLesson}
                onComplete={handleMarkComplete}
                completing={completing}
                currentModule={activeModule}
              />
            ) : (
              <div className="flex-1 bg-gray-950 flex items-center justify-center text-white text-center">
                <div>
                  <div className="text-5xl mb-4">📚</div>
                  <div className="text-lg font-medium mb-2">Selecciona uma aula para começar</div>
                  <div className="text-sm text-gray-400">Navega pela estrutura do curso na barra lateral</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Builder full area when sidebar is hidden */}
        {mode === 'build' && !sidebarOpen && (
          <div className="flex-1 p-6 overflow-y-auto">
            <ModuleBuilder courseId={courseId} />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// INTEGRAÇÃO NO COMPONENTE DE AULA
// =============================================================================
//
// Regra: o avatar SÓ aparece se contentType === 'TEXT' E textContent existir
// Desta forma não interfere com vídeos, PDFs, etc.
//
// Exemplo de como renderizar dentro da tua página de aula:

function LessonContent({ lesson }: { lesson: Lesson }) {
  const isTextLesson = lesson.contentType === 'TEXT' && !!lesson.textContent;
 
  return (
    <div className="relative">
      {/* ─── Conteúdo da aula ─────────────────────────────────────────────── */}
      <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
        {lesson.textContent && (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.textContent) }} />
        )}
      </div>
 
      {/* ─── Avatar de leitura — SÓ para aulas em texto ──────────────────── */}
      {isTextLesson && (
        <CourseAvatarReader
          text={lesson.textContent!}
          avatarSrc="/images/avatar.png"        // ← caminho da tua imagem
          avatarName="Ana — INNOVA Academy"     // ← nome do teu avatar
          lang="pt-PT"                          // ← idioma da voz
        />
      )}
    </div>
  );
}

// =============================================================================
// CONFIGURAÇÃO DO AVATAR
// =============================================================================
//
// Props disponíveis em <CourseAvatarReader>:
//
//   text        (obrigatório) — texto da aula (aceita Markdown e HTML, limpa automaticamente)
//   avatarSrc   (obrigatório) — ex: "/images/meu-avatar.png" ou URL externa
//   avatarName  (opcional)    — nome exibido no card, default: "Assistente INNOVA"
//   lang        (opcional)    — idioma da voz:
//                               "pt-PT" — Português de Portugal
//                               "pt-BR" — Português do Brasil
//                               "en-US" — Inglês americano
//                               "en-GB" — Inglês britânico
//
// =============================================================================
// RECOMENDAÇÕES PARA A IMAGEM DO AVATAR
// =============================================================================
//
//   Formato:     JPG ou PNG
//   Dimensão:    400×400px ou mais (será recortada em círculo)
//   Estilo:      Foto ou ilustração com rosto bem centrado
//   Fundo:       Preferencialmente liso ou removido (sem fundo)
//   Tamanho:     < 200KB recomendado para carregamento rápido
//   Localização: public/images/avatar.png (ou qualquer path em /public)
//
// =============================================================================
// COMO FUNCIONA (FLUXO DO UTILIZADOR)
// =============================================================================
//
//  1. Utilizador abre uma aula em TEXTO
//  2. Aparece no canto inferior direito um botão flutuante "Ouvir aula"
//     com uma miniatura do avatar (o botão pisca suavemente para chamar atenção)
//
//  3. Utilizador clica → o player expande com:
//     • Foto do avatar em círculo
//     • Animação de ondas quando a voz está activa
//     • Barra de progresso da leitura
//     • Botões: ▶ Play / ⏸ Pause / ⏹ Stop / ⏮ Reiniciar
//
//  4. Clicar ✕ no player → fecha e cancela a leitura
//
//  5. O avatar NÃO aparece em:
//     • Aulas de vídeo (contentType: 'VIDEO')
//     • Aulas de PDF (contentType: 'PDF')
//     • Outros tipos que não sejam TEXT
//
// =============================================================================
// NOTAS TÉCNICAS
// =============================================================================
//
//  • Usa a Web Speech API nativa do browser (SpeechSynthesis)
//    — sem custos, sem API keys, funciona offline
//    — suporte: Chrome ✅  Edge ✅  Firefox ✅  Safari ✅  (excl. alguns browsers antigos)
//
//  • Se o browser não suportar SpeechSynthesis, o componente não renderiza
//    (sem erros, sem interface quebrada)
//
//  • O texto é limpo automaticamente de Markdown e HTML antes de ser lido
//
//  • A voz é definida pelo browser — não é a voz do avatar real.
//    Para usar uma voz clonada/personalizada, podes integrar a API
//    ElevenLabs ou Azure Cognitive Speech (substituir o bloco speakChunk)
//
// =============================================================================
//
// Nota: a página exporta CourseLearnPage como default (ver acima).
// LessonContent é um componente interno — não pode ser um segundo export default.

// Setup em 5 passos (10 minutos)
//1. Criar conta gratuita
//→ elevenlabs.io — sem cartão de crédito
//2. Clonar a tua voz
//→ Perfil → Voice Lab → Add Voice → Voice Cloning
//→ Faz upload de 1–3 minutos de áudio teu a falar (qualquer gravação limpa)
//→ O ElevenLabs analisa e cria a voz — copia o Voice ID
//3. Obter a API Key
//→ Perfil → API Key → copiar a chave
//4. Adicionar ao .env.local
//bashNEXT_PUBLIC_ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxx
//NEXT_PUBLIC_ELEVENLABS_VOICE_ID=xxxxxxxxxxxxxxxxxxxxxxxx
//5. Usar na página de aula
//tsximport { CourseAvatarReader } from '@/components/CourseAvatarReader';

// Dentro do render da aula — SÓ aparece em aulas de texto:
//{lesson.contentType === 'TEXT' && lesson.textContent && (
//  <CourseAvatarReader
//    text={lesson.textContent}
//    avatarSrc="/images/avatar.png"
//    avatarName="Ana — INNOVA Academy"
//  />
// )}


