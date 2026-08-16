// components/attendance/constants.ts
// Mapas de badges de estado/licença do módulo de presenças. Extraído
// de app/(platform)/attendance/page.tsx.

import {
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Sun,
  Timer,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AttendanceStatus, LeaveStatus, LeaveType } from './types';

export const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; dot: string; icon: LucideIcon }
> = {
  PRESENT: {
    label: 'Presente',
    color: 'bg-success-subtle text-success-ink',
    dot: 'bg-success',
    icon: CheckCircle2,
  },
  LATE: {
    label: 'Atrasado',
    color: 'bg-warning-subtle text-warning-ink',
    dot: 'bg-warning',
    icon: Clock,
  },
  PARTIAL: {
    label: 'Parcial',
    color: 'bg-info-subtle text-info-ink',
    dot: 'bg-info',
    icon: Timer,
  },
  ABSENT: {
    label: 'Ausente',
    color: 'bg-danger-subtle text-danger-ink',
    dot: 'bg-danger',
    icon: XCircle,
  },
  JUSTIFIED: {
    label: 'Justificado',
    color: 'bg-accent-subtle text-accent',
    dot: 'bg-accent',
    icon: FileText,
  },
  REMOTE: {
    label: 'Remoto',
    color: 'bg-info-subtle text-info-ink',
    dot: 'bg-info',
    icon: Briefcase,
  },
  ON_LEAVE: {
    label: 'Licença',
    color: 'bg-primary-subtle text-primary',
    dot: 'bg-primary',
    icon: Calendar,
  },
  HOLIDAY: {
    label: 'Feriado',
    color: 'bg-surface-sunken text-ink-muted',
    dot: 'bg-ink-muted',
    icon: Sun,
  },
  RECORDED: {
    label: 'Gravação',
    color: 'bg-accent-subtle text-accent',
    dot: 'bg-accent',
    icon: Award,
  },
};

export const LEAVE_LABELS: Record<LeaveType, string> = {
  VACATION: 'Férias',
  SICK_LEAVE: 'Licença Médica',
  MATERNITY: 'Licença Maternidade',
  PATERNITY: 'Licença Paternidade',
  JUSTIFIED_ABSENCE: 'Falta Justificada',
  BEREAVEMENT: 'Luto',
  TRAINING: 'Formação Externa',
  OTHER: 'Outras Licenças',
};

export const LEAVE_STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'Pendente', color: 'bg-warning-subtle text-warning-ink' },
  APPROVED: { label: 'Aprovado', color: 'bg-success-subtle text-success-ink' },
  REJECTED: { label: 'Rejeitado', color: 'bg-danger-subtle text-danger-ink' },
  CANCELLED: { label: 'Cancelado', color: 'bg-surface-sunken text-ink-muted' },
};
