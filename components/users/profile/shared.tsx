// components/users/profile/shared.tsx
// Peças visuais partilhadas pelas vistas do perfil (apresentação).

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { SpeedometerChart } from '@/components/ui/charts/SpeedometerChart';
import { RATE_BANDS } from '@/components/ui/charts/SpeedometerStatCard';

export function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, ReactNode]>;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
        {title}
      </div>
      <div className="p-5">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 py-1.5 border-b border-border last:border-0"
          >
            <span className="text-xs text-ink-muted">{label}</span>
            <span className="text-xs font-medium text-ink text-right">
              {value === null || value === undefined || value === ''
                ? '—'
                : value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function LoadingRows() {
  return (
    <Skeleton
      rows={4}
      wrapperClassName="space-y-2"
      itemClassName="h-14 rounded-card bg-surface-sunken"
    />
  );
}

/** Velocímetro de uma taxa (0–100%), solto, sem cartão à volta. */
export function RateGauge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-h-[155px] flex-col items-center justify-center gap-2">
      <h3 className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </h3>
      <SpeedometerChart
        value={value}
        min={0}
        max={100}
        bands={RATE_BANDS}
        size={150}
        display={`${value}%`}
      />
    </div>
  );
}

/** Cartão com a faixa de título do perfil (como Estrutura/Hierarquia) e conteúdo livre. */
export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
        {title}
      </div>
      {children}
    </Card>
  );
}
