// components/dashboard/AlertBanner.tsx
// Banner de alertas (urgentes + atenção) no topo dos separadores "O Meu
// Dashboard" e "Gestor". Sem equivalente em components/ui/ — composto
// específico do domínio (duas prioridades, CTA opcional por alerta) —
// extraído de atoms.tsx como ficheiro próprio, mesma decisão de
// StarRating em components/trainings/.

import { AlertCard } from '@/components/ui/AlertCard';
import type { Alert } from './types';

export interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (!alerts.length) return null;
  const urgent = alerts.filter((a) => a.priority === 'URGENT');
  const others = alerts.filter((a) => a.priority !== 'URGENT');

  return (
    <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
      {urgent.map((a, i) => (
        <AlertCard
          key={i}
          variant="danger"
          title="Urgente"
          message={a.message}
          actionUrl={a.actionUrl}
        />
      ))}
      {others.slice(0, 2).map((a, i) => (
        <AlertCard
          key={i}
          variant="warning"
          title="Atenção"
          message={a.message}
          actionUrl={a.actionUrl}
        />
      ))}
    </div>
  );
}
