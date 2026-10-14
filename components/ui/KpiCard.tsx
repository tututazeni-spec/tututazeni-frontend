// components/ui/KpiCard.tsx
// Consolida os `KpiCard` locais (ex.: components/engagement/atoms.tsx).
// Desenho: NavyStatCard (cabeçalho azul-marinho + ícone circular sobreposto +
// número centralizado) — `intent` passa a `tone`, `trend` (%) é mostrado
// ao lado do valor.
import type { LucideIcon } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import {
  NavyStatCard,
  type NavyIconTone,
  type NavyStatTone,
} from '@/components/ui/NavyStatCard';

const INTENT_TONE = {
  primary: 'blue',
  accent: 'blue',
  info: 'blue',
  success: 'green',
  warning: 'orange',
  danger: 'red',
} as const satisfies Record<string, NavyStatTone>;

const ICON_TONE = {
  ...INTENT_TONE,
  caution: 'yellow',
  neutral: 'gray',
} as const satisfies Record<string, NavyIconTone>;

export interface KpiCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  /** % — positivo mostra seta a subir a verde, negativo a descer a vermelho. */
  trend?: number;
  intent?: keyof typeof INTENT_TONE;
  /** Cor só do círculo do ícone (omisso: segue `intent`). */
  iconIntent?: keyof typeof ICON_TONE;
  className?: string;
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  trend,
  intent = 'primary',
  iconIntent,
  className,
}: KpiCardProps) {
  return (
    <NavyStatCard
      icon={icon ?? BarChart3}
      tone={INTENT_TONE[intent]}
      iconTone={iconIntent && ICON_TONE[iconIntent]}
      label={label}
      value={value}
      sub={sub}
      trend={trend}
      className={className}
    />
  );
}
