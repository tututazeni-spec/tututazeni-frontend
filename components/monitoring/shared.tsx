// components/monitoring/shared.tsx
// Estados de carregamento/erro partilhados pelas views do módulo de
// monitoria (OKRs, Avaliações, Indicadores).

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
      <div className="flex items-center gap-4 rounded-card border border-danger bg-danger-subtle p-4 font-body text-sm text-danger-ink">
        <span className="flex-1">{message}</span>
        <Button intent="ghost" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

export function ListSkeleton({
  rows = 4,
  height = 'h-32',
}: {
  rows?: number;
  height?: string;
}) {
  return (
    <Skeleton
      rows={rows}
      wrapperClassName="p-6 space-y-4"
      itemClassName={`${height} animate-pulse rounded-card bg-surface-sunken`}
    />
  );
}
