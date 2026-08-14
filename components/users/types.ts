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
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  profile: {
    bio: string | null;
    interests: string[];
    careerGoals: string | null;
  } | null;
  points: { points: number } | null;
  _count?: { enrollments: number; certificates: number; badgeAwards: number };
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

export type View = 'list' | 'detail' | 'create' | 'dashboard' | 'directory';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
