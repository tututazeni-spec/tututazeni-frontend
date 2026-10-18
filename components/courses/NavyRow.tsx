// components/courses/NavyRow.tsx
// Linha navy com barra lateral — mesmo desenho do cartão de "Nova comunicação"
// (events/CommunicationTab.tsx). Partilhada pelas listas Categorias e Turmas
// do módulo Cursos.

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Contentor das linhas (borda + separadores), igual ao da Comunicação. */
export function NavyRowList({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      {children}
    </div>
  );
}

/** Classes de um badge de estado sobre a linha navy. */
export const NAVY_ROW_BADGE =
  'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-body text-xs font-medium';

/** Classes de botões de acção sobre a linha navy. */
export const NAVY_ROW_ACTION =
  'inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50';

interface NavyRowProps {
  /** Cor da barra lateral (ex.: 'bg-success'). */
  barClass: string;
  title: string;
  subtitle?: string;
  /** Colunas de texto curtas, escondidas em ecrãs pequenos. */
  meta?: Array<{ key: string; className?: string; node: ReactNode }>;
  badge?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}

export function NavyRow({
  barClass,
  title,
  subtitle,
  meta = [],
  badge,
  actions,
  onClick,
}: NavyRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex w-full flex-wrap items-center gap-3 border-b border-white/10 bg-[#0F1F3D] py-3 pl-5 pr-4 last:border-0',
        onClick && 'cursor-pointer',
      )}
    >
      <span
        className={cn('absolute inset-y-2 left-2 w-1 rounded-full', barClass)}
      />
      <div className="min-w-0 flex-1 basis-48">
        <div className="truncate font-body text-sm font-semibold text-white">
          {title}
        </div>
        {subtitle && (
          <div className="truncate font-body text-xs text-white">
            {subtitle}
          </div>
        )}
      </div>
      {meta.map((m) => (
        <div
          key={m.key}
          className={cn(
            'hidden shrink-0 font-body text-xs text-white sm:block',
            m.className,
          )}
        >
          {m.node}
        </div>
      ))}
      {badge}
      {actions && (
        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
