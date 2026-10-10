// components/ui/KpiCard.tsx
// Consolida os `KpiCard` locais (ex.: components/engagement/atoms.tsx).
// Desenho: NavyStatCard (cabeçalho azul-marinho + ícone circular sobreposto +
// número centralizado) — `intent` passa a `tone`, `trend` (%) é mostrado
// ao lado do valor.
import type { LucideIcon } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { NavyStatCard, type NavyStatTone } from '@/components/ui/NavyStatCard';

const INTENT_TONE = {
  primary: 'blue',
  accent: 'blue',
  info: 'blue',
  success: 'green',
  warning: 'orange',
  danger: 'red',
} as const satisfies Record<string, NavyStatTone>;

export interface KpiCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  /** % — positivo mostra seta a subir a verde, negativo a descer a vermelho. */
  trend?: number;
  intent?: keyof typeof INTENT_TONE;
  className?: string;
}

export function KpiCard({
  icon,
  label,
  value,
  sub,
  trend,
  intent = 'primary',
  className,
}: KpiCardProps) {
  return (
    <NavyStatCard
      icon={icon ?? BarChart3}
      tone={INTENT_TONE[intent]}
      label={label}
      value={value}
      sub={sub}
      trend={trend}
      className={className}
    />
  );
}
