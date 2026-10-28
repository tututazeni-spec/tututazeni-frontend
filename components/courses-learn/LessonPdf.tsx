// components/courses-learn/LessonPdf.tsx
// PDF de uma lição dentro da página. Usa sempre o PDF.js (PdfViewer): o
// visualizador nativo num <iframe> de blob: falha sob a CSP da plataforma e
// em browsers sem plugin de PDF. Abre sempre na própria página, com botão
// para maximizar (ecrã inteiro da página) e minimizar (Esc também minimiza).

'use client';

import { useEffect, useState } from 'react';
import { FileWarning, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { useLessonPdf } from './useLessonPdf';
import type { LessonProgress } from './types';

export function LessonPdf({ lesson }: { lesson: LessonProgress }) {
  const pdf = useLessonPdf(lesson);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximized(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [maximized]);

  if (pdf.status === 'none') return null;

  if (pdf.status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-ink-muted">
        <Loader2 size={20} strokeWidth={1.75} className="animate-spin" />
        <span className="font-body text-sm">A abrir PDF…</span>
      </div>
    );
  }

  if (pdf.status === 'error') {
    return (
      <div role="alert" className="px-6 py-10 text-center text-ink">
        <FileWarning
          size={40}
          strokeWidth={1.5}
          className="mx-auto mb-3 text-ink-muted"
        />
        <p className="font-body text-sm">{pdf.message}</p>
      </div>
    );
  }

  return (
    <div
      className={
        maximized
          ? 'fixed inset-0 z-50 flex flex-col bg-surface'
          : 'overflow-hidden rounded-panel border border-brand-line bg-surface shadow-[0_8px_24px_rgba(15,31,61,0.08)]'
      }
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 font-body text-xs">
        <span className="truncate font-semibold text-ink">{lesson.title}</span>
        <button
          type="button"
          onClick={() => setMaximized((v) => !v)}
          aria-label={maximized ? 'Minimizar PDF' : 'Maximizar PDF'}
          title={maximized ? 'Minimizar (Esc)' : 'Maximizar'}
          className="flex items-center gap-1 rounded-card px-2 py-1 font-semibold text-ink hover:bg-surface-sunken"
        >
          {maximized ? (
            <Minimize2 size={14} strokeWidth={1.75} />
          ) : (
            <Maximize2 size={14} strokeWidth={1.75} />
          )}
          {maximized ? 'Minimizar' : 'Maximizar'}
        </button>
      </div>
      <div
        className={
          maximized
            ? 'min-h-0 flex-1 overflow-y-auto bg-brand-soft'
            : 'min-h-[60vh] bg-brand-soft'
        }
      >
        <PdfViewer src={pdf.src} data={pdf.data} title={lesson.title} />
      </div>
      {lesson.allowDownload && (
        <div className="flex justify-end border-t border-border px-4 py-2 font-body text-xs">
          <a
            href={pdf.src}
            download={`${lesson.title}.pdf`}
            className="text-ink-muted underline"
          >
            Descarregar PDF
          </a>
        </div>
      )}
    </div>
  );
}
