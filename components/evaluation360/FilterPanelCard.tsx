// components/evaluation360/FilterPanelCard.tsx
// Cartão de filtros partilhado por todos os separadores do módulo: fundo
// #0F1F3D a 8%. Os controlos (Select, chips…) vão como children.

import type { ReactNode } from 'react';

export function FilterPanelCard({
  children,
  className = 'flex flex-wrap items-end gap-3',
}: {
  children: ReactNode;
  /** Layout dos controlos dentro do cartão. */
  className?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-[#0F1F3D]/[0.08] p-5">
      <div className={className}>{children}</div>
    </div>
  );
}
