// components/declarations/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo de declarações. Extraído verbatim de
// app/(platform)/declarations/page.tsx. Migrado para a fundação de design:
// DOC_STATUS/WORK_STATUS passam de { color, icon } (classes Tailwind cruas
// + JSX) para { label, intent } — a forma consumida directamente pelo Badge
// da fundação (components/ui/Badge). O ícone por-status do original foi
// descartado — a cor semântica já comunica o estado via o ponto do Badge
// (mesmo precedente do piloto work-declaration, ver
// components/work-declaration/constants.ts).

import type { BadgeProps } from '@/components/ui/Badge';
import type { DocStatus, WorkDeclType, WorkStatus } from './types';

export const DOC_STATUS: Record<
  DocStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  DRAFT: { label: 'Rascunho', intent: 'neutral' },
  PENDING: { label: 'Pendente', intent: 'warning' },
  APPROVED: { label: 'Aprovado', intent: 'info' },
  REJECTED: { label: 'Rejeitado', intent: 'danger' },
  GENERATED: { label: 'Gerado', intent: 'success' },
  ISSUED: { label: 'Emitido', intent: 'success' },
  EXPIRED: { label: 'Expirado', intent: 'warning' },
};

export const WORK_STATUS: Record<
  WorkStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  DRAFT: { label: 'Rascunho', intent: 'neutral' },
  PENDING: { label: 'Pendente', intent: 'warning' },
  SUBMITTED: { label: 'Submetida', intent: 'info' },
  APPROVED: { label: 'Aprovada', intent: 'success' },
  REJECTED: { label: 'Rejeitada', intent: 'danger' },
  EXPIRED: { label: 'Expirada', intent: 'warning' },
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
