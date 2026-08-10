// components/instructor/types.ts
// Tipos do domínio de instrutores: dashboard, turmas, participantes
// e alunos em risco. Extraído de app/(platform)/instructor/page.tsx.

// Não usado por nenhuma vista actualmente — a página tem um View
// 'profile' e um TITLES correspondente, mas nunca chega a ser
// renderizado (sem ProfileView nem entrada em NAV). Mantido por
// corresponder à forma real da API e ter valor de reutilização caso
// a vista de perfil venha a ser implementada.
export interface InstructorProfile {
  id: number;
  expertiseArea: string;
  instructorType: string;
  ratingAverage: number;
  totalCourses: number;
  approved: boolean;
  bio: string | null;
  specialties: string[];
  availableForMentoring: boolean;
  user: { id: number; fullName: string; avatarUrl: string | null };
}

export interface DashboardData {
  profile: {
    id: number;
    fullName: string;
    expertiseArea: string;
    ratingAverage: number;
    totalCourses: number;
    instructorType: string;
  };
  metrics: {
    activeCohorts: number;
    totalStudents: number;
    avgCompletionRate: number;
    totalAtRisk: number;
    totalReviews: number;
    ratingAverage: number;
  };
  cohorts: CohortSummary[];
  recentReviews: InstructorReview[];
}

export interface InstructorReview {
  user?: { fullName?: string; avatarUrl?: string | null };
  rating: number;
  comment?: string;
}

export interface CohortSummary {
  id: number;
  name: string;
  course: { id: number; title: string };
  status: string;
  startDate: string;
  endDate: string | null;
  modalidade: string;
  totalStudents: number;
  completed: number;
  atRisk: number;
  avgProgress: number;
  completionRate: number;
}

export interface CohortDetail {
  id: number;
  name: string;
  course: { id: number; title: string; workloadHours: number | null };
  status: string;
  modalidade: string;
  maxParticipants: number;
  startDate: string;
  endDate: string | null;
  atRiskCount: number;
  atRisk: number[];
  participants: Participant[];
}

export interface Participant {
  id: number;
  userId: number;
  status: string;
  progress: number;
  enrolledAt: string;
  enrollmentProgress: number;
  enrollmentStatus: string;
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
}

export interface AtRiskStudent {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  cohortName: string;
  course: { id: number; title: string };
  progress: number;
  daysSinceEnroll: number;
}

export type View =
  'dashboard' | 'cohorts' | 'cohort-detail' | 'at-risk' | 'profile';
