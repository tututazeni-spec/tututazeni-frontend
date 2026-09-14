// components/learning-paths/types.ts
// Tipos do domínio de trilhas de aprendizagem (catálogo, roadmap,
// matrículas, dashboard admin). Extraído de
// app/(platform)/learning-paths/page.tsx.

export type LPStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LPLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type LPType =
  | 'ONBOARDING'
  | 'UPSKILLING'
  | 'RESKILLING'
  | 'COMPLIANCE'
  | 'LEADERSHIP'
  | 'CERTIFICATION'
  | 'CUSTOM';
export type StepStatus =
  'NOT_ENROLLED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LPStep {
  seq: number;
  courseId: number;
  required: boolean;
  deadlineDays: number | null;
  course: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
    level: string;
    workloadHours: number | null;
    _count: { modules: number };
  };
  status: StepStatus;
  locked: boolean;
  completedAt: string | null;
  progress: number;
}

export interface LPProgress {
  learningPathId: number;
  userId: number;
  enrollment: {
    id: number;
    status: string;
    deadline: string | null;
    completedAt: string | null;
  } | null;
  overallPct: number;
  completedRequired: number;
  totalRequired: number;
  totalSteps: number;
  steps: LPStep[];
  isOverdue: boolean;
}

export interface LearningPath {
  id: number;
  title: string;
  shortDescription: string | null;
  description: string | null;
  objective: string | null;
  thumbnailUrl: string | null;
  category: string | null;
  tags: string[];
  level: LPLevel;
  pathType: LPType;
  status: LPStatus;
  mandatory: boolean;
  totalHours: number;
  deadline: string | null;
  createdAt: string;
  publishedAt: string | null;
  _count: { courses: number; enrollments: number };
  courses?: LPCourseRef[];
  milestones?: unknown[];
}

export interface LPCourseRef {
  seq: number;
  courseId: number;
  required: boolean;
  deadlineDays: number | null;
  course: LPStep['course'];
}

export interface PaginatedLPs {
  data: LearningPath[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LPAnalytics {
  learningPathId: number;
  enrollments: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  completionRate: number;
  overdue: number;
  stepDropoff: Array<{
    seq: number;
    courseId: number;
    title: string;
    completed: number;
  }>;
}

export interface MyLPEnrollment {
  id: number;
  learningPathId: number;
  status: string;
  deadline: string | null;
  mandatory?: boolean;
  learningPath?: {
    title?: string;
    thumbnailUrl?: string | null;
    pathType?: LPType;
    _count?: { courses?: number };
  };
}

export interface AdminDashboard {
  paths: { total: number; published: number };
  enrollments: { total: number };
  completionRate: number;
  topPaths: LearningPath[];
}

// 'lms-*' cobre o módulo LMS (percursos com courseIds/courseOrder em
// array + sessões ao vivo — modelo Prisma LmsLearningPath, distinto do
// LearningPath relacional deste módulo, ver memory
// project_innova_learning_path_unification_faseF1). Integrado nesta
// mesma página/sidebar a pedido do utilizador, sem fundir os dados dos
// dois módulos — cada separador continua a bater no seu próprio
// controller (/learning-paths vs /lms).
export type View =
  | 'catalog'
  | 'detail'
  | 'my-paths'
  | 'dashboard'
  | 'lms-catalog'
  | 'lms-my-paths'
  | 'lms-sessions';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
