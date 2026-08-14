// components/leave/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de ausências. Extraído verbatim de app/(platform)/leave/page.tsx.
// Migrado para a fundação de design: STATUS_CONFIG passa a StatusBadgeMap
// (tokens semânticos, consumido por components/ui/StatusBadge) — o ícone
// por estado é descartado, mesmo padrão já adoptado nos restantes módulos
// migrados (ex.: development-plans, leader): o indicador "dot" do
// StatusBadge substitui o ícone dedicado.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { LeaveCategory, LeaveStatus } from './types';

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
