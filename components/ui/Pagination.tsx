// Paginação numérica com janela deslizante de 5 páginas. Promovido de
// components/employees/Pagination.tsx para a fundação de design
// (components/ui/) como o primitivo de paginação partilhado — ver
// docs/superpowers/specs/2026-08-22-shared-pagination-component-design.md.

import { cn } from '@/lib/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** ~25% mais baixa na vertical (botões 28px em vez de 36px). */
  compact?: boolean;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  compact,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const arrowSize = compact ? 'h-7 px-2.5 text-xs' : 'px-3 py-1.5 text-sm';
  const pageSize = compact ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1',
        compact ? 'mt-4' : 'mt-6',
      )}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          arrowSize,
          'rounded-control border border-border hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
        )}
      >
        ←
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            pageSize,
            'rounded-control transition-colors font-medium',
            p === page
              ? 'bg-primary text-canvas shadow-resting'
              : 'border border-border hover:bg-surface-sunken text-ink-muted',
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(
          arrowSize,
          'rounded-control border border-border hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
        )}
      >
        →
      </button>
    </div>
  );
}
