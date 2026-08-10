// components/attendance/types.ts
// Tipos partilhados do módulo de presenças — entre hooks/useClockInOut.ts
// e os componentes em components/attendance/ (StatusBadge/AttendanceHistory/
// DashboardTab/LeaveModal etc., todos extraídos de attendance/page.tsx).
// Ver memory project_innova_component_separation_audit, item 3.5.

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'PARTIAL'
  | 'ABSENT'
  | 'JUSTIFIED'
  | 'REMOTE'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'RECORDED';

export interface AttendanceRecord {
  id: number;
  userId: number;
  date: string;
  status: AttendanceStatus;
  context: string;
  method: string;
  clockIn?: string;
  clockOut?: string;
  workMinutes?: number;
  hoursWorked?: number;
  overtimeMinutes?: number;
  locationLabel?: string;
  notes?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    employee?: { department: string; avatarUrl?: string };
  };
}

export interface MyAttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

export interface MyAttendanceData {
  summary?: MyAttendanceSummary;
  records?: AttendanceRecord[];
}

export type LeaveType =
  | 'VACATION'
  | 'SICK_LEAVE'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'JUSTIFIED_ABSENCE'
  | 'BEREAVEMENT'
  | 'TRAINING'
  | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface DashboardData {
  date: string;
  kpis: {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    checkedInNow: number;
    pendingLeaves: number;
    pendingJustifications: number;
    pendingOvertime: number;
    attendanceRate: number;
  };
  presentList: Array<{
    id: number;
    name: string;
    department: string;
    clockIn: string;
    status: string;
  }>;
  absentList: Array<{ id: number; name: string; department: string }>;
  lateList: Array<{ id: number; name: string; clockIn: string }>;
}

export interface LeaveBalance {
  type: string;
  entitled: number;
  used: number;
  remaining: number;
}
