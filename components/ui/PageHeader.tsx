// components/ui/PageHeader.tsx
//
// Cabeçalho único das páginas e das secções. Substitui as ~12 variações de
// <h1>/<h2> escritas à mão em cada módulo (tamanho, peso e cor diferentes).
//  - <PageHeader>    → título da página (h1), uma por ecrã. Módulos com foto
//                      usam <ModuleBanner>, que já traz o seu próprio h1.
//  - <SectionHeader> → título de uma secção dentro da página (h2).
// Sem lógica: quem usa decide o que as acções fazem.

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  /** Botões à direita; em ecrãs estreitos passam para baixo do título. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-stack sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-brand-soft text-brand">
            <Icon size={22} strokeWidth={1.75} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="break-words font-display text-page font-bold text-brand">
            {title}
          </h1>
          {description && (
            <p className="mt-1 font-body text-sm text-ink-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

export interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-section font-semibold text-ink">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 font-body text-sm text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
