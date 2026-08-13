// components/academic/shared.tsx
//
// Pequenos blocos de apresentação partilhados pelas views de academic
// (lista de programas, detalhe de programa, transcrição). `Info` fica
// local — sem equivalente em components/ui/. Os skeletons passam a
// compor components/ui/Skeleton em vez de reimplementar o placeholder
// pulsante à mão. `SummaryCard` foi eliminado — o único consumidor
// (TranscriptView) passou a usar KpiCard directamente.

import { Skeleton } from '@/components/ui/Skeleton';

interface InfoProps {
  label: string;
  value: string;
}

export function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="font-body text-xs uppercase text-ink-faint">{label}</p>
      <p className="font-body text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="p-6">
      <Skeleton
        rows={6}
        wrapperClassName="grid grid-cols-1 gap-4 md:grid-cols-3"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-6">
      <Skeleton
        rows={2}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-40 rounded-card"
      />
    </div>
  );
}
