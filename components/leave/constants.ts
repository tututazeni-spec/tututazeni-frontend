// components/leave/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de ausências. Extraído verbatim de app/(platform)/leave/page.tsx.

import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { LeaveCategory, LeaveStatus } from './types';

export const STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  DRAFT: {
    label: 'Rascunho',
    color: 'bg-gray-100 text-gray-600',
    icon: FileText,
  },
  PENDING: {
    label: 'Pendente',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  APPROVED: {
    label: 'Aprovado',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejeitado',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-500',
    icon: X,
  },
  EXPIRED: {
    label: 'Expirado',
    color: 'bg-gray-100 text-gray-400',
    icon: Timer,
  },
};

export const CATEGORY_LABELS: Record<LeaveCategory, string> = {
  STATUTORY: 'Estatutária',
  MEDICAL: 'Médica',
  FAMILY: 'Família',
  TRAINING: 'Formação',
  FLEXIBLE: 'Flexível',
  UNPAID: 'Não Remunerada',
  OTHER: 'Outro',
};

export const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
