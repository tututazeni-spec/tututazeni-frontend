// components/users/types.ts
// Tipos e constantes partilhados entre as várias vistas de users/page.tsx
// (UserListView, UserProfileView, TeamView, CreateUserView, DashboardView,
// DirectoryView) e hooks/useUserProfile.ts.
// Ver memory project_innova_component_separation_audit, item 3.3.

import type { StatusBadgeMap } from '@/lib/statusBadge';

export type AccountStatus =
  'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'PENDING';
export type HrStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export interface User {
  id: number;
  fullName: string;
  email: string;
  employeeNumber: string | null;
  phone: string | null;
  avatarUrl: string | null;
  country: string | null;
  city: string | null;
  language: string | null;
  active: boolean;
  accountStatus: AccountStatus;
  hrStatus: HrStatus;
  hireDate: string | null;
  createdAt: string;
  role: { id: number; name: string } | null;
  department: { id: number; name: string; code: string } | null;
  position: { id: number; name: string; level: string | null } | null;
  unit: { id: number; name: string } | null;
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  profile: {
    bio: string | null;
    interests: string[];
    careerGoals: string | null;
  } | null;
  points: { points: number } | null;
  _count?: {
    enrollments: number;
    certificates: number;
    badgeAwards: number;
    subordinates?: number;
    userCompetencies?: number;
  };

  // ─── Dados Pessoais (docs/modulo_users.md Ponto 2/3) ─────────────────────
  preferredName: string | null;
  gender: string | null;
  birthDate: string | null;
  nationality: string | null;
  identificationNumber: string | null;
  nif: string | null;
  nib: string | null;
  personalEmail: string | null;
  alternatePhone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;

  // ─── Dados Profissionais / Organização ───────────────────────────────────
  companyName: string | null;
  area: string | null;
  jobFunction: string | null;
  professionalCategory: string | null;
  workLocation: string | null;
  contractType: string | null;
  workMode: string | null;
  costCenter: string | null;
  workSchedule: string | null;
  exitDate: string | null;

  // ─── Conta de Acesso ──────────────────────────────────────────────────────
  username: string | null;
  systemFunction: string | null;
  mfaEnabled: boolean;
  contentAccessLevel: string | null;
  isInstructor: boolean;
  timezone: string | null;
}

// ─── Separador "Acesso & Permissões" (Ponto 4) ─────────────────────────────

export interface PermissionEntry {
  id: number;
  name: string;
  action: string;
  subject: string;
  grantedAt?: string;
}

export interface AccessOverview {
  userId: number;
  accountStatus: AccountStatus;
  accountCreatedAt: string;
  profile: { id: number; name: string; code: string | null } | null;
  systemFunction: string | null;
  contentAccessLevel: string | null;
  permissions: PermissionEntry[];
  specialPermissions: PermissionEntry[];
  authorizedModules: string[];
  authorizedUnit: { id: number; name: string } | null;
  authorizedDepartment: { id: number; name: string } | null;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  activeSessions: number;
  devices: null;
  loginAttempts: null;
  blockHistory: null;
}

// ─── Separador "Formação" ───────────────────────────────────────────────────

export interface TrainingParticipation {
  id: number;
  status: string;
  createdAt: string;
  session: {
    id: number;
    training: {
      id: number;
      title: string;
      type: string;
      level: string;
      thumbnailUrl: string | null;
      workloadHours: number | null;
      issueCertificate: boolean;
      instructor: { id: number; fullName: string; avatarUrl: string | null } | null;
    };
  } | null;
}

// ─── Separador "Cursos" ─────────────────────────────────────────────────────

export interface UserEnrollmentEntry {
  id: number;
  status: string;
  progress: number | null;
  enrolledAt: string;
  completedAt: string | null;
  deadline: string | null;
  mandatory: boolean;
  course: {
    id: number;
    title: string;
    thumbnailUrl: string | null;
    category: string | null;
    level: string | null;
    workloadHours: number | null;
  };
  certificate: { id: number; validationCode: string; issuedAt: string } | null;
}

export interface UserEnrollmentsResponse {
  enrollments: UserEnrollmentEntry[];
  groups: {
    overdue: UserEnrollmentEntry[];
    inProgress: UserEnrollmentEntry[];
    notStarted: UserEnrollmentEntry[];
    completed: UserEnrollmentEntry[];
    cancelled: UserEnrollmentEntry[];
  };
}

// ─── Separador "Competências" ───────────────────────────────────────────────

export interface UserCompetencyEntry {
  id: number;
  currentLevel: number;
  targetLevel: number | null;
  selfLevel: number | null;
  managerLevel: number | null;
  source: string;
  evidenceUrl: string | null;
  evaluatedAt: string;
  gap: number | null;
  divergence: number | null;
  competency: { id: number; name: string; category: string | null };
}

// ─── Separador "Avaliações" (Eval360) ───────────────────────────────────────

export interface UserEval360CycleEntry {
  cycleId: string;
  cycleName: string;
  cycleType: string;
  cycleStatus: string;
  startDate: string;
  endDate: string;
  participantStatus: string;
  completedAt: string | null;
  finalScore: number | null;
}

// ─── Separador "PDI" ─────────────────────────────────────────────────────────

