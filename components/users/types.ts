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
  ACTIVE: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-700' },
  INACTIVE: { label: 'Inactivo', cls: 'bg-gray-100 text-gray-500' },
  SUSPENDED: { label: 'Suspenso', cls: 'bg-amber-50 text-amber-700' },
  BLOCKED: { label: 'Bloqueado', cls: 'bg-red-50 text-red-700' },
  PENDING: { label: 'Pendente', cls: 'bg-blue-50 text-blue-700' },
};

export const HR_STATUS_MAP: StatusBadgeMap<HrStatus> = {
  ACTIVE: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-700' },
  ON_LEAVE: { label: 'Em licença', cls: 'bg-amber-50 text-amber-700' },
  TERMINATED: { label: 'Desligado', cls: 'bg-red-50 text-red-600' },
};
