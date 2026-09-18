// components/courses-modulos/types.ts
// Tipos do domínio de módulos/lições. Extraído de
// app/(platform)/courses/modulos/page.tsx. Estendido com os campos da
// secção "3. Novo Módulo" / "4. Módulo → Lições" / "5. Tipo de conteúdo" /
// "6. Configuração da lição" / "7. Actividades" / "9. Recursos" de
// docs/06-modulo-courses.md.

export type ModuleStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
export type ModuleType = 'THEORETICAL' | 'PRACTICAL' | 'ASSESSMENT' | 'PROJECT';
export type ProgressionType = 'SEQUENTIAL' | 'FREE' | 'HYBRID';

export type LessonStatus = 'DRAFT' | 'PUBLISHED';
export type LessonActivityType =
  | 'TEXT'
  | 'VIDEO'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'AUDIO'
  | 'QUIZ'
  | 'OPEN_QUESTION'
  | 'EXERCISE'
  | 'TASK'
  | 'SURVEY'
  | 'DISCUSSION'
  | 'DOWNLOAD'
  | 'EXTERNAL_LINK';

export interface LessonActivity {
  id: number;
  lessonId: number;
  type: LessonActivityType;
  title: string;
  description?: string | null;
  contentUrl?: string | null;
  seq: number;
}

export interface LessonResource {
  id: number;
  lessonId: number;
  title: string;
  url: string;
  fileType?: string | null;
  fileSizeKb?: number | null;
}

export interface Lesson {
  id: number;
  moduleId: number;
  code?: string | null;
  title: string;
  description?: string | null;
  // Campos tal como chegam de GET /courses/:id (registo Lesson cru): `type`
  // é o enum LessonType (VIDEO|TEXT|PDF|AUDIO|SLIDE|LINK|SCORM|QUIZ|LIVE) e o
  // conteúdo (URL de vídeo ou PDF, este último em data URL) vive em
  // `contentUrl`.
  type: string;
  status?: LessonStatus;
  contentUrl?: string | null;
  textContent?: string | null;
  captionsUrl?: string | null;
  transcript?: string | null;
  seq: number;
  durationMinutes?: number | null;
  mandatory?: boolean;
  allowSkip?: boolean;
  allowDownload?: boolean;
  autoComplete?: boolean;
  minWatchSeconds?: number | null;
  requiresActivity?: boolean;
  requiresAssessment?: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  requiredLessonId?: number | null;
  liveDate?: string | null;
  liveSessionUrl?: string | null;
  liveInstructorId?: number | null;
  activities?: LessonActivity[];
  resources?: LessonResource[];
}

export interface ModuleCompetency {
  competency: { id: number; name: string };
}

export interface ModuleMaterial {
  id: number;
  moduleId: number;
  title: string;
  url: string;
  fileType?: string | null;
  fileSizeKb?: number | null;
}

export interface ModuleAssessment {
  id: number;
  title: string;
  status?: string;
}

export interface CourseModule {
  id: number;
  courseId: number;
  code?: string | null;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  seq: number;
  status?: ModuleStatus;
  type?: ModuleType | null;
  progressionType?: ProgressionType;
  minCompletionPercent?: number | null;
  minQuizScore?: number | null;
  mandatory?: boolean;
  allowSkip?: boolean;
  estimatedDurationMinutes?: number | null;
  learningObjectives?: string[];
  requiredModuleId?: number | null;
  lessons: Lesson[];
  competencies?: ModuleCompetency[];
  materials?: ModuleMaterial[];
  assessments?: ModuleAssessment[];
}

export interface LessonProgress {
  id: number;
  lessonId: number;
  completed: boolean;
  completedAt?: string;
  lesson: Lesson & { module: CourseModule };
}
