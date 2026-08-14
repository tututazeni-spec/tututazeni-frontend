// components/career-plans/TeamTab.tsx
// Tab "Equipa" — placeholder estático. Extraído de
// app/(platform)/career-plans/page.tsx.

'use client';

import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function TeamTab() {
  return (
    <EmptyState
      icon={Users}
      title="Vista de equipa disponível com role Gestor+"
      description="Planos, readiness e pedidos de promoção da equipa"
    />
  );
}
