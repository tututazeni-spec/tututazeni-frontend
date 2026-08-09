// components/courses-learn/types.ts
// Tipos do domínio de "aprender curso" (progresso/módulos/lições) e do
// construtor de módulos admin. Extraído de
// app/(platform)/courses/[courseId]/learn/page.tsx.

export type LessonType =
  'VIDEO' | 'PDF' | 'TEXT' | 'AUDIO' | 'SLIDE' | 'LINK' | 'SCORM' | 'QUIZ';
export type ModuleType = 'THEORETICAL' | 'PRACTICAL' | 'ASSESSMENT' | 'PROJECT';
export type ModuleStatus = 'DRAFT' | 'PUBLISHED';

export interface LessonProgress {
  id: number;
  title: string;
  type: LessonType;
  seq: number;
  durationMinutes: number | null;
  isFree: boolean;
  completed: boolean;
  completedAt: string | null;
  resumePosition: number;
}

export interface ModuleMaterial {
  id: number;
  title: string;
  url: string;
  fileType: string | null;
  fileSizeKb: number | null;
}

export interface ModuleProgress {
  id: number;
  title: string;
  seq: number;
  type: ModuleType | null;
  mandatory: boolean;
  completedCount: number;
  totalCount: number;
  pct: number;
  completed: boolean;
  locked: boolean;
  lockedReason: string | undefined;
  materials: ModuleMaterial[];
  lessons: LessonProgress[];
}

export interface LessonSummary {
  id: number;
  title: string;
  type: LessonType;
  durationMinutes: number | null;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  description: string | null;
  learningObjectives: string[];
  seq: number;
  status: ModuleStatus;
  type: ModuleType | null;
  progressionType: string;
  completionRule: string;
  minCompletionPercent: number;
  mandatory: boolean;
  dripDays: number | null;
  availableFrom: string | null;
  lessons: LessonSummary[];
  materials: ModuleMaterial[];
  _count: { lessons: number };
}

export interface CourseDetail {
  modules?: Module[];
}

export type PageMode = 'learn' | 'build';

// ─── Tipo do conteúdo da lição usado no exemplo de integração do avatar ──
// (ver CourseAvatarReaderExample.tsx)

export interface Lesson {
  id: number;
  title: string;
  contentType: 'TEXT' | 'VIDEO' | 'PDF' | 'AUDIO' | 'SLIDE' | 'LINK';
  textContent: string | null;
  contentUrl: string | null;
  durationMinutes: number | null;
}