export interface DevelopmentPlanSummary {
  id: number;
  name: string;
  goal: string;
  status: string;
  priority: string;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  overallProgress: number;
  actionProgress: number;
  avgGoalProgress: number;
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
}

export interface DevelopmentPlansResponse {
  data: DevelopmentPlanSummary[];
  total: number;
}

// ─── Separador "Carreira" ────────────────────────────────────────────────────

export interface CareerProfile {
  careerPlan: {
    id: number;
    status: string;
    goals: Array<{ id: number; createdAt: string }>;
  } | null;
  careerHistory: Array<{
    id: number;
    startedAt: string;
    endedAt: string | null;
    position: { id: number; title: string; level: string | null } | null;
  }>;
  successionPlan: {
    id: number;
    position: { id: number; name: string } | null;
  } | null;
  insights: {
    competencyGaps: unknown;
    promotionEligibility: unknown;
    matchingVacancies: Array<{ id: number; title: string }>;
  };
}

// ─── Separador "Documentos" ──────────────────────────────────────────────────

export interface DocumentEntry {
  id: number;
  title: string;
  category: string | null;
  sensitivity: string;
  status: string;
  createdAt: string;
  expiresAt?: string | null;
}

export interface DocumentsResponse {
  data: DocumentEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Separador "Férias & Licenças" ───────────────────────────────────────────

export interface LeaveRequestEntry {
  id: number;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  workDays: number;
  status: string;
  reason: string | null;
  createdAt: string;
}

export interface LeaveRequestsResponse {
  data: LeaveRequestEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface LeaveBalanceEntry {
  leaveTypeCode: string;
  balance: number;
  used: number;
  pendingDays: number;
  futureBalance: number;
  expiresAt: string | null;
}

// ─── Separador "Presenças" ───────────────────────────────────────────────────

export interface AttendanceRecordEntry {
  id: number;
  date: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  workMinutes: number | null;
  hoursWorked: number | null;
}

export interface AttendanceResponse {
  records: AttendanceRecordEntry[];
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    totalHours: number;
    attendanceRate: number;
  };
}

// ─── Separador "Histórico" ───────────────────────────────────────────────────

export interface TimelineEventEntry {
  id: string;
  source: string;
  timestamp: string;
  category: string;
  module: string;
  impactScore: number;
  milestone?: boolean;
  icon: string;
  title?: string | null;
  description?: string | null;
}

export interface UserTimelineResponse {
  data: TimelineEventEntry[];
  grouped: Array<{ month: string; items: TimelineEventEntry[] }>;
  milestones: TimelineEventEntry[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface CareerMilestoneEntry {
  type: string;
  icon: string;
  title: string;
  date: string;
  impactScore: number;
}

// ─── Separador "Atividade" ───────────────────────────────────────────────────

export interface UserActivityStats {
  userId: number;
  totalEvents: number;
  streak: number;
  activeDays: number;
  enrollments: number;
  completions: number;
  completionRate: number;
  badges: number;
  xpPoints: number;
  heatmap: Record<string, number>;
  byCategory: Record<string, number>;
  mostActiveDay: string | null;
}

export interface RecentActivityEntry {
  id: number;
  status: string;
  course?: { title: string; thumbnailUrl: string | null } | null;
}

export interface UserStats {
  userId: number;
  enrollments: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  completionRate: number;
  gamification: { points: number; badges: number };
  competencies: number;
  recentActivity: RecentActivityEntry[];
}

export interface AuditLogEntry {
  id: number;
  action: string;
  meta?: string | null;
  performedBy?: { fullName: string } | null;
  createdAt: string;
}

export interface TeamMember {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  position?: { name: string } | null;
  accountStatus: AccountStatus;
  learningStats: { completed: number; inProgress: number; overdue: number };
}

export interface TeamResponse {
  team: TeamMember[];
}

export const ACCOUNT_STATUS_MAP: StatusBadgeMap<AccountStatus> = {
  ACTIVE: { label: 'Activo', cls: 'bg-success-subtle text-success-ink' },
  INACTIVE: { label: 'Inactivo', cls: 'bg-surface-sunken text-ink-muted' },
  SUSPENDED: { label: 'Suspenso', cls: 'bg-warning-subtle text-warning-ink' },
  BLOCKED: { label: 'Bloqueado', cls: 'bg-danger-subtle text-danger-ink' },
  PENDING: { label: 'Pendente', cls: 'bg-info-subtle text-info-ink' },
};

export const HR_STATUS_MAP: StatusBadgeMap<HrStatus> = {
  ACTIVE: { label: 'Activo', cls: 'bg-success-subtle text-success-ink' },
  ON_LEAVE: { label: 'Em licença', cls: 'bg-warning-subtle text-warning-ink' },
  TERMINATED: { label: 'Desligado', cls: 'bg-danger-subtle text-danger-ink' },
};

// ─── Tipos das restantes views (List/Create/Dashboard/Directory) ──────────────
// Extraído de app/(platform)/users/page.tsx.

export interface DirectoryUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  email?: string;
  position?: { name: string } | null;
  department?: { name: string } | null;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminDashboard {
  users: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    suspended: number;
  };
  byDepartment: Array<{ id: number; name: string; count: number }>;
}

export type View =
  | 'list'
  | 'detail'
  | 'create'
  | 'dashboard'
  | 'directory'
  | 'employees'
  | 'permissions';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
