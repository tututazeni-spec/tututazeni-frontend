// components/courses-modulos/constants.ts
// Mapa de tipos de conteúdo de lição. Extraído de
// app/(platform)/courses/modulos/page.tsx.
//
// NOTA (migração de design): cores mantidas como hex pois são um data-encoding
// (distinguir tipos de conteúdo), não um UI state; está fora de âmbito da
// migração de tokens semânticos (ver task doc).

import {
  Clapperboard,
  Bot,
  FileText,
  BarChart3,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

export const CONTENT_TYPE: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  VIDEO: {
    icon: Clapperboard,
    color: '#dc2626',
    bg: '#fef2f2',
    label: 'Vídeo',
  },
  AVATAR: { icon: Bot, color: '#7c3aed', bg: '#f5f3ff', label: 'Avatar' },
  PDF: { icon: FileText, color: '#f59e0b', bg: '#fffbeb', label: 'PDF' },
  SLIDE: { icon: BarChart3, color: '#ea580c', bg: '#fff7ed', label: 'PPTX' },
  QUIZ: {
    icon: HelpCircle,
    color: '#0ea5e9',
    bg: '#f0f9ff',
    label: 'Questionário',
  },
};
