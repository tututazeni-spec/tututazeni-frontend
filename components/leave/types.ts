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
  isSensitive?: boolean;
  requiresPayrollValidation?: boolean;
  autoApprove?: boolean;
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

// ─── §4 Licenças ────────────────────────────────────────────────────────────

/** Estado do pedido + "em curso"/"concluída" derivados das datas (backend). */
export type LicensePhase =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PayRegime = 'PAID' | 'UNPAID' | 'TO_VALIDATE';

export interface LicenseRow {
  id: number;
  user: {
    id: number;
    fullName: string;
    employeeNumber: string | null;
    department: { id: number; name: string } | null;
  };
  leaveTypeCode: string;
  type: {
    code: string;
    name: string;
    color: string | null;
    isPaid?: boolean;
    isSensitive?: boolean;
    requiresDocument?: boolean;
  };
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  durationMode: DurationMode;
  workDays: number;
  hours: number | null;
  calendarDays: number;
  payRegime: PayRegime;
  reason: string | null;
  hasDocument: boolean;
  documents: Array<{
    id: number;
    name: string;
    mimeType: string | null;
    fileUrl: string;
  }>;
  submittedAt: string;
  approver: { id: number; fullName: string } | null;
  status: LeaveStatus;
  phase: LicensePhase;
  registeredBy: { id: number; fullName: string | null } | null;
  canCancel: boolean;
  /** Só ADMIN/RH recebem este campo. */
  payrollImpact?: 'NONE' | 'VALIDATION_REQUIRED';
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LicensesResponse {
  data: LicenseRow[];
  meta: PaginatedMeta;
}

export interface ApprovalRoute {
  autoApprove: boolean;
  steps: Array<{
    level: number;
    role: 'GESTOR' | 'RH';
    approver: { id: number; fullName: string };
  }>;
}

// ─── §5 Gestão de Ausências ─────────────────────────────────────────────────

export type AbsenceOccurrenceType =
  | 'JUSTIFIED_ABSENCE'
  | 'UNJUSTIFIED_ABSENCE'
  | 'LATE'
  | 'EARLY_DEPARTURE'
  | 'PARTIAL_ABSENCE'
  | 'HEALTH_ABSENCE'
  | 'AUTHORIZED_ABSENCE'
  | 'PERSONAL_ABSENCE'
  | 'NO_SHOW'
  | 'OTHER';

export type AbsenceSource = 'MANUAL' | 'ATTENDANCE' | 'INTEGRATION';

export type AbsenceJustificationStatus =
  'TO_JUSTIFY' | 'SUBMITTED' | 'VALIDATED' | 'REJECTED';

export interface AbsenceActions {
  submitJustification: boolean;
  validate: boolean;
  attach: boolean;
  correct: boolean;
  forward: boolean;
  sendToHr: boolean;
}

export interface AbsenceRow {
  id: number;
  user: {
    id: number;
    fullName: string;
    employeeNumber: string | null;
    department: { id: number; name: string } | null;
  };
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationDays: number;
  durationHours: number | null;
  occurrenceType: AbsenceOccurrenceType;
  customCategory: string | null;
  justification: string | null;
  hasAttachment: boolean;
  attachments: Array<{
    id: number;
    name: string;
    fileUrl: string;
    mimeType: string | null;
  }>;
  source: AbsenceSource;
  justificationStatus: AbsenceJustificationStatus;
  validator: { id: number; fullName: string | null } | null;
  validatedAt: string | null;
  validationNotes: string | null;
  attendance: {
    id: number;
    status: string;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
  } | null;
  forwardedTo: { id: number; fullName: string | null } | null;
  sentToHrAt: string | null;
  createdBy: { id: number; fullName: string | null };
  createdAt: string;
  /** Só ADMIN/RH recebem este campo. */
  payrollReview?: boolean;
  actions: AbsenceActions;
}

export interface AbsencesResponse {
  data: AbsenceRow[];
  meta: PaginatedMeta;
}

export interface AbsenceRevision {
  id: number;
  reason: string;
  changes: Record<string, [unknown, unknown]>;
  changedBy: { id: number; fullName: string | null };
  createdAt: string;
}

export interface AbsenceDetail extends AbsenceRow {
  revisions: AbsenceRevision[];
}

export interface AbsenceHistory {
  summary: {
    total: number;
    totalDays: number;
    byType: Array<{
      occurrenceType: AbsenceOccurrenceType;
      count: number;
      days: number;
    }>;
    byStatus: Array<{ status: AbsenceJustificationStatus; count: number }>;
  };
  records: AbsenceRow[];
}

export interface CsvExport {
  filename: string;
  mimeType: string;
  content: string;
  total: number;
}

// ─── §6 Calendário de Ausências ─────────────────────────────────────────────

export type CalendarView = 'day' | 'week' | 'month' | 'year';

export interface CalendarEntry {
  id: string;
  kind: 'LEAVE' | 'ABSENCE';
  userId: number;
  userName: string;
  departmentId: number | null;
  department: string | null;
  typeCode: string;
  typeName: string;
  color: string | null;
  startDate: string;
  endDate: string;
  partial: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface AbsenceCalendarData {
  view: CalendarView;
  range: { from: string; to: string };
  scope: LeaveScope;
  entries: CalendarEntry[];
  holidays: Array<{ date: string; name: string }>;
  days: Record<
    string,
    { absent: number; overlap: boolean; lowCoverage: boolean }
  >;
  alerts: Array<{
    date: string;
    departmentId: number | null;
    department: string | null;
    absent: number;
    headcount: number;
    availabilityPercent: number;
    minAvailabilityPercent: number;
  }>;
  overlaps: Array<{
    date: string;
    departmentId: number | null;
    department: string | null;
    userIds: number[];
  }>;
  canExport: boolean;
}
