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

export type LeaveScope = 'ORGANIZATION' | 'TEAM' | 'SELF';

export interface OverviewFilters {
  from: string;
  to: string;
  unitId: string;
  departmentId: string;
  leaveTypeCode: string;
  status: string;
}

export interface OverviewData {
  period: { from: string; to: string };
  scope: LeaveScope;
  cards: {
    vacationAvailable: number | null;
    pendingRequests: number;
    vacationTaken: number;
    absences: { total: number; justified: number; unjustified: number };
  };
  charts: {
    absencesByMonth: Array<{ month: string; count: number; days: number }>;
    byType: Array<{
      code: string;
      name: string;
      color: string | null;
      count: number;
      days: number;
    }>;
    absenteeismByDepartment: Array<{
      departmentId: number | null;
      department: string;
      headcount: number;
      absenceDays: number;
      rate: number;
    }>;
    plannedVsTaken: Array<{ month: string; planned: number; taken: number }>;
    byStatus: Array<{ status: LeaveStatus; count: number }>;
  };
}

export type VacationPlanState =
  'NOT_STARTED' | 'IN_PREPARATION' | 'SUBMITTED' | 'APPROVED';

export interface VacationRow {
  userId: number;
  fullName: string;
  employeeNumber: string | null;
  department: { id: number; name: string } | null;
  unit: { id: number; name: string } | null;
  referenceYear: number;
  assignedDays: number;
  carriedOverDays: number;
  reservedDays: number;
  takenDays: number;
  availableDays: number;
  nextPeriod: { startDate: string; endDate: string; days: number } | null;
  planState: VacationPlanState;
}

export interface VacationsResponse {
  data: VacationRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  balanceIsCurrent: boolean;
}

export interface DurationPreview {
  workDays: number;
  calendarDays: number;
  holidays: Array<{ date: string; name: string }>;
  countsWorkDaysOnly: boolean;
  availableBalance: number | null;
  exceedsBalance: boolean;
  selfOverlap: {
    id: number;
    startDate: string;
    endDate: string;
    status: LeaveStatus;
  } | null;
}
