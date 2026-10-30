// components/courses-learn/LessonBreadcrumb.tsx
// "Módulo › Lição" no topo do leitor. O nome do módulo é um botão que volta à
// página anterior (history.back, sem hook de router para funcionar em qualquer
// contexto de render). Quem tem a sua própria navegação passa `onBack`.

'use client';

interface LessonBreadcrumbProps {
  moduleTitle: string;
  lessonTitle: string;
  /** Por omissão volta à página anterior do browser. */
  onBack?: () => void;
}

export function LessonBreadcrumb({
  moduleTitle,
  lessonTitle,
  onBack,
}: LessonBreadcrumbProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-sunken px-4 py-4 pt-5 font-body text-sm text-ink-muted sm:px-6">
      <button
        type="button"
        onClick={onBack ?? (() => window.history.back())}
        title="Voltar à página anterior"
        className="font-medium text-ink underline-offset-2 hover:underline"
      >
        {moduleTitle}
      </button>
      <span className="text-ink-faint">›</span>
      <span>{lessonTitle}</span>
    </div>
  );
}
