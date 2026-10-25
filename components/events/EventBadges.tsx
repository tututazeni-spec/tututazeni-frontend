// components/events/EventBadges.tsx
// Alert banners (pílulas) do cabeçalho do detalhe do evento. Padrão definido
// a partir do cabeçalho do detalhe do PDI (development-plans/constants.ts →
// *_ON_DARK_CFG): pílula de cor sólida saturada + texto branco + anel claro,
// colocada sobre a faixa colorida do card. É o padrão para os alert banners
// dentro deste tipo de cards.

import type { LucideIcon } from 'lucide-react';
import type { EventStatus } from './types';

const PILL =
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-body text-xs font-semibold text-white ring-1 ring-white/70';

export const EVENT_BADGE_COLORS = {
  type: '#7B5CD6',
  modality: '#0E9AA7',
  mandatory: '#C23A52',
  certificate: '#16A765',
} as const;

export const EVENT_STATUS_ON_DARK: Record<
  EventStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: 'Rascunho', color: '#64748B' },
  PUBLISHED: { label: 'Publicado', color: '#1267B8' },
  LIVE: { label: 'Ao vivo', color: '#C23A52' },
  ENDED: { label: 'Encerrado', color: '#64748B' },
  CANCELLED: { label: 'Cancelado', color: '#C23A52' },
};

export interface EventBadgeProps {
  color: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function EventBadge({ color, icon: Icon, children }: EventBadgeProps) {
  return (
    <span className={PILL} style={{ background: color }}>
      {Icon && <Icon size={12} strokeWidth={1.75} />}
      {children}
    </span>
  );
}
