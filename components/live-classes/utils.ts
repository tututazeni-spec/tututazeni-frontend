// components/live-classes/utils.ts
// Helpers puros (data/status/embed) e estilos partilhados pelos
// componentes de apresentação do módulo. Extraído verbatim de
// app/(platform)/live-classes/page.tsx.

import type { CSSProperties } from 'react';
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

// Estilos partilhados — o módulo usa style={{}} inline em vez de Tailwind
// (excepção no código-base); mantido tal e qual.
export const tabBtn = (active: boolean): CSSProperties => ({
  padding: '9px 22px',
  border: 'none',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 700 : 500,
  borderRadius: 9,
  background: active ? '#dc2626' : 'transparent',
  color: active ? '#fff' : '#64748b',
  transition: 'all 0.15s',
});

export const INP: CSSProperties = {
  padding: '9px 13px',
  borderRadius: 9,
  border: '1px solid #e2e8f0',
  fontSize: 13.5,
  color: '#1e293b',
  background: '#fff',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const CARD: CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  border: '1px solid #e2e8f0',
};
