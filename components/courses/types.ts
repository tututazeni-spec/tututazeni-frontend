// components/courses/types.ts
// Tipos do domínio "cursos" — partilhados entre CourseCard/CatalogView/
// MyEnrollmentsView/AdminDashboardView (que continuam em
// app/(platform)/courses/page.tsx) e o container/vista de CourseDetail
// (hooks/useCourseDetail.ts, components/courses/CourseDetailView.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type LessonType =
  'VIDEO' | 'PDF' | 'TEXT' | 'AUDIO' | 'SLIDE' | 'LINK' | 'SCORM' | 'QUIZ';
export type EnrollmentStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

export interface Course {
  id: number;
  title: string;
  shortDescription: string | null;
  description: string | null;
  category: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  workloadHours: number | null;
  language: string;
  level: CourseLevel;
  status: CourseStatus;
  mandatory: boolean;
  internalCode: string | null;
  learningObjectives: string[];
  passingScore: number | null;
  createdAt: string;
  publishedAt: string | null;
  _count: { enrollments: number; feedbacks: number; modules: number };
  competencies: Array<{ competency: { id: number; name: string } }>;
}

export interface Lesson {
  id: number;
  title: string;
  type: LessonType;
  seq: number;
  durationMinutes: number | null;
  isFree: boolean;
  completed: boolean;
  resumePosition: number;
}

export interface CourseModule {
  id: number;
  title: string;
  seq: number;
  lessons: Lesson[];
  completedCount: number;
  totalCount: number;
}

// Usados só por CourseDetail (hooks/useCourseDetail.ts +
// components/courses/CourseDetailView.tsx).

// `courseProgress` e `modules` são opcionais de propósito: o endpoint
// GET /courses/:id/progress já foi visto a devolver um objecto parcial
// (só `enrollment`), e um `progress?.courseProgress.pct` — em que o `?.`
// só cobre `progress` nulo — rebentava com "reading 'pct' of undefined".
// Todos os consumidores têm de tratar a ausência (ver useCourseDetail /
// CourseDetailView).
export interface CourseProgress {
  enrollment: { id: number; status: EnrollmentStatus; deadline: string | null };
  courseProgress?: {
    totalLessons: number;
    completedLessons: number;
    pct: number;
  };
  modules?: CourseModule[];
}

export interface CourseDetailModule {
  id: number;
  title: string;
  lessons?: Array<{
    id: number;
    title: string;
    type: LessonType;
    durationMinutes: number | null;
    isFree: boolean;
  }>;
}

export interface CourseFeedback {
  id: number;
  rating: number;
  comment: string;
  user: { fullName: string };
}

export type CourseDetailData = Course & {
  modules?: CourseDetailModule[];
  feedbacks?: CourseFeedback[];
};

// ─── Tipos das restantes views (Catalog/MyEnrollments/Certificates/AdminDashboard) ──
// Extraído de app/(platform)/courses/page.tsx.

export interface Certificate {
  id: number;
  code: string;
  issuedAt: string;
  expiresAt: string | null;
  course: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
  };
}

export interface PaginatedCourses {
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminDashboard {
  courses: { total: number; published: number };
  enrollments: { total: number; completed: number; overdue: number };
  completionRate: number;
  topCourses: Course[];
}

export interface MyEnrollment {
  id: number;
  courseId: number;
  status: EnrollmentStatus;
  deadline: string | null;
  mandatory?: boolean;
  course: {
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
    workloadHours: number | null;
  };
}

export interface CertificateVerifyResult {
  valid?: boolean;
  error?: string;
  user?: { fullName: string };
  course?: { title: string };
}

export type View =
  'catalog' | 'detail' | 'my-courses' | 'certificates' | 'dashboard' | 'gestao';
export type TopLevelView = Exclude<View, 'detail'>;

// view e selectedId eram dois useState separados sempre definidos em conjunto
// (handleSelect/handleBack) — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: TopLevelView } | { view: 'detail'; selectedId: number };
