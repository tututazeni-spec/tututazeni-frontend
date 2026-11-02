// components/content-library/ContentViewerModal.tsx
// Abre vídeos, áudio, PDF e apresentações da biblioteca dentro da plataforma
// (leitores já existentes) em vez de um novo separador do browser.

'use client';

import { Modal, ModalContent } from '@/components/ui/Modal';
import { LibraryFileViewer } from '@/components/library/LibraryFileViewer';
import { embeddableVideoUrl } from '@/components/courses-learn/fileSrc';

// ContentFormat -> tipo esperado pelo LibraryFileViewer. Formatos ausentes
// daqui continuam a abrir noutro separador (páginas externas, SCORM, etc.).
const VIEWER_TYPE: Record<string, string> = {
  VIDEO: 'VIDEO',
  WEBINAR: 'VIDEO',
  MICROLEARNING: 'VIDEO',
  PODCAST: 'AUDIO',
  PDF: 'PDF',
  EBOOK: 'EBOOK',
  PRESENTATION: 'PRESENTATION',
};

export function canViewInPlatform(format: string): boolean {
  return format in VIEWER_TYPE;
}

interface ContentViewerModalProps {
  title: string;
  format: string;
  url: string | null;
  onClose: () => void;
}

export function ContentViewerModal({
  title,
  format,
  url,
  onClose,
}: ContentViewerModalProps) {
  const embed = url ? embeddableVideoUrl(url) : null;
  return (
    <Modal open={!!url} onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={title} navyBanner className="max-w-4xl">
        <div className="flex h-[65vh] items-center justify-center overflow-hidden rounded-card bg-ink">
          {url &&
            (embed ? (
              <iframe
                src={embed}
                title={title}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <LibraryFileViewer
                fileUrl={url}
                type={VIEWER_TYPE[format] ?? 'VIDEO'}
                title={title}
              />
            ))}
        </div>
      </ModalContent>
    </Modal>
  );
}
