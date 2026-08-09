// components/courses-learn/utils.ts
// Formatação/labels do domínio de aprendizagem. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.

import type { LessonType, ModuleType } from './types';

export function fmtDuration(min: number | null): string {
  if (!min) return '';
  return min < 60 ? `${min}min` : `${Math.floor(min / 60)}h ${min % 60}min`;
}

export function lessonIcon(type: LessonType): string {
  return (
    {
      VIDEO: '▶',
      PDF: '📄',
      TEXT: '📝',
      AUDIO: '🎵',
      SLIDE: '📊',
      LINK: '🔗',
      SCORM: '📦',
      QUIZ: '❓',
    }[type] ?? '📄'
  );
}

export function moduleTypeLabel(type: ModuleType | null): string {
  if (!type) return '';
  return (
    {
      THEORETICAL: 'Teórico',
      PRACTICAL: 'Prático',
      ASSESSMENT: 'Avaliação',
      PROJECT: 'Projecto',
    }[type] ?? type
  );
}
