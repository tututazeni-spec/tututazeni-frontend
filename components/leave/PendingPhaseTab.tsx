// components/leave/PendingPhaseTab.tsx
// Placeholder honesto para os separadores do módulo Leave que ainda não
// foram implementados (docs/Modulo_Leave.md §1 — implementação por fases).
// Não simula dados nem acções: só indica o que o separador vai conter.

import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export interface PendingPhaseTabProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PendingPhaseTab({
  icon,
  title,
  description,
}: PendingPhaseTabProps) {
  return (
    <EmptyState
      icon={icon}
      title={`${title} — em desenvolvimento`}
      description={description}
    />
  );
}
