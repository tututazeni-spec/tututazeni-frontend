// components/competency-map/TeamTab.tsx
// Separador "Equipa" — placeholder para role Gestor. Extraído de
// app/(platform)/competency-map/page.tsx.

'use client';

import { EmptyState } from '@/components/ui/EmptyState';

export function TeamTab() {
  return (
    <EmptyState
      title="Vista de Equipa"
      description="Disponível para utilizadores com Função Gestor."
    />
  );
}
