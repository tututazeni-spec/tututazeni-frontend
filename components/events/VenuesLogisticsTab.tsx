// components/events/VenuesLogisticsTab.tsx
// Aba "Locais & Logística" (docs/events.md secção 6) — recursos necessários
// para realizar o evento. Placeholder: conteúdo real entra quando esta
// tarefa for trabalhada.

import { MapPin } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function VenuesLogisticsTab() {
  return (
    <EmptyState
      icon={MapPin}
      title="Locais & Logística"
      description="Gestão de locais, recursos e fornecedores — em construção."
    />
  );
}
