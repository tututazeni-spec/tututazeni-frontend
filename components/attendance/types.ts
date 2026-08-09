// components/attendance/types.ts
// Tipos partilhados entre hooks/useClockInOut.ts e as várias vistas de
// attendance/page.tsx (useMyAttendance, StatusBadge/STATUS_CONFIG,
// AttendanceHistory) que continuam nesse ficheiro.
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
