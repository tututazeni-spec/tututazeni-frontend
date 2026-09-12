// components/enrollments/types.ts
// Tipos do domínio de matrículas (learner/admin/compliance/equipa).
// Extraído de app/(platform)/enrollments/page.tsx.

import type { MyTrainingEntry, ParticipantStatus } from '@/components/trainings/types';

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
  };
  course: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
    workloadHours: number | null;
  };
  certificate: { id: number; code: string; issuedAt: string } | null;
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

export type View = 'my' | 'admin' | 'compliance' | 'team';

// "Minhas Matrículas" mistura duas fontes distintas — Enrollment (cursos,
// com progresso por lição) e TrainingParticipant (formações, sem conteúdo de
// lições, só sessões/presença) — ver src/trainings/trainings.service.ts.
// `id` prefixado por tipo evita colisão de key na lista combinada, já que os
// dois modelos têm PKs independentes.
export type MatriculaItem =
  | { kind: 'course'; id: string; data: Enrollment }
  | { kind: 'training'; id: string; data: MyTrainingEntry };

// ─── "Gestão (Admin)" — passo 1 (seleccionar) / passo 2 (matriculados) ──────
// O ciclo é sempre: seleccionar um curso/formação primeiro, só depois ver a
// lista de inscritos — nunca uma lista plana de todas as matrículas
// misturadas. O escopo por papel (GESTOR/LIDER → só o próprio departamento;
// INSTRUCTOR → só o que lecciona) é aplicado no backend, não aqui.

export interface ManageableCourse {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  category: string | null;
  status: string;
  enrollments: number;
}

export interface ManageableTraining {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  category: string | null;
  status: string;
  participants: number;
}

export type ManageableSelection =
  | { kind: 'course'; id: number; title: string }
  | { kind: 'training'; id: number; title: string };

export interface TrainingParticipantRow {
  id: number;
  status: ParticipantStatus;
  finalScore: number | null;
  attendedHours: number | null;
  completedAt: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    department: { name: string } | null;
  };
  session: { id: number; sessionDate: string };
}

export interface TrainingParticipantsResponse {
  training: { id: number; title: string };
  participants: TrainingParticipantRow[];
}
