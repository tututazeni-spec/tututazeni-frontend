// components/courses-learn/LessonBreadcrumb.tsx
// "Módulo › Lição" no topo do leitor. O nome do módulo é um botão que volta à
// página anterior (history.back, sem hook de router para funcionar em qualquer
// contexto de render). Quem tem a sua própria navegação passa `onBack`.

'use client';

import {
  useStageMaximized,
  useStageMinimize,
} from '@/components/viewers/StageMaximizedContext';

interface LessonBreadcrumbProps {
  moduleTitle: string;
  lessonTitle: string;
  /** Corre depois de sair do ecrã inteiro. Omisso: volta à página anterior do
   *  browser (a menos que se tenha estado em ecrã inteiro, onde só minimiza). */
  onBack?: () => void;
}

export function LessonBreadcrumb({
  moduleTitle,
  lessonTitle,
  onBack,
}: LessonBreadcrumbProps) {
  const maximized = useStageMaximized();
  const minimize = useStageMinimize();
  const handleClick = () => {
    if (maximized) minimize?.();
    if (onBack) onBack();
    else if (!maximized) window.history.back();
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-sunken px-4 py-4 pt-5 font-body text-sm text-ink-muted sm:px-6">
      <button
        type="button"
        onClick={handleClick}
        title={maximized ? 'Sair do ecrã inteiro' : 'Voltar'}
        className="font-medium text-ink underline-offset-2 hover:underline"
      >
        {moduleTitle}
      </button>
      <span className="text-ink-faint">›</span>
      <span>{lessonTitle}</span>
    </div>
  );
}
