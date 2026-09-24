// components/events/CheckinAttendanceTab.tsx
// Aba "Check-in & Presença" (docs/events.md secção 9) — controla quem
// realmente participou no evento. Placeholder: conteúdo real entra quando
// esta tarefa for trabalhada.

import { QrCode } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

export function CheckinAttendanceTab() {
  return (
    <EmptyState
      icon={QrCode}
      title="Check-in & Presença"
      description="Controlo de presença nos eventos — em construção."
    />
  );
}
