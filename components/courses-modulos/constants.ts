// components/courses-modulos/constants.ts
// Mapa de tipos de conteúdo de lição. Extraído de
// app/(platform)/courses/modulos/page.tsx.

export const CONTENT_TYPE: Record<
  string,
  { icon: string; color: string; bg: string; label: string }
> = {
  VIDEO: { icon: '🎬', color: '#dc2626', bg: '#fef2f2', label: 'Vídeo' },
  AVATAR: { icon: '🤖', color: '#7c3aed', bg: '#f5f3ff', label: 'Avatar' },
  PDF: { icon: '📄', color: '#f59e0b', bg: '#fffbeb', label: 'PDF' },
  QUIZ: { icon: '❓', color: '#0ea5e9', bg: '#f0f9ff', label: 'Quiz' },
};
