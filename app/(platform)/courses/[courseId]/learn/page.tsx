'use client';
// Container: gere o modo (aprender/construtor), a lição/módulo activos e a
// conclusão de lições; delega apresentação aos componentes em
// components/courses-learn/. Ver memory
// project_innova_component_separation_audit.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, PanelLeft, BookOpen } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ModuleAccordion } from '@/components/courses-learn/ModuleAccordion';
import { ContentPlayer } from '@/components/courses-learn/ContentPlayer';
import { ModuleCompletedBanner } from '@/components/courses-learn/ModuleCompletedBanner';
import { ModuleBuilder } from '@/components/courses-learn/ModuleBuilder';
import type {
  CourseDetail,
  LessonProgress,
  ModuleProgress,
  PageMode,
} from '@/components/courses-learn/types';

export default function CourseLearnPage() {
  const notify = useToast();
  const params = useParams();
  const courseId = parseInt((params?.courseId as string) ?? '0');

  const qc = useQueryClient();
  const [mode, setMode] = useState<PageMode>('learn');
  const [activeLesson, setActiveLesson] = useState<LessonProgress | null>(null);
  const [justCompletedModule, setJustCompletedModule] =
    useState<ModuleProgress | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const progressKey = queryKeys.courses.progress(courseId);
  // GET /courses/:id/progress devolve { enrollment, courseProgress, modules }
  // (resumo). Esta sala precisa do array por módulo com drip/sequencial,
  // materiais e pct — isso é o /module-progress (course-modules.controller).
  const { data: modules = [], isLoading: loading } = useApiQuery<
    ModuleProgress[]
  >(progressKey, `/courses/${courseId}/module-progress`, {
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

  // Nome do curso para o cabeçalho. Mesma query key que o ModuleBuilder usa,
  // por isso o React Query partilha a cache — sem pedido extra no modo
  // construtor e um único pedido no modo aprender.
  const { data: course } = useApiQuery<CourseDetail>(
    queryKeys.courses.detail(courseId),
    `/courses/${courseId}`,
    { enabled: !!courseId, staleTime: STALE_TIME.DYNAMIC },
  );

  const completeMut = useApiMutation<unknown, number>(
    (lessonId) => apiClient.post('/lessons/progress', { lessonId }),
    { onError: (e) => notify({ title: e.message, intent: 'danger' }) },
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
    } catch {
      /* erro já tratado no onError da mutação */
      return;
    }

    try {
      // Recarrega o progresso fresco e actualiza a cache.
      const updated = await apiClient.get<ModuleProgress[]>(
        `/courses/${courseId}/module-progress`,
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
    } catch (e) {
      // A lição já foi marcada como concluída (mutateAsync acima teve
      // sucesso) — só este refresh de progresso falhou. Sem isto o
      // utilizador ficava sem saber que o ecrã não reflecte o estado real.
      reportError(e, { source: 'LearnPage.handleMarkComplete.refresh' });
      notify({
        title: 'Progresso actualizado, mas a lista pode estar desactualizada',
        description: 'Actualiza a página para veres o estado mais recente.',
        intent: 'danger',
      });
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
    <div className="flex flex-col h-screen bg-canvas">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button intent="ghost" size="sm">
            <ArrowLeft size={16} strokeWidth={1.75} />
            Voltar
          </Button>
          <div>
            <div className="font-body text-sm font-semibold text-ink">
              {course?.title ?? `Curso #${courseId}`}
            </div>
            <div className="font-body text-xs text-ink-faint">
              {overallPct}% concluído ·{' '}
              {modules.reduce((s, m) => s + m.completedCount, 0)}/
              {modules.reduce((s, m) => s + m.totalCount, 0)} aulas
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Overall progress */}
          <div className="flex items-center gap-2">
            <ProgressBar value={overallPct} className="w-20" />
            <span className="font-data text-xs text-ink-muted">
              {overallPct}%
            </span>
          </div>

          {/* Mode toggle */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as PageMode)}>
            <TabsList>
              <TabsTrigger value="learn">Aprender</TabsTrigger>
              <TabsTrigger value="build">Construtor</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            intent="secondary"
            size="sm"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <PanelLeft size={16} strokeWidth={1.75} />
            {sidebarOpen ? 'Ocultar' : 'Estrutura'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className={`flex-shrink-0 overflow-y-auto border-r border-border bg-surface ${
              mode === 'build' ? 'w-full' : 'w-72'
            }`}
          >
            {mode === 'learn' ? (
              <div>
                {/* Sidebar header */}
                <div className="px-4 py-3 border-b border-border bg-surface-sunken">
                  <div className="font-body text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">
                    Conteúdo do curso
                  </div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={overallPct} className="flex-1" />
                    <span className="font-data text-xs text-ink-muted">
                      {overallPct}%
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="p-4">
                    <Skeleton itemClassName="skeleton-shimmer h-12 rounded-card" />
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
              <div className="flex-1 bg-ink flex items-center justify-center text-canvas text-center">
                <div>
                  <BookOpen
                    size={48}
                    strokeWidth={1.5}
                    className="mx-auto mb-4"
                  />
                  <div className="font-display text-lg font-medium mb-2">
                    Selecciona uma aula para começar
                  </div>
                  <div className="font-body text-sm text-canvas/70">
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
