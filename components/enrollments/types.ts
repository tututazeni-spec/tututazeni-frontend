// components/enrollments/types.ts
// Tipos do domínio de matrículas (learner/admin/compliance/equipa).
// Extraído de app/(platform)/enrollments/page.tsx.

export type EnrollmentStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'EXPIRED'
  | 'CANCELLED';
export type EnrollmentOrigin =
  | 'MANUAL'
  | 'SELF_ENROLL'
  | 'LEARNING_PATH'
  | 'ONBOARDING'
  | 'RULE_ENGINE'
  | 'CAMPAIGN';

export interface Enrollment {
  id: number;
  courseId: number;
  userId: number;
  status: EnrollmentStatus;
  mandatory: boolean;
  origin: EnrollmentOrigin;
  deadline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  enrolledAt: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  isOverdue: boolean;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    department: { name: string } | null;
    unit: { name: string } | null;
  };
  course: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
    workloadHours: number | null;
  };
  certificate: {
    id: number;
    validationCode: string;
    issuedAt: string;
    expiresAt: string | null;
    score: number | null;
  } | null;
}

export interface MyEnrollmentsResponse {
  enrollments: Enrollment[];
  groups: {
    overdue: Enrollment[];
    inProgress: Enrollment[];
    notStarted: Enrollment[];
    completed: Enrollment[];
    cancelled: Enrollment[];
  };
}

export interface AdminDashboard {
  enrollments: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    overdue: number;
  };
  mandatory: number;
  completionRate: number;
  topCourses: Array<{
    id: number;
    title: string;
    category: string | null;
    enrollments: number;
  }>;
}

export interface ComplianceDashboard {
  mandatory: {
    total: number;
    completed: number;
    overdue: number;
    notStarted: number;
  };
  complianceRate: number;
  topOverdueCourses: Array<{ id: number; title: string; overdueCount: number }>;
}

export interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  stats: { total: number; completed: number; overdue: number };
}

export interface TeamProgress {
  team: TeamMember[];
  total: number;
}

export interface DepartmentProgressRow {
  id: number;
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export interface ProgressByDepartment {
  byDepartment: DepartmentProgressRow[];
  byUnit: DepartmentProgressRow[];
}

export type View = 'my' | 'admin' | 'compliance' | 'team';
