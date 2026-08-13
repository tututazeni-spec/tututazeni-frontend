// components/work-declaration/constants.ts
// Mapas de labels/intents por status e tipo de declaração. Extraído
// de app/(platform)/work-declaration/page.tsx. Migrado para a fundação de
// design: STATUS_META passa de { color, bg, icon } (classes Tailwind cruas
// + JSX) para { label, intent } — a forma consumida directamente pelo
// Badge da fundação (components/ui/Badge). Deixou de precisar de JSX,
// por isso o ficheiro deixou de ser .tsx.

import type { BadgeProps } from '@/components/ui/Badge';
import type { DeclarationStatus, DeclarationType } from './types';

export const STATUS_META: Record<
  DeclarationStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  draft: { label: 'Rascunho', intent: 'neutral' },
  issued: { label: 'Emitida', intent: 'info' },
  signed: { label: 'Assinada', intent: 'success' },
  expired: { label: 'Expirada', intent: 'warning' },
  revoked: { label: 'Revogada', intent: 'danger' },
};

export const TYPE_LABELS: Record<DeclarationType, string> = {
  employment: 'Vínculo Empregatício',
  training: 'Formação / Treino',
  attendance: 'Frequência',
  performance: 'Desempenho',
  custom: 'Personalizada',
};
