// components/courses-learn/ContentPlayer.tsx
// Área de reprodução da lição activa (vídeo/PDF/texto/outros) + barra de
// conclusão. Extraído de app/(platform)/courses/[courseId]/learn/page.tsx.

'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { lessonIcon, fmtDuration } from './utils';
import type { LessonProgress, ModuleProgress } from './types';

interface ContentPlayerProps {
  lesson: LessonProgress;
  onComplete: () => void;
  completing: boolean;
  currentModule: ModuleProgress | null;
}

/** Descodifica um data URL base64 num Blob (sem depender de fetch()). */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'application/pdf';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Fonte utilizável no <iframe> para o PDF da lição. Um data URL grande em
 * `src` é bloqueado/truncado por alguns browsers, por isso convertemo-lo
 * num object URL (revogado ao desmontar). URLs http(s) passam directas.
 */
function usePdfSrc(lesson: LessonProgress): string | null {
  const contentUrl = lesson.type === 'PDF' ? lesson.contentUrl : null;
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!contentUrl) {
      setSrc(null);
      return;
    }
    if (!contentUrl.startsWith('data:')) {
      setSrc(contentUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(dataUrlToBlob(contentUrl));
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [contentUrl]);

  return src;
}

export function ContentPlayer({
  lesson,
  onComplete,
  completing,
  currentModule,
}: ContentPlayerProps) {
  const pdfSrc = usePdfSrc(lesson);

  return (
    <div className="flex flex-col h-full">
      {/* Module breadcrumb */}
      {currentModule && (
        <div className="px-6 py-2 border-b border-border bg-surface-sunken font-body text-xs text-ink-muted flex items-center gap-2">
          <span className="font-medium">{currentModule.title}</span>
          <span className="text-ink-faint">›</span>
          <span>{lesson.title}</span>
        </div>
      )}

      {/* Player area */}
      <div className="flex-1 bg-ink flex items-center justify-center">
        {lesson.type === 'VIDEO' ? (
          <div className="text-canvas text-center">
            <div className="text-6xl mb-4">▶</div>
            <div className="font-body text-base font-medium">
              {lesson.title}
            </div>
            <div className="font-body text-sm text-canvas/70 mt-2">
              Player de vídeo (YouTube / Vimeo / próprio)
            </div>
          </div>
        ) : lesson.type === 'PDF' ? (
          pdfSrc ? (
            <iframe
              src={pdfSrc}
              title={lesson.title}
              className="w-full h-full border-0 bg-canvas"
            />
          ) : (
            <div className="text-canvas text-center px-8">
              <div className="text-6xl mb-4">📄</div>
              <div className="font-body text-base font-medium">
                {lesson.title}
              </div>
              <p className="font-body text-sm text-canvas/70 mt-2">
                Esta aula ainda não tem ficheiro PDF carregado.
              </p>
            </div>
          )
        ) : lesson.type === 'TEXT' ? (
          <div className="max-w-2xl mx-auto text-canvas p-8">
            <h2 className="font-display text-xl font-semibold mb-4">
              {lesson.title}
            </h2>
            <p className="font-body text-canvas/80 leading-relaxed">
              Conteúdo de texto da aula aqui…
            </p>
          </div>
        ) : (
          <div className="text-canvas text-center">
            <div className="text-6xl mb-4">{lessonIcon(lesson.type)}</div>
            <div className="font-body text-base font-medium">
              {lesson.title}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface">
        <div>
          <div className="font-body text-sm font-medium text-ink">
            {lesson.title}
          </div>
          {lesson.durationMinutes && (
            <div className="font-body text-xs text-ink-faint">
              {fmtDuration(lesson.durationMinutes)}
            </div>
          )}
          {lesson.type === 'PDF' &&
            lesson.allowDownload &&
            lesson.contentUrl && (
              <a
                href={lesson.contentUrl}
                download
                className="font-body text-xs text-accent hover:text-accent-hover"
              >
                Descarregar PDF
              </a>
            )}
        </div>
        <Button
          onClick={onComplete}
          disabled={completing || lesson.completed}
          intent={lesson.completed ? 'secondary' : 'primary'}
        >
          {lesson.completed ? (
            <>
              <Check size={16} strokeWidth={1.75} /> Concluída
            </>
          ) : completing ? (
            'A marcar…'
          ) : (
            'Marcar como concluída →'
          )}
        </Button>
      </div>
    </div>
  );
}
