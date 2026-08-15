// components/dashboard/AlertBanner.tsx
// Banner de alertas (urgentes + atenção) no topo dos separadores "O Meu
// Dashboard" e "Gestor". Sem equivalente em components/ui/ — composto
// específico do domínio (duas prioridades, CTA opcional por alerta) —
// extraído de atoms.tsx como ficheiro próprio, mesma decisão de
// StarRating em components/trainings/.

import { AlertTriangle, Clock } from 'lucide-react';
import type { Alert } from './types';

export interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (!alerts.length) return null;
  const urgent = alerts.filter((a) => a.priority === 'URGENT');
  const others = alerts.filter((a) => a.priority !== 'URGENT');

  return (
    <div className="space-y-2">
      {urgent.map((a, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-card border border-danger-subtle bg-danger-subtle px-4 py-3"
        >
          <AlertTriangle
            size={16}
            strokeWidth={1.75}
            className="shrink-0 text-danger-ink"
          />
          <p className="flex-1 font-body text-sm text-danger-ink">
            {a.message}
          </p>
          {a.actionUrl && (
            <a
              href={a.actionUrl}
              className="rounded-control bg-danger px-3 py-1 font-body text-xs text-canvas hover:brightness-95"
            >
              Ver →
            </a>
          )}
        </div>
      ))}
      {others.slice(0, 2).map((a, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-card border border-warning-subtle bg-warning-subtle px-4 py-3"
        >
          <Clock
            size={14}
            strokeWidth={1.75}
            className="shrink-0 text-warning-ink"
          />
          <p className="flex-1 font-body text-sm text-warning-ink">
            {a.message}
          </p>
          {a.actionUrl && (
            <a
              href={a.actionUrl}
              className="shrink-0 rounded-control bg-warning px-3 py-1 font-body text-xs text-canvas hover:brightness-95"
            >
              Ver →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
