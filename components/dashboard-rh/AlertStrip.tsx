// components/dashboard-rh/AlertStrip.tsx
// Faixa de alertas críticos do Overview. Extraído de
// app/(platform)/dashboard-rh/page.tsx.

import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { Alert } from './types';

export interface AlertStripProps {
  alerts: Alert[];
}

export function AlertStrip({ alerts }: AlertStripProps) {
  if (!alerts.length)
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
        <CheckCircle size={16} className="text-emerald-500" />
        <p className="text-sm text-emerald-700 font-medium">
          Sem alertas críticos activos
        </p>
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {alerts.map((a, i) => {
        const conf = {
          HIGH: {
            bg: 'bg-red-50 border-red-200',
            icon: AlertTriangle,
            color: 'text-red-700',
            btnBg: 'bg-red-600',
          },
          MEDIUM: {
            bg: 'bg-amber-50 border-amber-200',
            icon: Clock,
            color: 'text-amber-700',
            btnBg: 'bg-amber-600',
          },
          LOW: {
            bg: 'bg-teal-50 border-teal-100',
            icon: CheckCircle,
            color: 'text-teal-700',
            btnBg: 'bg-teal-600',
          },
        }[a.severity];
        const AlertIcon = conf.icon;
        return (
          <div
            key={i}
            className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${conf.bg}`}
          >
            <AlertIcon size={14} className={`${conf.color} shrink-0`} />
            <p className={`text-sm flex-1 ${conf.color}`}>{a.message}</p>
          </div>
        );
      })}
    </div>
  );
}
