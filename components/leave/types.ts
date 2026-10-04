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
  /** Dias já reservados por pedidos pendentes (já descontados de availableBalance). */
  reservedDays?: number;
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

// ─── §7 Aprovações ──────────────────────────────────────────────────────────

export type ApprovalState =
  | 'WAITING'
  | 'PENDING'
  | 'OVERDUE'
  | 'APPROVED'
  | 'REJECTED'
  | 'OTHER';

export type ApprovalListStatus = 'PENDING' | 'OVERDUE' | 'DECIDED' | 'ALL';

export interface ApprovalReassignment {
  id: number;
  kind: 'REASSIGN' | 'DELEGATE';
  from: { id: number; fullName: string | null };
  to: { id: number; fullName: string | null };
  by: { id: number; fullName: string | null };
  reason: string | null;
  createdAt: string;
}

export interface ApprovalRow {
  id: number;
  requestId: number;
  stage: 'MANAGER' | 'HR';
  level: number;
  state: ApprovalState;
  approver: { id: number; fullName: string };
  assignedAt: string;
  dueAt: string | null;
  decision: 'APPROVE' | 'REJECT' | 'ESCALATE' | 'DELEGATE' | 'CANCELLED' | null;
  notes: string | null;
  decidedAt: string | null;
  canAct: boolean;
  canReassign: boolean;
  request: {
    id: number;
    status: string;
    submittedAt: string;
    startDate: string;
    endDate: string;
    workDays: number;
    user: {
      id: number;
      fullName: string;
      department: { id: number; name: string } | null;
    };
    type: { code: string; name: string; color: string | null };
  };
  reassignments: ApprovalReassignment[];
}

export interface ApprovalsResponse {
  data: ApprovalRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  summary: { pending: number; overdue: number };
}

export interface ApproverCandidate {
  id: number;
  fullName: string;
  role: { code: string } | null;
}

// ─── §8 Planeamento de Equipas ──────────────────────────────────────────────

export interface PlanningDay {
  date: string;
  absent: number;
  pendingAbsent: number;
  availabilityPercent: number;
  projectedAvailabilityPercent: number;
  overlap: boolean;
  belowMinimum: boolean;
  projectedBelowMinimum: boolean;
}

export interface PlanningTeam {
  departmentId: number | null;
  department: string | null;
  headcount: number;
  minAvailabilityPercent: number;
  minPeople: number;
  averageAvailabilityPercent: number;
  worstAvailabilityPercent: number;
  belowMinimumDays: number;
  projectedBelowMinimumDays: number;
  overlapDays: number;
  days: PlanningDay[];
}

export interface PlanningPendingRequest {
  id: number;
  user: { id: number; fullName: string };
  departmentId: number | null;
  department: string | null;
  type: { code: string; name: string };
  startDate: string;
  endDate: string;
  workDays: number;
  submittedAt: string;
  substitute: { id: number; fullName: string | null } | null;
  overlappingPeople: number;
  coverageBreachDates: string[];
  coverageBreachDays: number;
  criticalPeriods: string[];
  hasConflict: boolean;
}

export interface PlanningData {
  range: { from: string; to: string };
  scope: 'ORGANIZATION' | 'TEAM' | 'SELF';
  summary: {
    headcount: number;
    absentToday: number;
    approvedRequests: number;
    pendingRequests: number;
    teamsBelowMinimum: number;
    conflictingRequests: number;
  };
  teams: PlanningTeam[];
  availabilityByDay: Array<{
    date: string;
    absent: number;
    available: number;
    availabilityPercent: number;
  }>;
  alerts: Array<{
    date: string;
    departmentId: number | null;
    department: string | null;
    absent: number;
    headcount: number;
    availabilityPercent: number;
    minAvailabilityPercent: number;
    causedByPending: boolean;
  }>;
  pendingRequests: PlanningPendingRequest[];
  absentPeople: Array<{
    userId: number;
    fullName: string;
    department: string | null;
    periods: string[];
  }>;
  policyNote: string;
}

// ─── §9 Relatórios ──────────────────────────────────────────────────────────

export type LeaveReportKind =
  | 'ANNUAL_VACATION_MAP'
  | 'ABSENCES_BY_DEPARTMENT'
  | 'MONTHLY_ABSENTEEISM'
  | 'JUSTIFIED_VS_UNJUSTIFIED'
  | 'LICENSES_BY_TYPE'
  | 'PENDING_REQUESTS'
  | 'VACATION_BY_EMPLOYEE'
  | 'OPERATIONAL_COVERAGE'
  | 'PAYROLL_IMPACT'
  | 'REQUEST_AUDIT';

export interface ReportCatalogItem {
  kind: LeaveReportKind;
  title: string;
  description: string;
  indicators: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'percent' | 'date';
}

export interface ReportResult {
  kind: LeaveReportKind;
  title: string;
  description: string;
  formula?: string;
  range: { from: string; to: string };
  columns: ReportColumn[];
  rows: Array<Record<string, string | number | null>>;
  totals?: Record<string, string | number | null>;
  truncated: boolean;
}

// ─── §10 Configurações ──────────────────────────────────────────────────────

export type DayCountRule = 'PER_TYPE' | 'WORK_DAYS' | 'CALENDAR_DAYS';

/** Espelha `LeaveSettings` do backend (leave-settings.dto.ts). */
export interface LeaveSettings {
  referenceYear: number | null;
  vacationWindowStart: string | null;
  vacationWindowEnd: string | null;
  workWeekDays: number[];
  workdayStart: string;
  workdayEnd: string;
  hoursPerDay: number;
  dayCountRule: DayCountRule;
  justifiedOccurrenceTypes: AbsenceOccurrenceType[];
  unjustifiedOccurrenceTypes: AbsenceOccurrenceType[];
  carryOverEnabled: boolean;
  carryOverMaxDays: number | null;
  minNoticeDays: number | null;
  maxAdvanceDays: number | null;
  documentRequiredCategories: string[];
  substituteRequiredOverDays: number | null;
  decisionSlaDays: number;
  escalationAfterDays: number | null;
  employeeCanCancelApproved: boolean;
  cancelApprovedMinDaysBefore: number | null;
  defaultMaxAbsencePercent: number;
  managerCanRegisterAbsences: boolean;
  managerCanValidateAbsences: boolean;
  syncAttendance: boolean;
  payrollFeedEnabled: boolean;
  notifyHrOnApproval: boolean;
}

export interface SettingsOverview {
  settings: LeaveSettings;
  effectiveFrom: string | null;
  versionId: number | null;
  upcoming: {
    versionId: number;
    effectiveFrom: string;
    changeNote: string | null;
    changedKeys: Array<keyof LeaveSettings>;
  } | null;
  defaults: LeaveSettings;
}

export interface SettingsHistoryEntry {
  id: number;
  effectiveFrom: string;
  createdAt: string;
  createdById: number;
  createdByName: string | null;
  changeNote: string | null;
  scheduled: boolean;
  changedKeys: Array<keyof LeaveSettings>;
  values: LeaveSettings;
}

export interface EffectiveHoliday {
  date: string;
  name: string;
  source: 'BASE' | 'CUSTOM';
}

export interface CustomHoliday {
  id: number;
  name: string;
  date: string;
  location: string | null;
  recurring: boolean;
  active: boolean;
}

export interface HolidaysResponse {
  year: number;
  location: string | null;
  effective: EffectiveHoliday[];
  custom: CustomHoliday[];
}

export interface DelegationRow {
  id: number;
  delegatorId: number;
  delegateId: number;
  delegatorName: string | null;
  delegateName: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
  active: boolean;
}
