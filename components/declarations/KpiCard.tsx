// components/declarations/KpiCard.tsx
// Cartão de KPI dos separadores administrativos (Gerir Pedidos/Compliance).
// Wrapper fino sobre o KpiCard da fundação de design (components/ui/KpiCard)
// — `color` (paleta Tailwind crua) passa a `intent` (KpiCardProps['intent']).
// Extraído de app/(platform)/declarations/page.tsx.

import type { LucideIcon } from 'lucide-react';
import {
  KpiCard as FoundationKpiCard,
  type KpiCardProps as FoundationKpiCardProps,
} from '@/components/ui/KpiCard';

export interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  intent?: FoundationKpiCardProps['intent'];
  sub?: string;
}

export function KpiCard({
  label,
  value,
  icon,
  intent = 'primary',
  sub,
}: KpiCardProps) {
  return (
    <FoundationKpiCard icon={icon} label={label} value={value} intent={intent} sub={sub} />
  );
}
