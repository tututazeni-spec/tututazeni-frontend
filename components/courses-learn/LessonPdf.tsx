// components/courses-learn/LessonPdf.tsx
// PDF de uma lição dentro da página. Usa o visualizador nativo do browser
// quando existe (navigator.pdfViewerEnabled) e cai para o PDF.js (PdfViewer)
// onde não existe — telemóveis Android, browsers geridos pela TI, etc.
// Em ambos os casos há sempre "Abrir noutro separador".

'use client';

import { FileWarning, Loader2 } from 'lucide-react';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { useLessonPdf } from './useLessonPdf';
import type { LessonProgress } from './types';

/** `true` se o browser mostra PDFs embutidos; desconhecido conta como sim. */
function hasNativePdfViewer(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.pdfViewerEnabled !== false;
}

export function LessonPdf({ lesson }: { lesson: LessonProgress }) {
  const pdf = useLessonPdf(lesson);

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

  const native = hasNativePdfViewer();

  return (
    <div className="overflow-hidden rounded-panel border border-brand-line bg-white shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      {native ? (
        <iframe
          src={pdf.src}
          title={lesson.title}
          className="block h-[70vh] w-full border-0 sm:h-[80vh]"
        />
      ) : (
        <div className="min-h-[60vh] bg-[#E9EDF4]">
          <PdfViewer src={pdf.src} title={lesson.title} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 font-body text-xs">
        <a
          href={pdf.src}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ink underline"
        >
          Abrir noutro separador
        </a>
        {lesson.allowDownload && (
          <a
            href={pdf.src}
            download={`${lesson.title}.pdf`}
            className="text-ink-muted underline"
          >
            Descarregar PDF
          </a>
        )}
      </div>
    </div>
  );
}
