// components/events/EvaluationTab.tsx
// Aba "Avaliação" (docs/events.md secção 10) — avalia a experiência dos
// participantes. Placeholder: conteúdo real entra quando esta tarefa for
// trabalhada.

import { Star } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function EvaluationTab() {
  return (
    <EmptyState
      icon={Star}
      title="Avaliação"
      description="Avaliação da experiência dos participantes — em construção."
    />
  );
}
