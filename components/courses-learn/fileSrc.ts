// components/courses-learn/fileSrc.ts
// Fontes de ficheiros das lições, actividades e recursos. Os ficheiros
// carregados na plataforma ficam guardados como data URL (base64); um data URL
// grande em `src`/`href` é bloqueado ou truncado por alguns browsers, por isso
// converte-se em object URL (blob:) antes de o dar a um leitor ou a um link.

'use client';

import { useEffect, useState } from 'react';

/** Descodifica um data URL base64 num Blob (sem depender de fetch()). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  const mime = /:(.*?)[;,]/.exec(meta)?.[1] ?? 'application/octet-stream';
  if (!/;base64/i.test(meta)) {
    return new Blob([decodeURIComponent(payload)], { type: mime });
  }
  const bin = atob(payload);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Fonte utilizável em <iframe>/<video>/<audio>/<img>/leitores para qualquer
 * URL de ficheiro: http(s) passa directo, data URL vira object URL (revogado
 * ao desmontar). `null` enquanto não há URL.
 */
export function useBlobSrc(url: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setSrc(null);
      return;
    }
    if (!url.startsWith('data:')) {
      setSrc(url);
      return;
    }
    try {
      const objectUrl = URL.createObjectURL(dataUrlToBlob(url));
      setSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } catch {
      setSrc(null);
    }
  }, [url]);

  return src;
}

/** Abre um URL num novo separador; data URLs passam por um object URL. */
export function openFile(url: string): void {
  if (!url.startsWith('data:')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const objectUrl = URL.createObjectURL(dataUrlToBlob(url));
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  // Dá tempo ao novo separador de ler o ficheiro antes de o libertar.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

/** URL de embed para YouTube/Vimeo; `null` se não reconhecido. */
export function embeddableVideoUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname === 'youtu.be') {
      const id =
        u.hostname === 'youtu.be'
          ? u.pathname.slice(1)
          : u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export type FileKind = 'pdf' | 'image' | 'video' | 'audio' | 'other';

/** Tipo de ficheiro por data URL (mime) ou extensão do URL / `fileType`. */
export function fileKind(url: string, hint?: string | null): FileKind {
  const mime = url.startsWith('data:')
    ? (/^data:([^;,]+)/.exec(url)?.[1] ?? '')
    : '';
  const ext = url.startsWith('data:')
    ? ''
    : (/\.([a-z0-9]+)(?:$|[?#])/i.exec(url)?.[1]?.toLowerCase() ?? '');
  const h = (hint ?? '').toLowerCase();
  const probe = `${mime} ${ext} ${h}`;
  if (/pdf/.test(probe)) return 'pdf';
  if (/image|png|jpe?g|gif|webp|svg/.test(probe)) return 'image';
  if (/video|mp4|webm|ogv|mov/.test(probe)) return 'video';
  if (/audio|mp3|wav|ogg|m4a|aac/.test(probe)) return 'audio';
  return 'other';
}
