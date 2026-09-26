// components/viewers/PdfViewer.tsx
// Leitor de PDF embutido (pdfjs-dist), com paginação própria — em vez de
// depender do plugin nativo do browser via <iframe>, que alguns browsers
// geridos por TI corporativa desactivam (forçando download em vez de
// abertura). `src` aceita qualquer URL que o browser consiga fazer fetch:
// http(s) ou um object URL (blob:) — ver useFileSrc em ContentPlayer.tsx.
'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileWarning, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PdfViewerProps {
  src: string;
  title: string;
}

type Status = 'loading' | 'ready' | 'error';

export function PdfViewer({ src, title }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);

  // Carrega o documento sempre que a fonte muda.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const pdf = await pdfjsLib.getDocument({ url: src }).promise;
        if (cancelled) {
          void pdf.destroy();
          return;
        }
        docRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNum(1);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void load();

    return () => {
      cancelled = true;
      void docRef.current?.destroy();
      docRef.current = null;
    };
  }, [src]);

  // Renderiza a página actual num <canvas> sempre que o documento carrega
  // ou a página seleccionada muda.
  useEffect(() => {
    if (status !== 'ready') return;
    const pdf = docRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;
    let cancelled = false;

    async function renderPage() {
      if (!pdf || !canvas) return;
      const page = await pdf.getPage(pageNum);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: 1.4 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
    }

    void renderPage();
    return () => {
      cancelled = true;
    };
  }, [status, pageNum]);

  if (status === 'error') {
    return (
      <div className="text-canvas text-center px-8">
        <FileWarning size={56} strokeWidth={1.5} className="mx-auto mb-4" />
        <div className="font-body text-base font-medium">{title}</div>
        <p className="font-body text-sm text-canvas/70 mt-2">
          Não foi possível abrir este PDF.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full py-6">
      {status === 'loading' && (
        <div className="text-canvas flex flex-col items-center gap-2">
          <Loader2 size={32} strokeWidth={1.75} className="animate-spin" />
          <span className="font-body text-sm text-canvas/70">A abrir PDF…</span>
        </div>
      )}
      <div className="flex-1 w-full overflow-auto flex items-start justify-center px-4">
        <canvas
          ref={canvasRef}
          className={status === 'ready' ? 'shadow-lg bg-white' : 'hidden'}
        />
      </div>
      {status === 'ready' && numPages > 1 && (
        <div className="flex items-center gap-3 bg-canvas/10 rounded-full px-3 py-1.5">
          <Button
            intent="ghost"
            size="sm"
            aria-label="Página anterior"
            disabled={pageNum <= 1}
            onClick={() => setPageNum(p => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span className="font-body text-xs text-canvas">
            Página {pageNum} de {numPages}
          </span>
          <Button
            intent="ghost"
            size="sm"
            aria-label="Página seguinte"
            disabled={pageNum >= numPages}
            onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
        </div>
      )}
    </div>
  );
}
