// components/development-plans/NineBoxTab.tsx
// Separador "Matriz 9 Box" — movido de components/evaluation360/ (a matriz
// agrega toda a organização a partir do ciclo de Avaliação 360º activo, não
// é específica ao ecrã pessoal de 360º, por isso faz mais sentido junto das
// análises de PDI/equipa). Dados via hooks/useNineBoxAnalytics.ts.

'use client';

import { useNineBoxAnalytics } from '@/hooks/useNineBoxAnalytics';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Skeleton } from '@/components/ui/Skeleton';
import { NineBoxGrid } from './NineBoxGrid';

export function NineBoxTab() {
  const { nineBox, canSeeNineBox, loading } = useNineBoxAnalytics();

  if (!canSeeNineBox) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">
        Sem permissão para ver a matriz 9 Box.
      </div>
    );
  }

  if (loading)
    return (
      <Skeleton
        rows={1}
        wrapperClassName="space-y-4"
        itemClassName="skeleton-shimmer h-80 rounded-card"
      />
    );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="m-0 text-lg font-bold text-ink">Matriz Nine Box</h2>
        <p className="m-0 mt-1 text-sm text-ink-muted">
          Performance vs Potencial · {nineBox.reduce((s, e) => s + e.count, 0)} colaboradores
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <ErrorBoundary source="development-plans.NineBoxGrid">
          <NineBoxGrid entries={nineBox} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
