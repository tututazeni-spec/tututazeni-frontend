// components/events/OverviewTab.tsx
// Aba "Visão Geral" (docs/events.md secção 1) — dashboard de eventos.
// Placeholder: conteúdo real entra quando esta tarefa for trabalhada.

import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function OverviewTab() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Visão Geral"
      description="Dashboard de eventos — em construção."
    />
  );
}
