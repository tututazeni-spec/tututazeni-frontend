// components/enrollments/constants.ts
// Navegação, títulos por separador e mapas de badges de estado/origem.
// Extraído de app/(platform)/enrollments/page.tsx e components/enrollments/atoms.tsx.
//
// Cores mapeadas para os tokens semânticos da fundação de design (Fase
// A) — ver components/engagement/constants.ts para o mesmo padrão.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { EnrollmentOrigin, EnrollmentStatus, View } from './types';

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'my', label: 'As minhas matrículas' },
  { id: 'admin', label: 'Gestão (Admin)' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'team', label: 'Equipa' },
];

export const TITLES: Record<View, string> = {
  my: 'As minhas matrículas',
  admin: 'Gestão de Matrículas',
  compliance: 'Dashboard de Compliance',
  team: 'Progresso da Equipa',
};

export const STATUS_CFG: StatusBadgeMap<EnrollmentStatus> = {
  NOT_STARTED: { label: 'Não iniciado', cls: 'bg-surface-sunken text-ink-muted' },
  IN_PROGRESS: { label: 'Em progresso', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success-subtle text-success-ink' },
  OVERDUE: { label: 'Atrasado', cls: 'bg-danger-subtle text-danger-ink' },
  EXPIRED: { label: 'Expirado', cls: 'bg-warning-subtle text-warning-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-faint' },
};

/** Mapa de cor do card do learner por estado — só os estados com borda própria. */
export const CARD_BORDER_CFG: Partial<Record<EnrollmentStatus, string>> = {
  COMPLETED: 'border-success',
  IN_PROGRESS: 'border-info',
};

export const ORIGIN_LABELS: Record<EnrollmentOrigin, string> = {
  MANUAL: 'Manual',
  SELF_ENROLL: 'Auto-inscrição',
  LEARNING_PATH: 'Trilha',
  ONBOARDING: 'Onboarding',
  RULE_ENGINE: 'Automático',
  CAMPAIGN: 'Campanha',
};
