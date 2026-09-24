// components/events/SpeakersGuestsTab.tsx
// Aba "Oradores & Convidados" (docs/events.md secção 7) — gestão de
// oradores, convidados e moderadores. Placeholder: conteúdo real entra
// quando esta tarefa for trabalhada.

import { Mic2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function SpeakersGuestsTab() {
  return (
    <EmptyState
      icon={Mic2}
      title="Oradores & Convidados"
      description="Gestão de oradores e convidados — em construção."
    />
  );
}
