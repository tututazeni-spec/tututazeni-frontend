// components/work-declaration/StatCard.tsx
// Cartão de KPI do dashboard de declarações. Extraído de
// app/(platform)/work-declaration/page.tsx. Wrapper fino sobre o KpiCard
// da fundação de design (components/ui/KpiCard) — `accent` (classe
// Tailwind crua) passa a `intent` (KpiCardProps['intent']), `icon`
// (React.ReactNode já instanciado) passa a `icon` (LucideIcon — o
// KpiCard instancia o ícone internamente).

'use client';

import type { LucideIcon } from 'lucide-react';
import { KpiCard, type KpiCardProps } from '@/components/ui/KpiCard';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  intent: KpiCardProps['intent'];
}

export function StatCard({ label, value, icon, intent }: StatCardProps) {
  return <KpiCard icon={icon} label={label} value={value} intent={intent} />;
}
