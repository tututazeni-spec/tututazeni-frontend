// components/library/shared.tsx

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface InfoProps {
  label: string;
  value: string | null | undefined;
}

export function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="font-body text-xs uppercase text-ink-faint">{label}</p>
      <p className="font-body text-sm text-ink">{value || '—'}</p>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="font-body text-xs uppercase text-ink-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function GridSkeleton() {
  return (
    <Skeleton
      rows={8}
      wrapperClassName="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4"
      itemClassName="h-48 animate-pulse rounded-card bg-surface-sunken"
    />
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton
        rows={1}
        wrapperClassName=""
        itemClassName="h-32 animate-pulse rounded-card bg-surface-sunken"
      />
      <Skeleton
        rows={1}
        wrapperClassName=""
        itemClassName="h-64 animate-pulse rounded-card bg-surface-sunken"
      />
    </div>
  );
}
