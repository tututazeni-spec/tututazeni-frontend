// components/users/profile/shared.tsx
// Peças visuais partilhadas pelas vistas do perfil (apresentação).

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, ReactNode]>;
}) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
        {title}
      </div>
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
    </Card>
  );
}

export function LoadingRows() {
  return (
    <Skeleton
      rows={4}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-14 rounded-card bg-surface-sunken"
    />
  );
}
