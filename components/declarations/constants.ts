// components/declarations/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de declarações. Extraído verbatim de
// app/(platform)/declarations/page.tsx.

import {
  FileText,
  Clock,
  Check,
  XCircle,
  FileCheck,
  CheckCircle2,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { DocStatus, WorkDeclType, WorkStatus } from './types';

export const DOC_STATUS: Record<
  DocStatus,
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
    color: 'bg-blue-100 text-blue-700',
    icon: Check,
  },
  REJECTED: {
    label: 'Rejeitado',
    color: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  GENERATED: {
    label: 'Gerado',
    color: 'bg-emerald-100 text-emerald-700',
    icon: FileCheck,
  },
  ISSUED: {
    label: 'Emitido',
    color: 'bg-violet-100 text-violet-700',
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: 'Expirado',
    color: 'bg-gray-100 text-gray-400',
    icon: Timer,
  },
};

export const WORK_STATUS: Record<WorkStatus, { label: string; color: string }> =
  {
    DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600' },
    PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
    SUBMITTED: { label: 'Submetida', color: 'bg-blue-100 text-blue-700' },
    APPROVED: { label: 'Aprovada', color: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: 'Rejeitada', color: 'bg-red-100 text-red-700' },
    EXPIRED: { label: 'Expirada', color: 'bg-gray-100 text-gray-400' },
  };

export const WORK_TYPE_LABELS: Record<WorkDeclType, string> = {
  ONBOARDING: 'Onboarding',
  PERIODIC: 'Periódica',
  EVENT: 'Evento',
  RESIGNATION: 'Desligamento',
  DIVERSITY: 'Diversidade',
  COMPLIANCE: 'Compliance',
  GENERAL: 'Geral',
};
