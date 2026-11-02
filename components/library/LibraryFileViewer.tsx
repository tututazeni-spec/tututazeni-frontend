// components/library/LibraryFileViewer.tsx
// Abre o ficheiro de um recurso da biblioteca com os leitores que a plataforma
// já tem (PdfViewer, PptxViewer). Funciona para ligações http(s) e para
// ficheiros carregados (data URL, convertido em object URL por useBlobSrc).
// Formatos sem leitor embutido (Word, Excel, texto…) mostram "Abrir".

'use client';

import { ExternalLink, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PdfViewer } from '@/components/viewers/PdfViewer';
import { PptxViewer } from '@/components/viewers/PptxViewer';
import {
  fileKind,
  openFile,
  useBlobSrc,
} from '@/components/courses-learn/fileSrc';

interface LibraryFileViewerProps {
  fileUrl: string;
  type: string;
  title: string;
}

const PPTX_RE = /presentationml|\.pptx?(?:$|[?#])/i;

type ViewerKind = 'pdf' | 'pptx' | 'image' | 'video' | 'audio' | 'other';

function viewerKind(fileUrl: string, type: string): ViewerKind {
  const probe = fileUrl.startsWith('data:') ? fileUrl.slice(0, 100) : fileUrl;
  if (type === 'PRESENTATION' || PPTX_RE.test(probe)) return 'pptx';
  if (type === 'PDF' || type === 'EBOOK') {
    const k = fileKind(fileUrl, type === 'PDF' ? 'pdf' : null);
    return k === 'pdf' ? 'pdf' : k;
  }
  const k = fileKind(
    fileUrl,
    type === 'VIDEO' ? 'video' : type === 'AUDIO' ? 'audio' : null,
  );
  return k;
}

export function LibraryFileViewer({
  fileUrl,
  type,
  title,
}: LibraryFileViewerProps) {
  const src = useBlobSrc(fileUrl);
  const kind = viewerKind(fileUrl, type);

  if (!src) {
    return (
      <div className="px-8 py-10 text-center font-body text-sm text-canvas/80">
        <FileWarning size={40} strokeWidth={1.5} className="mx-auto mb-3" />
        Não foi possível preparar o ficheiro.
      </div>
    );
  }

  switch (kind) {
    case 'pdf':
      return <PdfViewer src={src} title={title} />;
    case 'pptx':
      return <PptxViewer src={src} title={title} />;
    case 'image':
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={title} className="max-h-full max-w-full" />;
    case 'video':
      return <video controls src={src} className="h-full w-full bg-black" />;
    case 'audio':
      return <audio controls src={src} className="w-full max-w-xl" />;
    default:
      return (
        <div className="px-8 py-10 text-center font-body text-sm text-canvas/80">
          <p className="mb-4">
            Este formato não tem leitor embutido. Abre o ficheiro num novo
            separador.
          </p>
          <Button intent="secondary" onClick={() => openFile(fileUrl)}>
            <ExternalLink size={16} strokeWidth={1.75} />
            Abrir ficheiro
          </Button>
        </div>
      );
  }
}
