// components/automation/PendingPhaseTab.tsx
// Separador do spec ainda sem backend próprio (Agendamentos, Aprovações e
// Tarefas, Configurações). Honesto: diz o que falta, sem dados simulados.

import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function PendingPhaseTab({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={`${description} Ainda não está implementado — será entregue numa fase seguinte.`}
    />
  );
}
