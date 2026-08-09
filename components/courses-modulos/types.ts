// components/courses-modulos/types.ts
// Tipos do domínio de módulos/lições. Extraído de
// app/(platform)/courses/modulos/page.tsx.

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  contentType: string;
  videoUrl?: string;
  pdfUrl?: string;
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
