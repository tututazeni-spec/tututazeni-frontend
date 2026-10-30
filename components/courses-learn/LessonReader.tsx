// components/courses-learn/LessonReader.tsx
// Leitura directa de lições de Texto e PDF, sem passar pelo ContentPlayer:
// o texto (HTML do editor, sanitizado) aparece na própria página e o PDF num
// visualizador incorporado (LessonPdf). Uma lição pode ter os dois — texto e
// PDF complementar. Actividades, recursos, materiais e quiz reutilizam os
// mesmos blocos do ContentPlayer; a conclusão usa o mesmo LessonFooter, por
// isso o progresso segue o fluxo existente (POST /lessons/progress).

'use client';

import { FileText } from 'lucide-react';
import { lessonTextToHtml } from '@/lib/lessonHtml';
import { SafeHtml } from '@/components/ui/SafeHtml';
import { LessonAudioBar } from './LessonAudioBar';
import { QuizPlayer } from './QuizPlayer';
import { ActivityList, FileList } from './LessonExtras';
import {
  StageMaximizedProvider,
  useStageMaximized,
} from '@/components/viewers/StageMaximizedContext';
import { useFullscreen } from '@/components/viewers/useFullscreen';
import { FullscreenControls } from '@/components/viewers/FullscreenControls';
import { LessonBreadcrumb } from './LessonBreadcrumb';
import { LessonFooter } from './LessonFooter';
import { LessonPdf } from './LessonPdf';
import type { LessonProgress, ModuleProgress } from './types';

interface LessonReaderProps {
  lesson: LessonProgress;
  onComplete: () => void;
  completing: boolean;
  currentModule: ModuleProgress | null;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  /** Clique no nome do módulo; omisso = página anterior do browser. */
  onBackToCourses?: () => void;
}

// Estilo do texto formatado (o projecto não usa o plugin typography).
const RICH_TEXT =
  'font-body text-base leading-relaxed text-ink break-words ' +
  '[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold ' +
  '[&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold ' +
  '[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold ' +
  '[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 ' +
  '[&_li]:mb-1 [&_a]:text-accent [&_a]:underline [&_a]:break-all ' +
  '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic ' +
  '[&_img]:h-auto [&_img]:max-w-full [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto';

