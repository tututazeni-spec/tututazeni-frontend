// components/leave/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de ausências. Extraído verbatim de app/(platform)/leave/page.tsx.
// Migrado para a fundação de design: STATUS_CONFIG passa a StatusBadgeMap
// (tokens semânticos, consumido por components/ui/StatusBadge) — o ícone
// por estado é descartado, mesmo padrão já adoptado nos restantes módulos
// migrados (ex.: development-plans, leader): o indicador "dot" do
// StatusBadge substitui o ícone dedicado.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  AbsenceJustificationStatus,
  AbsenceOccurrenceType,
  AbsenceSource,
  ApprovalState,
  LeaveCategory,
  LeaveStatus,
  LicensePhase,
  PayRegime,
  VacationPlanState,
} from './types';

export const STATUS_CFG: StatusBadgeMap<LeaveStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PENDING: { label: 'Pendente', cls: 'bg-warning-subtle text-warning-ink' },
  APPROVED: { label: 'Aprovado', cls: 'bg-success-subtle text-success-ink' },
  REJECTED: { label: 'Rejeitado', cls: 'bg-danger-subtle text-danger-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-muted' },
  EXPIRED: { label: 'Expirado', cls: 'bg-surface-sunken text-ink-faint' },
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

export const PLAN_STATE_CFG: StatusBadgeMap<VacationPlanState> = {
  NOT_STARTED: { label: 'Não iniciado', cls: 'bg-surface-sunken text-ink-muted' },
  IN_PREPARATION: { label: 'Em preparação', cls: 'bg-info-subtle text-info-ink' },
  SUBMITTED: { label: 'Submetido', cls: 'bg-warning-subtle text-warning-ink' },
  APPROVED: { label: 'Aprovado', cls: 'bg-success-subtle text-success-ink' },
};

/** 'YYYY-MM' → 'Jan/26'. */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[Number(m) - 1]}/${y.slice(2)}`;
}

// ─── §4 Licenças ────────────────────────────────────────────────────────────

export const PHASE_CFG: StatusBadgeMap<LicensePhase> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PENDING: { label: 'Pendente', cls: 'bg-warning-subtle text-warning-ink' },
  APPROVED: { label: 'Aprovada', cls: 'bg-success-subtle text-success-ink' },
  REJECTED: { label: 'Recusada', cls: 'bg-danger-subtle text-danger-ink' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluída', cls: 'bg-surface-sunken text-ink' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-surface-sunken text-ink-faint' },
};

export const PAY_REGIME_LABELS: Record<PayRegime, string> = {
  PAID: 'Remunerada',
  UNPAID: 'Não remunerada',
  TO_VALIDATE: 'Sujeita a validação',
};

// ─── §5 Gestão de Ausências ─────────────────────────────────────────────────

export const ABSENCE_TYPE_LABELS: Record<AbsenceOccurrenceType, string> = {
  JUSTIFIED_ABSENCE: 'Falta justificada',
  UNJUSTIFIED_ABSENCE: 'Falta injustificada',
  LATE: 'Atraso',
  EARLY_DEPARTURE: 'Saída antecipada',
  PARTIAL_ABSENCE: 'Ausência parcial',
  HEALTH_ABSENCE: 'Ausência por motivo de saúde',
  AUTHORIZED_ABSENCE: 'Ausência autorizada',
  PERSONAL_ABSENCE: 'Ausência por motivo pessoal',
  NO_SHOW: 'Não comparência',
  OTHER: 'Outra ocorrência',
};

/** Tipos que exigem hora de início e de fim (espelha o backend). */
export const TIMED_ABSENCE_TYPES: AbsenceOccurrenceType[] = [
  'PARTIAL_ABSENCE',
  'LATE',
  'EARLY_DEPARTURE',
];

export const ABSENCE_SOURCE_LABELS: Record<AbsenceSource, string> = {
  MANUAL: 'Manual',
  ATTENDANCE: 'Assiduidade',
  INTEGRATION: 'Integração',
};

export const JUSTIFICATION_CFG: StatusBadgeMap<AbsenceJustificationStatus> = {
  TO_JUSTIFY: { label: 'Por justificar', cls: 'bg-warning-subtle text-warning-ink' },
  SUBMITTED: { label: 'Submetida', cls: 'bg-info-subtle text-info-ink' },
  VALIDATED: { label: 'Validada', cls: 'bg-success-subtle text-success-ink' },
  REJECTED: { label: 'Recusada', cls: 'bg-danger-subtle text-danger-ink' },
};

export function absenceTypeLabel(a: {
  occurrenceType: AbsenceOccurrenceType;
  customCategory: string | null;
}): string {
  return a.customCategory || ABSENCE_TYPE_LABELS[a.occurrenceType];
}

// ─── §6 Calendário ──────────────────────────────────────────────────────────

export const WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Estado do registo de assiduidade associado a uma ocorrência (AttendanceStatus). */
export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Presente',
  LATE: 'Atraso',
  PARTIAL: 'Parcial',
  ABSENT: 'Ausente',
  JUSTIFIED: 'Justificada',
  REMOTE: 'Remoto',
  ON_LEAVE: 'Em licença',
  HALF_DAY_AM: 'Meio dia (manhã)',
  HALF_DAY_PM: 'Meio dia (tarde)',
  RECORDED: 'Registada',
  HOLIDAY: 'Feriado',
};

// ─── §7 Aprovações ──────────────────────────────────────────────────────────

export const APPROVAL_STATE_CFG: StatusBadgeMap<ApprovalState> = {
  WAITING: {
    label: 'A aguardar etapa anterior',
    cls: 'bg-surface-sunken text-ink-muted',
  },
  PENDING: { label: 'Por decidir', cls: 'bg-warning-subtle text-warning-ink' },
  OVERDUE: { label: 'Em atraso', cls: 'bg-danger-subtle text-danger-ink' },
  APPROVED: { label: 'Aprovada', cls: 'bg-success-subtle text-success-ink' },
  REJECTED: { label: 'Recusada', cls: 'bg-danger-subtle text-danger-ink' },
  OTHER: { label: 'Encaminhada', cls: 'bg-info-subtle text-info-ink' },
};

export const APPROVAL_STAGE_LABELS = {
  MANAGER: 'Gestor',
  HR: 'RH',
} as const;
