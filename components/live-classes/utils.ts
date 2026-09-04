// components/live-classes/utils.ts
// Helpers puros (data/status/embed) e estilos partilhados pelos
// componentes de apresentação do módulo. Extraído verbatim de
// app/(platform)/live-classes/page.tsx.

import { formatDate } from '@/lib/format';
import type { ClassStatus } from './types';

export const fmtDate = (iso: string) => formatDate(iso, { weekday: 'short' });

export function isVideoUrl(url: string) {
  return (
    /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ||
    url.includes('drive.google.com') ||
    url.includes('youtu')
  );
}

export function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch)
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Google Drive
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch)
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  return null;
}

export function getStatus(scheduledAt: string, duration: number): ClassStatus {
  const now = Date.now();
  const s = new Date(scheduledAt).getTime();
  const e = s + duration * 60_000;
  if (now >= s && now <= e) return 'live';
  if (now < s) return 'upcoming';
  return 'past';
}

// Estilos partilhados — migrados para design tokens via Tailwind
export const tabBtn = (active: boolean): string => {
  const base = 'px-5.5 py-2.25 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer border-none';
  const activeStyles = active
    ? 'bg-danger text-canvas font-bold'
    : 'bg-transparent text-ink-muted';
  return `${base} ${activeStyles}`;
};

export const INP = 'px-3.25 py-2.25 rounded-lg border border-border text-sm text-ink bg-surface outline-none';

export const CARD = 'bg-surface rounded-xl border border-border';
