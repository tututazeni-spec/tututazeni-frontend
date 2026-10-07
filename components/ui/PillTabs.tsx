// components/ui/PillTabs.tsx
'use client';

// Barra de abas principais em "glassmorphism": contentor translúcido com
// desfoque e botões em forma de pílula com ícone, título e subtítulo. A aba
// activa ganha gradiente azul, sombra e um visto à direita. É o design do
// dashboard-rh, extraído para ser partilhado pelos restantes módulos.
//
// Duas variantes com o mesmo aspecto:
//  - <PillTabsList>  → dentro de <Tabs> (Radix); a activa vem de data-state.
//  - <PillNav>       → botões controlados (value/onChange) para módulos que
//                      não usam Radix Tabs.

import type { ReactNode } from 'react';
import { CircleCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/cn';

export interface PillTabItem {
  id: string;
  label: string;
  hint?: string;
  icon?: LucideIcon | null;
  /** Contador/etiqueta opcional mostrada depois do título. */
  badge?: ReactNode;
}

function Glass({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      >
        <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
      </div>
      <div className="relative rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}

const PILL_BASE =
  'group flex h-auto items-center gap-3 whitespace-nowrap rounded-full border border-white/70 bg-white/60 py-2 pl-2 pr-4 text-left font-body text-ink shadow-sm backdrop-blur transition-all hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/70 data-[state=active]:text-white data-[state=active]:shadow-lg';

function PillBody({ item, active }: { item: PillTabItem; active?: boolean }) {
  const Icon = item.icon;
  return (
    <>
      {Icon && (
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white',
            active && 'bg-white/20 text-white',
          )}
        >
          <Icon size={16} strokeWidth={1.75} />
        </span>
      )}
      <span className="flex flex-col items-start leading-tight">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {item.label}
          {item.badge}
        </span>
        {item.hint && (
          <span
            className={cn(
              'text-xs opacity-70 group-data-[state=active]:opacity-85',
              active && 'opacity-85',
            )}
          >
            {item.hint}
          </span>
        )}
      </span>
      <CircleCheck
        size={16}
        strokeWidth={2}
        className={cn(
          'hidden shrink-0 group-data-[state=active]:block',
          active && 'block',
        )}
      />
    </>
  );
}

/** Para usar dentro de `<Tabs value onValueChange>` (Radix). */
export function PillTabsList({
  items,
  className,
}: {
  items: readonly PillTabItem[];
  className?: string;
}) {
  return (
    <Glass className={className}>
      <TabsList className="flex h-auto w-full flex-wrap items-center justify-center gap-2 border-0 bg-transparent p-0">
        {items.map((item) => (
          <TabsTrigger key={item.id} value={item.id} className={PILL_BASE}>
            <PillBody item={item} />
          </TabsTrigger>
        ))}
      </TabsList>
    </Glass>
  );
}

/** Variante controlada por botões, sem Radix. */
export function PillNav({
  items,
  value,
  onChange,
  label,
  className,
}: {
  items: readonly PillTabItem[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}) {
  return (
    <Glass className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="flex flex-wrap items-center justify-center gap-2"
      >
        {items.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-state={active ? 'active' : 'inactive'}
              onClick={() => onChange(item.id)}
              className={PILL_BASE}
            >
              <PillBody item={item} active={active} />
            </button>
          );
        })}
      </div>
    </Glass>
  );
}
