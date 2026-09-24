// components/events/ScheduleTab.tsx
// Aba "Programação" (docs/events.md secção 5) — agenda de sessões/atividades
// para eventos com várias actividades. Placeholder: conteúdo real entra
// quando esta tarefa for trabalhada.

import { ListOrdered } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function ScheduleTab() {
  return (
    <EmptyState
      icon={ListOrdered}
      title="Programação"
      description="Agenda de sessões e actividades — em construção."
    />
  );
}
