// components/lms/shared.tsx

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 rounded-card border border-danger bg-danger-subtle p-4">
        <AlertTriangle size={18} strokeWidth={1.75} className="shrink-0 text-danger-ink" />
        <p className="flex-1 font-body text-sm text-danger-ink">{message}</p>
        <Button size="sm" intent="secondary" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="p-6">
      <Skeleton
        rows={6}
        wrapperClassName="grid grid-cols-1 gap-4 md:grid-cols-3"
        itemClassName="skeleton-shimmer h-48 rounded-card"
      />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-6">
      <Skeleton
        rows={rows}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    </div>
  );
}

export function MyPathsSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton rows={1} itemClassName="skeleton-shimmer h-24 rounded-card" />
      <Skeleton rows={1} itemClassName="skeleton-shimmer h-40 rounded-card" />
    </div>
  );
}
