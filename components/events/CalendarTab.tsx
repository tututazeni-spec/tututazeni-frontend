// components/events/CalendarTab.tsx
// Aba "Calendário" (docs/events.md secção 3) — calendário central de eventos.
// Placeholder: conteúdo real entra quando esta tarefa for trabalhada.

import { Calendar } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function CalendarTab() {
  return (
    <EmptyState
      icon={Calendar}
      title="Calendário"
      description="Calendário central de eventos — em construção."
    />
  );
}
