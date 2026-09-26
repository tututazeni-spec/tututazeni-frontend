// components/viewers/PptxViewer.tsx
// Leitor de apresentações PowerPoint (.pptx) embutido — não há suporte
// nativo do browser para este formato (ao contrário do PDF), por isso
// recorre à biblioteca `pptx-preview`, que faz o parsing/render 100% no
// cliente (não precisa de nenhum serviço de conversão no servidor).
// `src` aceita qualquer URL que o browser consiga fazer fetch: http(s) ou um
// object URL (blob:) — ver useFileSrc em ContentPlayer.tsx.
'use client';

import { useEffect, useRef, useState } from 'react';
import { FileWarning, Loader2 } from 'lucide-react';
import type { init as PptxPreviewInit } from 'pptx-preview';

interface PptxViewerProps {
  src: string;
  title: string;
}

type Status = 'loading' | 'ready' | 'error';
type Previewer = ReturnType<typeof PptxPreviewInit>;

const SLIDE_WIDTH = 960;
const SLIDE_HEIGHT = 540;

export function PptxViewer({ src, title }: PptxViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<Previewer | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');
      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = '';

      try {
        const [{ init }, res] = await Promise.all([import('pptx-preview'), fetch(src)]);
        if (cancelled) return;
        if (!res.ok) throw new Error('Falha ao obter o ficheiro');
        const buffer = await res.arrayBuffer();
        if (cancelled || !containerRef.current) return;

        const previewer = init(containerRef.current, {
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          mode: 'slide',
        });
        previewerRef.current = previewer;
        await previewer.preview(buffer);
        if (cancelled) return;
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void load();

    return () => {
      cancelled = true;
      previewerRef.current?.destroy();
      previewerRef.current = null;
    };
  }, [src]);

  if (status === 'error') {
    return (
      <div className="text-canvas text-center px-8">
        <FileWarning size={56} strokeWidth={1.5} className="mx-auto mb-4" />
        <div className="font-body text-base font-medium">{title}</div>
        <p className="font-body text-sm text-canvas/70 mt-2">
          Não foi possível abrir esta apresentação.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 py-6">
      {status === 'loading' && (
        <div className="text-canvas flex flex-col items-center gap-2">
          <Loader2 size={32} strokeWidth={1.75} className="animate-spin" />
          <span className="font-body text-sm text-canvas/70">A abrir apresentação…</span>
        </div>
      )}
      <div className="w-full overflow-auto px-4 flex justify-center">
        <div
          ref={containerRef}
          className={status === 'ready' ? 'shadow-lg' : 'hidden'}
          style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
        />
      </div>
    </div>
  );
}
