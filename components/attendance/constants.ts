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
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
  LATE: {
    label: 'Atrasado',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    icon: Clock,
  },
  PARTIAL: {
    label: 'Parcial',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
    icon: Timer,
  },
  ABSENT: {
    label: 'Ausente',
    color: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    icon: XCircle,
  },
  JUSTIFIED: {
    label: 'Justificado',
    color: 'bg-violet-100 text-violet-700',
    dot: 'bg-violet-500',
    icon: FileText,
  },
  REMOTE: {
    label: 'Remoto',
    color: 'bg-cyan-100 text-cyan-700',
    dot: 'bg-cyan-500',
    icon: Briefcase,
  },
  ON_LEAVE: {
    label: 'Licença',
    color: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-400',
    icon: Calendar,
  },
  HOLIDAY: {
    label: 'Feriado',
    color: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
    icon: Sun,
  },
  RECORDED: {
    label: 'Gravação',
    color: 'bg-purple-100 text-purple-700',
    dot: 'bg-purple-400',
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
  PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
};