export function LessonReader({
  lesson,
  onComplete,
  completing,
  currentModule,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  onBackToCourses,
}: LessonReaderProps) {
  const stageMaximized = useStageMaximized();
  // Ecrã inteiro real: um para o texto/PDF da aula, outro para o questionário.
  const stageFs = useFullscreen();
  const quizFs = useFullscreen();
  // Em ecrã inteiro o conteúdo ocupa o ecrã todo, como no palco maximizado.
  const maximized = stageMaximized || stageFs.isFs;
  const html = lessonTextToHtml(lesson.textContent);
  const hasPdf = !!lesson.hasFile || /^https?:/i.test(lesson.contentUrl ?? '');
  const materials = currentModule?.materials ?? [];

  const text = html ? (
    <article
      key="text"
      className={
        maximized
          ? 'w-full flex-1 bg-surface px-6 py-5 sm:px-10'
          : 'rounded-panel border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(15,31,61,0.08)] sm:p-8'
      }
    >
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">
        {lesson.title}
      </h2>
      <SafeHtml
        className={RICH_TEXT}
        html={html}
        // Ligações do texto abrem à parte: sair da página perdia o sítio na lição.
        onClick={(e) => {
          const a = (e.target as HTMLElement).closest('a');
          if (!a?.href) return;
          e.preventDefault();
          window.open(a.href, '_blank', 'noopener,noreferrer');
        }}
      />
      <LessonAudioBar lessonId={lesson.id} text={lesson.textContent} />
    </article>
  ) : null;

  const pdf = hasPdf ? (
    <section
      key="pdf"
      aria-label="Documento PDF"
      className={maximized ? 'flex-1' : undefined}
    >
      {lesson.type === 'TEXT' && (
        <h3 className="mb-2 font-body text-sm font-semibold text-ink">
          Documento complementar
        </h3>
      )}
      <LessonPdf lesson={lesson} />
    </section>
  ) : null;

  // PDF primeiro nas lições PDF; texto primeiro nas lições de texto.
  const blocks = lesson.type === 'PDF' ? [pdf, text] : [text, pdf];

  return (
    <div className="flex h-full flex-col">
      {currentModule && (
        <LessonBreadcrumb
          moduleTitle={currentModule.title}
          lessonTitle={lesson.title}
          onBack={onBackToCourses}
        />
      )}

      <div
        ref={stageFs.ref}
        tabIndex={-1}
        className={`relative flex min-h-0 flex-1 flex-col bg-brand-soft outline-none ${
          stageFs.isFs && !stageFs.controlsVisible ? 'cursor-none' : ''
        }`}
      >
        <FullscreenControls
          isFs={stageFs.isFs}
          visible={stageFs.controlsVisible}
          onToggle={stageFs.toggle}
        />
        <div className="flex-1 overflow-y-auto">
          <StageMaximizedProvider value={maximized}>
            <div
              className={
                maximized
                  ? 'flex min-h-full w-full flex-col'
                  : 'mx-auto w-full max-w-4xl space-y-6 px-3 py-4 sm:px-6 sm:py-6'
              }
            >
              {!text && !pdf && (
                <div className="px-6 py-10 text-center text-ink">
                  <FileText
                    size={48}
                    strokeWidth={1.5}
                    className="mx-auto mb-3 text-ink-muted"
                  />
                  <div className="font-body text-base font-semibold">
                    {lesson.title}
                  </div>
                  <p className="mt-2 font-body text-sm text-ink-muted">
                    Esta aula ainda não tem conteúdo.
                  </p>
                </div>
              )}
              {blocks}

              {lesson.activities.length > 0 && (
                <section className="rounded-panel bg-surface px-4 py-4 sm:px-6">
                  <h3 className="mb-3 font-body text-sm font-semibold text-ink">
                    Actividades
                  </h3>
                  <ActivityList activities={lesson.activities} />
                </section>
              )}
              {lesson.resources.length > 0 && (
                <section className="rounded-panel bg-surface px-4 py-4 sm:px-6">
                  <h3 className="mb-3 font-body text-sm font-semibold text-ink">
                    Recursos
                  </h3>
                  <FileList files={lesson.resources} />
                </section>
              )}
              {materials.length > 0 && (
                <section className="rounded-panel bg-surface px-4 py-4 sm:px-6">
                  <h3 className="mb-3 font-body text-sm font-semibold text-ink">
                    Materiais do módulo
                  </h3>
                  <FileList files={materials} />
                </section>
              )}
              {lesson.quizId && (
                <section
                  ref={quizFs.ref}
                  tabIndex={-1}
                  className={`relative rounded-panel bg-surface px-4 py-4 outline-none sm:px-6 ${
                    quizFs.isFs
                      ? 'h-full w-full overflow-auto rounded-none'
                      : ''
                  }`}
                >
                  <FullscreenControls
                    isFs={quizFs.isFs}
                    visible={quizFs.controlsVisible}
                    onToggle={quizFs.toggle}
                  />
                  <h3 className="mb-3 font-body text-sm font-semibold text-ink">
                    Avaliação
                  </h3>
                  <QuizPlayer quizId={lesson.quizId} />
                </section>
              )}
            </div>
          </StageMaximizedProvider>
        </div>
      </div>

      <LessonFooter
        title={lesson.title}
        durationMinutes={lesson.durationMinutes}
        completed={lesson.completed}
        completing={completing}
        onComplete={onComplete}
        onPrevious={onPrevious}
        onNext={onNext}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
      />
    </div>
  );
}
