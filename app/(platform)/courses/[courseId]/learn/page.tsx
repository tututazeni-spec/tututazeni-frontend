'use client';
// Container: gere o modo (aprender/construtor), a lição/módulo activos e a
// conclusão de lições; delega apresentação aos componentes em
// components/courses-learn/. Ver memory
// project_innova_component_separation_audit.
//
// Nota: o exemplo de integração do CourseAvatarReader (LessonContent) foi
// movido para components/courses-learn/CourseAvatarReaderExample.tsx —
// documentação/exemplo de referência, não usado por esta página real, tal
// como no ficheiro original.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressRing, Skeleton } from '@/components/courses-learn/atoms';
import { ModuleAccordion } from '@/components/courses-learn/ModuleAccordion';
import { ContentPlayer } from '@/components/courses-learn/ContentPlayer';
import { ModuleCompletedBanner } from '@/components/courses-learn/ModuleCompletedBanner';
import { ModuleBuilder } from '@/components/courses-learn/ModuleBuilder';
import type {
  LessonProgress,
  ModuleProgress,
  PageMode,
} from '@/components/courses-learn/types';

export default function CourseLearnPage() {
  const params = useParams();
  const courseId = parseInt((params?.courseId as string) ?? '0');

  const qc = useQueryClient();
  const [mode, setMode] = useState<PageMode>('learn');
  const [activeLesson, setActiveLesson] = useState<LessonProgress | null>(null);
  const [justCompletedModule, setJustCompletedModule] =
    useState<ModuleProgress | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const progressKey = queryKeys.courses.progress(courseId);
  const { data: modules = [], isLoading: loading } = useApiQuery<
    ModuleProgress[]
  >(progressKey, `/courses/${courseId}/progress`, {
    enabled: !!courseId,
    staleTime: STALE_TIME.DYNAMIC,
  });

  // activeModule é sempre "o módulo que contém activeLesson" — mantê-lo como
  // segundo useState arriscava desincronizar os dois (eram sempre definidos
  // em conjunto em 4 pontos diferentes do ficheiro).
  const activeModule = useMemo(
    () =>
      activeLesson
        ? (modules.find((m) =>
            m.lessons.some((l) => l.id === activeLesson.id),
          ) ?? null)
        : null,
    [modules, activeLesson],
  );

  const totalLessons = modules.reduce((s, m) => s + m.totalCount, 0);
  const completedLessons = modules.reduce((s, m) => s + m.completedCount, 0);
  const overallPct =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Auto-seleccionar aula activa (continuar de onde parou) quando o progresso chega.
  useEffect(() => {
    if (activeLesson || modules.length === 0) return;
    for (const mod of modules) {
      if (mod.locked) continue;
      const pending = mod.lessons.find((l) => !l.completed);
      if (pending) {
        setActiveLesson(pending);
        break;
      }
    }
  }, [modules, activeLesson]);

  const completeMut = useApiMutation<unknown, number>(
    (lessonId) => apiClient.post('/lessons/progress', { lessonId }),
    { onError: (e) => alert(e.message) },
  );
  const completing = completeMut.isPending;

  const handleSelectLesson = (lesson: LessonProgress, mod: ModuleProgress) => {
    if (mod.locked) return;
    setActiveLesson(lesson);
    setJustCompletedModule(null);
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || !activeModule) return;
    try {
      await completeMut.mutateAsync(activeLesson.id);
      // Recarrega o progresso fresco e actualiza a cache.
      const updated = await apiClient.get<ModuleProgress[]>(
        `/courses/${courseId}/progress`,
      );
      qc.setQueryData(progressKey, updated);

      const updatedModule = updated.find((m) => m.id === activeModule.id);
      if (updatedModule?.completed && !activeModule.completed) {
        setJustCompletedModule(updatedModule);
        return;
      }
      if (updatedModule) {
        const idx = updatedModule.lessons.findIndex(
          (l) => l.id === activeLesson.id,
        );
        const nextLesson = updatedModule.lessons[idx + 1];
        if (nextLesson && !nextLesson.completed) {
          setActiveLesson(nextLesson);
        }
      }
    } catch {
      /* erro já tratado no onError */
    }
  };

  const handleContinueAfterModule = () => {
    setJustCompletedModule(null);
    // Seleccionar primeira aula do próximo módulo
    if (!activeModule) return;
    const nextMod = modules.find(
      (m) => m.seq === activeModule.seq + 1 && !m.locked,
    );
    if (nextMod) {
      const firstLesson = nextMod.lessons[0];
      if (firstLesson) {
        setActiveLesson(firstLesson);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-4">
          <button className="text-sm text-gray-500 hover:text-gray-800">
            ← Voltar
          </button>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Curso #{courseId}
            </div>
            <div className="text-xs text-gray-400">
              {overallPct}% concluído ·{' '}
              {modules.reduce((s, m) => s + m.completedCount, 0)}/
              {modules.reduce((s, m) => s + m.totalCount, 0)} aulas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall progress */}
          <div className="flex items-center gap-2">
            <ProgressRing pct={overallPct} size={32} />
            <span className="text-xs font-mono text-gray-600">
              {overallPct}%
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['learn', 'build'] as PageMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {{ learn: 'Aprender', build: 'Construtor' }[m]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSidebarOpen((v) => !v)}
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
          <div
            className={`flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white ${
              mode === 'build' ? 'w-full' : 'w-72'
            }`}
          >
            {mode === 'learn' ? (
              <div>
                {/* Sidebar header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Conteúdo do curso
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 bg-blue-600 rounded-full"
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-500">
                      {overallPct}%
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="p-4">
                    <Skeleton />
                  </div>
                ) : (
                  modules.map((mod, idx) => (
                    <ModuleAccordion
                      key={mod.id}
                      module={mod}
                      activeLesson={activeLesson}
                      onSelectLesson={(lesson) =>
                        handleSelectLesson(lesson, mod)
                      }
                      defaultOpen={
                        !mod.locked &&
                        (idx === 0 || (idx > 0 && modules[idx - 1].completed))
                      }
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
                  <div className="text-lg font-medium mb-2">
                    Selecciona uma aula para começar
                  </div>
                  <div className="text-sm text-gray-400">
                    Navega pela estrutura do curso na barra lateral
                  </div>
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
