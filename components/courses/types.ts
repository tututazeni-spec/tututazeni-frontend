// components/courses/types.ts
// Tipos do domínio "cursos" — partilhados entre CourseCard/CatalogView/
// MyEnrollmentsView/AdminDashboardView (que continuam em
// app/(platform)/courses/page.tsx) e o container/vista de CourseDetail
// (hooks/useCourseDetail.ts, components/courses/CourseDetailView.tsx).
// Ver memory project_innova_component_separation_audit, item 3.6.

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED';
export type CourseVisibility = 'PUBLIC' | 'PRIVATE' | 'EMPLOYEES_ONLY' | 'SELECTED_GROUPS';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseType =
  | 'OBRIGATORIO'
  | 'OPCIONAL'
  | 'COMPLIANCE'
  | 'INTEGRACAO'
  | 'DESENVOLVIMENTO'
  | 'TECNICO'
  | 'COMPORTAMENTAL'
  | 'LIDERANCA';
export type CourseModality = 'ONLINE' | 'PRESENCIAL' | 'HIBRIDO' | 'AO_VIVO' | 'AUTOAPRENDIZAGEM';
export type LessonType =
  | 'VIDEO'
  | 'PDF'
  | 'TEXT'
  | 'AUDIO'
  | 'SLIDE'
  | 'LINK'
  | 'SCORM'
  | 'QUIZ'
  | 'LIVE';
export type EnrollmentStatus =
  | 'PENDING_APPROVAL'
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface Course {
  id: number;
  title: string;
  shortDescription: string | null;
  description: string | null;
  category: string | null;
  knowledgeArea: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  workloadHours: number | null;
  estimatedDurationDays: number | null;
  language: string;
  level: CourseLevel;
  status: CourseStatus;
  visibility: CourseVisibility;
  mandatory: boolean;
  type: CourseType | null;
  modality: CourseModality | null;
  internalCode: string | null;
  departmentId: number | null;
  department?: { id: number; name: string; code: string } | null;
  unit: string | null;
  targetAudience: string[];
  learningObjectives: string[];
  startDate: string | null;
  endDate: string | null;
  requiresApproval: boolean;
  passingScore: number | null;
  minCompletionPercent: number | null;
  certificateEnabled: boolean;
  certificateCriteria: string | null;
  certificateValidityDays: number | null;
  primaryInstructorId: number | null;
  requiredCourseId: number | null;
  createdAt: string;
  publishedAt: string | null;
  _count: { enrollments: number; feedbacks: number; modules: number };
  /** Média de Enrollment.progress dos inscritos — só em GET /courses (findAll). */
  avgProgress?: number;
  competencies: Array<{ competency: { id: number; name: string } }>;
  primaryInstructor?: { id: number; fullName: string; avatarUrl: string | null } | null;
  requiredCourse?: { id: number; title: string } | null;
  instructors?: Array<{
    id: number;
    userId: number;
    user: { id: number; fullName: string; avatarUrl: string | null };
  }>;
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
  enrollment: {
    id: number;
    status: EnrollmentStatus;
    deadline: string | null;
    completedAt?: string | null;
    certificate?: { id: number; code: string | null; issuedAt: string; fileUrl: string | null } | null;
  };
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

export interface RelatedCourse {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  category: string | null;
  level: CourseLevel;
  workloadHours: number | null;
}

export interface LearningPathRef {
  id: number;
  title: string;
}

export type CourseDetailData = Course & {
  modules?: CourseDetailModule[];
  feedbacks?: CourseFeedback[];
  relatedCourses?: RelatedCourse[];
  learningPaths?: LearningPathRef[];
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

export interface DashboardCourseRef {
  id: number;
  title: string;
}

export interface DashboardActivityUser {
  fullName: string;
}

export interface AdminDashboard {
  // Mantidos por compatibilidade — sobrepostos por `counts`/`rates` abaixo.
  courses: { total: number; published: number };
  enrollments: { total: number; completed: number; overdue: number };
  completionRate: number;

  counts: {
    total: number;
    published: number;
    draft: number;
    paused: number;
    archived: number;
    totalModules: number;
    totalLessons: number;
    totalEnrollments: number;
    pendingEnrollments: number;
    completions: number;
    totalLearners: number;
    mandatoryCourses: number;
    optionalCourses: number;
    certificatesIssued: number;
  };
  rates: {
    avgCompletionRate: number;
    avgPassRate: number;
    avgRating: number;
    totalLearningHours: number;
  };
  topCourses: Array<DashboardCourseRef & { enrollments: number }>;
  bestCompletion: Array<DashboardCourseRef & { rate: number }>;
  worstCompletion: Array<DashboardCourseRef & { rate: number }>;
  byCategory: Array<{ category: string; count: number }>;
  byLevel: Array<{ level: CourseLevel; count: number }>;
  byUnit: Array<{ unit: string; count: number }>;
  byDepartment: Array<{ department: string; count: number }>;
  byInstructor: Array<{ instructor: string; count: number }>;
  recentlyCreated: Array<DashboardCourseRef & { createdAt: string }>;
  recentlyUpdated: Array<DashboardCourseRef & { updatedAt: string }>;
  openForEnrollment: number;
  endingSoon: Array<DashboardCourseRef & { endDate: string }>;
  withoutEnrollments: number;
  withoutContent: number;
  withoutInstructor: number;
  withPendingContent: number;
  upcomingLiveSessions: Array<{
    id: number;
    title: string;
    liveDate: string | null;
    instructor: string | null;
    course: DashboardCourseRef;
  }>;
  recentActivity: {
    enrollments: Array<{ id: number; enrolledAt: string; user: DashboardActivityUser; course: DashboardCourseRef }>;
    completions: Array<{ id: number; completedAt: string | null; user: DashboardActivityUser; course: DashboardCourseRef }>;
    feedbacks: Array<{ id: number; rating: number; createdAt: string; user: DashboardActivityUser; course: DashboardCourseRef }>;
    certificates: Array<{ id: number; issuedAt: string; user: DashboardActivityUser | null; course: DashboardCourseRef | null }>;
  };
  monthlyTrend: {
    enrollments: Array<{ month: string; count: number }>;
    completions: Array<{ month: string; count: number }>;
  };
  topCompetencies: Array<{ id: number; name: string; count: number }>;
  alerts: Array<{ message: string; severity: 'warning' | 'danger' | 'info' }>;
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
  | 'catalog'
  | 'detail'
  | 'my-courses'
  | 'certificates'
  | 'dashboard'
  | 'gestao'
  | 'inscricoes'
  | 'progresso'
  | 'modulos';
export type TopLevelView = Exclude<View, 'detail'>;

// view e selectedId eram dois useState separados sempre definidos em conjunto
// (handleSelect/handleBack) — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: TopLevelView } | { view: 'detail'; selectedId: number };
