// components/courses-modulos/types.ts
// Tipos do domínio de módulos/lições. Extraído de
// app/(platform)/courses/modulos/page.tsx.

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  // Campos tal como chegam de GET /courses/:id (registo Lesson cru): `type`
  // é o enum LessonType (VIDEO|PDF|TEXT|AUDIO|SLIDE|LINK) e o conteúdo
  // (URL de vídeo ou PDF, este último em data URL) vive em `contentUrl`.
  type: string;
  contentUrl?: string | null;
  seq: number;
}

export interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  seq: number;
  lessons: Lesson[];
}

export interface LessonProgress {
  id: number;
  lessonId: number;
  completed: boolean;
  completedAt?: string;
  lesson: Lesson & { module: CourseModule };
}
