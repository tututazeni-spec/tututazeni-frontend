// components/events/CommunicationTab.tsx
// Aba "Comunicação" (docs/events.md secção 8) — convites, confirmações,
// lembretes e outras comunicações do evento. Placeholder: conteúdo real
// entra quando esta tarefa for trabalhada.

import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function CommunicationTab() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Comunicação"
      description="Convites, lembretes e outras comunicações — em construção."
    />
  );
}
