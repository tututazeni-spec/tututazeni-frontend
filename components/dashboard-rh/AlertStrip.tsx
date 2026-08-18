// components/dashboard-rh/AlertStrip.tsx
// Faixa de alertas críticos do Overview. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — severidade HIGH/MEDIUM/LOW mapeada para os tokens danger/warning/info,
// mesmo padrão de box usado em components/dashboard/AlertBanner.tsx.

import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Alert } from './types';

export interface AlertStripProps {
  alerts: Alert[];
}

const SEVERITY_CONFIG: Record<
  Alert['severity'],
  { icon: LucideIcon; classes: string }
> = {
  HIGH: {
    icon: AlertTriangle,
    classes: 'border-danger-subtle bg-danger-subtle text-danger-ink',
  },
  MEDIUM: {
    icon: Clock,
    classes: 'border-warning-subtle bg-warning-subtle text-warning-ink',
  },
  LOW: {
    icon: CheckCircle,
    classes: 'border-info-subtle bg-info-subtle text-info-ink',
  },
};

export function AlertStrip({ alerts }: AlertStripProps) {
  if (!alerts.length)
    return (
      <div className="flex items-center gap-2 rounded-card border border-success-subtle bg-success-subtle px-4 py-3">
        <CheckCircle
          size={16}
          strokeWidth={1.75}
          className="text-success-ink"
        />
        <p className="font-body text-sm font-medium text-success-ink">
          Sem alertas críticos activos
        </p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {alerts.map((a, i) => {
        const conf = SEVERITY_CONFIG[a.severity];
        const AlertIcon = conf.icon;
        const messageLC = a.message.toLowerCase();
        const isParticipaçãoAlert =
          messageLC.includes('participação em surveys') &&
          messageLC.includes('30%');
        const displayMessage = a.message.replace(
          /taxa de participação em surveys/i,
          'Taxa de Resposta',
        );
        return (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-card border px-4 py-3 ${
              isParticipaçãoAlert ? 'mt-[1cm]!' : ''
            } ${conf.classes}`}
          >
            <AlertIcon size={14} strokeWidth={1.75} className="shrink-0" />
            <p className="flex-1 font-body text-sm">{displayMessage}</p>
          </div>
        );
      })}
    </div>
  );
}
