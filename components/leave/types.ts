// components/leave/types.ts
// Tipos do domínio "gestão de ausências" — movidos verbatim de
// app/(platform)/leave/page.tsx. Partilhados por hooks/useLeave.ts (dados)
// e pelos componentes de apresentação em components/leave/.

export type LeaveStatus =
  'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export type DurationMode = 'FULL_DAY' | 'HALF_AM' | 'HALF_PM' | 'HOURS';

export type LeaveCategory =
  | 'STATUTORY'
  | 'MEDICAL'
  | 'FAMILY'
  | 'TRAINING'
  | 'FLEXIBLE'
  | 'UNPAID'
  | 'OTHER';

export interface LeaveType {
  code: string;
  name: string;
  category: LeaveCategory;
  color: string;
  icon: string;
  isPaid: boolean;
  annualLimit?: number;
  requiresDocument: boolean;
  allowHalfDay: boolean;
  active: boolean;
}

export interface LeaveBalance {
  leaveTypeCode: string;
  balance: number;
  used: number;
  pendingDays: number;
  futureBalance: number;
  effectiveBalance: number;
  leaveType: {
    name: string;
    code: string;
    color: string;
    icon: string;
    annualLimit?: number;
  };
}

export interface ConflictCheck {
  hasUserConflict: boolean;
  isAtRisk: boolean;
  teamConflictCount: number;
}

export interface LeaveRequest {
  id: number;
  userId: number;
  leaveTypeCode: string;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  workDays: number;
  reason?: string;
  durationMode: DurationMode;
  leaveType?: LeaveType;
  user?: {
    id: number;
    name: string;
    email: string;
    employee?: { department: string; avatarUrl?: string };
  };
  approvals?: Array<{
    id: number;
    level: number;
    decision?: string;
    approver: { name: string };
  }>;
}

export interface DashboardData {
  year: number;
  kpis: {
    pending: number;
    approved: number;
    activeNow: number;
    totalWorkDays: number;
  };
  byType: Array<{ code: string; name: string; count: number; days: number }>;
  byMonth: Array<{ month: number; count: number; days: number }>;
}
