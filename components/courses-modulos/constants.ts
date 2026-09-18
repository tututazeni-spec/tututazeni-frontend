// components/courses-modulos/constants.ts
// Mapa de tipos de conteúdo de lição — espelha o enum LessonType do Prisma
// (schema.prisma) e a secção "5. Tipo de conteúdo da lição" de
// docs/06-modulo-courses.md.
//
// NOTA (migração de design): cores mantidas como hex pois são um data-encoding
// (distinguir tipos de conteúdo), não um UI state; está fora de âmbito da
// migração de tokens semânticos (ver task doc).
//
// 'AVATAR' existiu aqui antes mas nunca foi um valor válido do enum
// LessonType do Prisma — qualquer submissão com este tipo rebentava sempre
// com 400 (@IsEnum) no backend; removido a favor dos tipos reais.

import {
  Clapperboard,
  FileText,
  Type,
  Headphones,
  BarChart3,
  Link2,
  PackageOpen,
  HelpCircle,
  Radio,
  type LucideIcon,
} from 'lucide-react';

export const CONTENT_TYPE: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; label: string }
> = {
  VIDEO: { icon: Clapperboard, color: '#dc2626', bg: '#fef2f2', label: 'Vídeo' },
  TEXT: { icon: Type, color: '#334155', bg: '#f1f5f9', label: 'Texto' },
  PDF: { icon: FileText, color: '#f59e0b', bg: '#fffbeb', label: 'PDF' },
  AUDIO: { icon: Headphones, color: '#0d9488', bg: '#f0fdfa', label: 'Áudio' },
  SLIDE: { icon: BarChart3, color: '#ea580c', bg: '#fff7ed', label: 'PPTX' },
  LINK: { icon: Link2, color: '#2563eb', bg: '#eff6ff', label: 'Link' },
  SCORM: { icon: PackageOpen, color: '#7c3aed', bg: '#f5f3ff', label: 'Interactivo' },
  QUIZ: { icon: HelpCircle, color: '#0ea5e9', bg: '#f0f9ff', label: 'Questionário' },
  LIVE: { icon: Radio, color: '#e11d48', bg: '#fff1f2', label: 'Aula ao vivo' },
};
