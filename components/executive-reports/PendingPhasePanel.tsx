// components/executive-reports/PendingPhasePanel.tsx
// Marcador dos separadores ainda por implementar (fases seguintes do plano
// docs/Executive_Reports.md). Não mostra dados inventados.

import { Hammer } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function PendingPhasePanel({ label }: { label: string }) {
  return (
    <EmptyState
      icon={Hammer}
      title={`${label} — em desenvolvimento`}
      description="Este separador será disponibilizado numa fase seguinte do módulo Relatórios Executivos."
    />
  );
}
