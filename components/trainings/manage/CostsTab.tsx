// components/trainings/manage/CostsTab.tsx
// Custos: decomposição formador/material/transporte/alimentação/alojamento/
// outros + total. Só leitura aqui — os valores editam-se em "Editar" (Gestão),
// o total é sempre calculado no backend (nunca guardado) para não ficar
// desactualizado — ver Training.computeTotalCost em trainings.service.ts.

'use client';

import { Card } from '@/components/ui/Card';
import type { Training } from '../types';

function kz(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 }).format(value) + ' Kz';
}

const ROWS: { key: keyof Training; label: string }[] = [
  { key: 'instructorCost', label: 'Custo do formador' },
  { key: 'materialCost', label: 'Material' },
  { key: 'transportCost', label: 'Transporte' },
  { key: 'foodCost', label: 'Alimentação' },
  { key: 'lodgingCost', label: 'Alojamento' },
  { key: 'otherCosts', label: 'Outros custos' },
];

interface CostsTabProps {
  training: Training;
}

export function CostsTab({ training }: CostsTabProps) {
  return (
    <Card className="divide-y divide-border">
      {ROWS.map((r) => (
        <div key={r.key} className="flex items-center justify-between px-4 py-3">
          <span className="font-body text-sm text-ink-muted">{r.label}</span>
          <span className="font-mono text-sm text-ink">{kz(training[r.key] as number | null)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between bg-surface-sunken px-4 py-3">
        <span className="font-body text-sm font-semibold text-ink">Custo total</span>
        <span className="font-mono text-sm font-semibold text-ink">
          {kz(training.totalCost ?? training.cost)}
        </span>
      </div>
    </Card>
  );
}
