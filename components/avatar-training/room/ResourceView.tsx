// components/avatar-training/room/ResourceView.tsx
// Recurso aprovado associado à etapa (apresentação).

import { safeHref } from '@/lib/safeHref';
import { resourceKind } from './logic';

/** Slide, imagem, vídeo ou documento aprovado associado à etapa. */
export function ResourceView({ url, title }: { url: string; title: string }) {
  const kind = resourceKind(url);
  if (kind === 'image')
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Recurso da etapa: ${title}`}
        className="mt-3 max-h-72 w-full rounded-card border border-border object-contain"
      />
    );
  if (kind === 'video')
    return (
      <video
        src={url}
        controls
        aria-label={`Vídeo da etapa: ${title}`}
        className="mt-3 max-h-72 w-full rounded-card border border-border"
      />
    );
  if (kind === 'pdf')
    return (
      <iframe
        src={url}
        title={`Documento da etapa: ${title}`}
        className="mt-3 h-72 w-full rounded-card border border-border"
      />
    );
  return (
    <a
      href={safeHref(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block font-body text-sm text-primary underline"
    >
      Abrir recurso
    </a>
  );
}
