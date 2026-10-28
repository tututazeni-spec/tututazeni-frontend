// components/courses-learn/LessonPdf.tsx
// PDF de uma lição dentro da página. Usa sempre o PDF.js (PdfViewer): o
// visualizador nativo num <iframe> de blob: falha sob a CSP da plataforma e
// em browsers sem plugin de PDF. Abre sempre na própria página; maximizar/
// minimizar é o botão único da lição (MaximizableStage).

'use client';

import { FileWarning, Loader2 } from 'lucide-react';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { useLessonPdf } from './useLessonPdf';
import type { LessonProgress } from './types';

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

  return (
    <div className="overflow-hidden rounded-panel border border-brand-line bg-surface shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      <div className="min-h-[60vh] bg-brand-soft">
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
