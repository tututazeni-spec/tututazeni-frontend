// components/ui/PageSkeleton.tsx
//
// Esqueleto de página inteira para os `loading.tsx` do Next (App Router).
// Aparece de imediato na navegação, enquanto o código da rota ainda carrega,
// com a forma aproximada do ecrã que vai substituir (cabeçalho + conteúdo) —
// evita o salto de layout e o ecrã em branco. O Skeleton genérico
// (`./Skeleton`) continua a ser o placeholder DENTRO de um ecrã já montado.

import { cn } from '@/lib/cn';

export type PageSkeletonVariant = 'default' | 'dashboard' | 'table' | 'cards';

export interface PageSkeletonProps {
  /** Forma do conteúdo: `dashboard` (KPIs + blocos), `table`, `cards` (grelha) ou `default`. */
  variant?: PageSkeletonVariant;
  className?: string;
}

const BLOCK = 'rounded-card bg-surface-sunken';

function Block({ className }: { className?: string }) {
  return <div aria-hidden className={cn(BLOCK, className)} />;
}

function Content({ variant }: { variant: PageSkeletonVariant }) {
  switch (variant) {
    case 'dashboard':
      return (
        <>
          <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Block key={i} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-stack lg:grid-cols-2">
            <Block className="h-72" />
            <Block className="h-72" />
          </div>
        </>
      );
    case 'table':
      return (
        <>
          <div className="flex flex-wrap gap-3">
            <Block className="h-10 w-full sm:w-72" />
            <Block className="h-10 w-28" />
          </div>
          <div className="space-y-2">
            <Block className="h-10" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Block key={i} className="h-12" />
            ))}
          </div>
        </>
      );
    case 'cards':
      return (
        <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Block key={i} className="h-44" />
          ))}
        </div>
      );
    default:
      return (
        <>
          <Block className="h-32" />
          <Block className="h-64" />
        </>
      );
  }
}

export function PageSkeleton({
  variant = 'default',
  className,
}: PageSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('animate-pulse space-y-section', className)}
    >
      <span className="sr-only">A carregar…</span>
      <div aria-hidden className="space-y-2">
        <div className="h-7 w-56 rounded-control bg-surface-sunken" />
        <div className="h-4 w-80 max-w-full rounded-control bg-surface-sunken" />
      </div>
      <div className="space-y-stack">
        <Content variant={variant} />
      </div>
    </div>
  );
}
