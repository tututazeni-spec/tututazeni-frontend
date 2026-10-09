// components/dashboard-rh/AlertStrip.tsx
// Faixa de alertas críticos do Overview. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — severidade HIGH/MEDIUM/LOW mapeada para os tokens danger/warning/info,
// mesmo padrão de box usado em components/dashboard/AlertBanner.tsx.

import { AlertCard, type AlertCardVariant } from '@/components/ui/AlertCard';
import type { Alert } from './types';

export interface AlertStripProps {
  alerts: Alert[];
}

const SEVERITY_CONFIG: Record<
  Alert['severity'],
  { variant: AlertCardVariant; title: string }
> = {
  HIGH: { variant: 'danger', title: 'Urgente' },
  MEDIUM: { variant: 'warning', title: 'Atenção' },
  LOW: { variant: 'info', title: 'Informação' },
};

export function AlertStrip({ alerts }: AlertStripProps) {
  if (!alerts.length)
    return (
      <AlertCard
        variant="success"
        title="Tudo em ordem"
        message="Sem alertas críticos activos"
      />
    );

  return (
    <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
      {alerts.map((a, i) => {
        const conf = SEVERITY_CONFIG[a.severity];
        const displayMessage = a.message.replace(
          /taxa de participação em surveys/i,
          'Taxa de Resposta',
        );
        return (
          <AlertCard
            key={i}
            variant={conf.variant}
            title={conf.title}
            message={displayMessage}
          />
        );
      })}
    </div>
  );
}
