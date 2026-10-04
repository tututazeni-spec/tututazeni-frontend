// components/audit/ComingSoonTab.tsx
// Marcador das abas de docs/modulo_audit.md §2 que ainda não têm
// implementação (entregues por fases).

import { Hammer } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function ComingSoonTab({ title }: { title: string }) {
  return (
    <EmptyState
      icon={Hammer}
      title={title}
      description="Esta aba será disponibilizada numa fase seguinte do módulo de Auditoria."
    />
  );
}
