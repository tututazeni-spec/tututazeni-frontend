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
import { useStageMaximized } from './StageMaximizedContext';
import { useIdleHide } from './useFullscreen';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

interface PdfViewerProps {
  src: string;
  title: string;
  /** Bytes do PDF já descarregados: evita um fetch(blob:) extra (CSP/connect-src). */
  data?: ArrayBuffer;
}

type Status = 'loading' | 'ready' | 'error';

type PdfjsModule = typeof import('pdfjs-dist');

// O pdf.js é servido como ficheiro estático (public/pdfjs, cópia de
// node_modules/pdfjs-dist/build — actualizar ao mudar a versão do pacote):
// empacotado pelo webpack do Next rebenta com "Object.defineProperty called
// on non-object". webpackIgnore deixa o import dinâmico ao browser.
const PDFJS_URL = '/pdfjs/pdf.min.mjs';
let pdfjsPromise: Promise<PdfjsModule> | null = null;
function loadPdfjs(): Promise<PdfjsModule> {
  pdfjsPromise ??= import(
    /* webpackIgnore: true */ /* @vite-ignore */ PDFJS_URL
  ).then((m) => {
    m.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    return m;
  });
  pdfjsPromise.catch(() => {
    pdfjsPromise = null;
  });
  return pdfjsPromise;
}

export function PdfViewer({ src, title, data }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  // O pdf.js não aceita dois render() no mesmo canvas ao mesmo tempo.
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const wrapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // O ecrã inteiro é do palco que contém este leitor (ver ContentPlayer).
  const [inFs, setInFs] = useState(false);
  const controlsVisible = useIdleHide(inFs);
  const maximized = useStageMaximized();
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);

  // Carrega o documento sempre que a fonte muda.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      try {
        const pdfjsLib = await loadPdfjs();
        const pdf = await pdfjsLib.getDocument(
          // pdf.js transfere (esvazia) o buffer: dar-lhe sempre uma cópia.
          data ? { data: new Uint8Array(data.slice(0)) } : { url: src },
        ).promise;
        if (cancelled) {
          void pdf.destroy();
          return;
        }
        docRef.current = pdf;
        setNumPages(pdf.numPages);
        setPageNum(1);
        setStatus('ready');
      } catch (e) {
        console.error('[PdfViewer] falha ao abrir o PDF', e);
        if (!cancelled) setStatus('error');
      }
    }

    void load();

    return () => {
      cancelled = true;
      void docRef.current?.destroy();
      docRef.current = null;
    };
  }, [src, data]);

  useEffect(() => {
    const onChange = () =>
      setInFs(!!document.fullscreenElement?.contains(rootRef.current));
    onChange();
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ← → mudam de página: em ecrã inteiro, ou com o foco dentro do leitor.
  useEffect(() => {
    if (status !== 'ready') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      )
        return;
      if (!inFs && !rootRef.current?.contains(target)) return;
      e.preventDefault();
      setPageNum((p) =>
        e.key === 'ArrowRight' ? Math.min(numPages, p + 1) : Math.max(1, p - 1),
      );
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [status, inFs, numPages]);

  // Ajusta a página à largura disponível (muda ao maximizar/minimizar).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      setWidth(el.clientWidth);
      setHeight(el.clientHeight);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      const base = page.getViewport({ scale: 1 });
      // Maximizado: a página inteira cabe no ecrã (largura e altura), sem margens.
      const pad = maximized ? 0 : 32;
      const byWidth = width > 0 ? (width - pad) / base.width : 1.4;
      const fit =
        maximized && height > 0
          ? Math.min(byWidth, height / base.height)
          : byWidth;
      const viewport = page.getViewport({
        scale: Math.min(3, Math.max(0.5, fit)),
      });
      // Cancela o desenho anterior e espera que largue o canvas.
      const previous = renderTaskRef.current;
      if (previous) {
        previous.cancel();
        try {
          await previous.promise;
        } catch {
          // RenderingCancelledException: esperado ao cancelar.
        }
      }
      if (cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const task = page.render({ canvas, viewport });
      renderTaskRef.current = task;
      try {
        await task.promise;
      } catch (e) {
        if ((e as { name?: string }).name !== 'RenderingCancelledException')
          throw e;
      }
    }

    void renderPage().catch((e) =>
      console.error('[PdfViewer] falha ao desenhar a página', e),
    );
    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [status, pageNum, width, height, maximized]);

  if (status === 'error') {
    return (
      <div className="text-ink text-center px-8">
        <FileWarning size={56} strokeWidth={1.5} className="mx-auto mb-4" />
        <div className="font-body text-base font-medium">{title}</div>
        <p className="font-body text-sm text-ink-muted mt-2">
          Não foi possível abrir este PDF.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-body text-sm font-semibold text-ink underline"
        >
          Abrir noutro separador
        </a>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative flex flex-col items-center w-full h-full ${
        maximized ? 'gap-1' : 'gap-3 py-6'
      }`}
    >
      {status === 'loading' && (
        <div className="text-ink flex flex-col items-center gap-2">
          <Loader2 size={32} strokeWidth={1.75} className="animate-spin" />
          <span className="font-body text-sm text-ink-muted">A abrir PDF…</span>
        </div>
      )}
      <div
        ref={wrapRef}
        className={`flex-1 min-h-0 w-full overflow-auto flex justify-center ${
          maximized ? 'items-center' : 'items-start px-4'
        }`}
      >
        <canvas
          ref={canvasRef}
          className={status === 'ready' ? 'shadow-lg bg-surface' : 'hidden'}
        />
      </div>
      {status === 'ready' && numPages > 1 && (
        <div
          className={`flex items-center gap-3 rounded-full px-3 py-1.5 ${
            inFs
              ? `absolute bottom-4 left-1/2 z-20 -translate-x-1/2 bg-black/70 text-white transition-opacity duration-300 ${
                  controlsVisible
                    ? 'opacity-100'
                    : 'pointer-events-none opacity-0'
                }`
              : 'bg-ink/10'
          }`}
        >
          <Button
            intent="ghost"
            size="sm"
            aria-label="Página anterior"
            disabled={pageNum <= 1}
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span
            className={`font-body text-xs ${inFs ? 'text-white' : 'text-ink'}`}
          >
            Página {pageNum} de {numPages}
          </span>
          <Button
            intent="ghost"
            size="sm"
            aria-label="Página seguinte"
            disabled={pageNum >= numPages}
            onClick={() => setPageNum((p) => Math.min(numPages, p + 1))}
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
        </div>
      )}
    </div>
  );
}
