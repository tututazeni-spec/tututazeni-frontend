// components/ui/CalendarPanel.tsx
// Moldura partilhada dos calendários (desenho "calendario ausencias.jpeg"):
// barra lateral azul-marinho com ícone, título e legenda, e à direita a
// navegação (setas redondas, período, "Hoje") sobre a grelha em células suaves.
// Só apresenta: o módulo decide as vistas, os dados e o que cada clique faz.
//  - <CalendarPanel>       → moldura (barra lateral + área do calendário)
//  - <CalendarNav>         → setas, título do período e "Hoje"
//  - <CalendarWeekdayCells>→ cabeçalho Seg–Dom (células dentro de uma grelha de 7)
//  - <CalendarChip>        → etiqueta de um item, tingida com a cor dada
// As cores chegam como CSS (ex.: `var(--color-danger)`), para seguirem os tokens.

import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button, IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const SIDEBAR_BG =
  'linear-gradient(170deg, #1E3A5F 0%, #0F1F3D 55%, #0A1630 100%)';

/** Cor de fundo suave a partir de uma cor de estado. */
export const calendarTint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, white)`;

/** Célula de dia: cartão branco de cantos redondos com sombra suave. */
export const CALENDAR_CELL =
  'rounded-card border border-brand/10 bg-white shadow-[0_1px_3px_rgba(15,31,61,0.08)]';

/** Célula de um dia fora do mês em vista. */
export const CALENDAR_CELL_DIM = 'bg-white/40';

export interface CalendarLegendItem {
  label: string;
  /** Cor CSS do ponto (ex.: `var(--color-info)` ou `#2563EB`). */
  color: string;
}

export interface CalendarPanelProps {
  icon: LucideIcon;
  title: string;
  legend: readonly CalendarLegendItem[];
  /** Navegação do período (normalmente <CalendarNav>). */
  nav: ReactNode;
  /** Controlos à direita da navegação: vistas, exportação… */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CalendarPanel({
  icon: Icon,
  title,
  legend,
  nav,
  actions,
  children,
  className,
}: CalendarPanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[24px] border border-brand/10 bg-white shadow-[0_8px_24px_rgba(15,31,61,0.12)] lg:flex-row',
        className,
      )}
    >
      <aside
        className="flex flex-col gap-4 p-5 text-white lg:w-52 lg:shrink-0"
        style={{ background: SIDEBAR_BG }}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-card border-2 border-white">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-2xl font-bold">{title}</h3>
        <hr className="border-white/25" />
        <ul className="space-y-3">
          {legend.map((l) => (
            <li
              key={l.label}
              className="flex items-center gap-2.5 font-body text-sm font-semibold"
            >
              <span
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {l.label}
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 flex-1 space-y-4 bg-surface-sunken p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {nav}
          {actions}
        </div>
        {children}
      </div>
    </div>
  );
}

export interface CalendarNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  prevLabel?: string;
  nextLabel?: string;
}

export function CalendarNav({
  label,
  onPrev,
  onNext,
  onToday,
  prevLabel = 'Período anterior',
  nextLabel = 'Período seguinte',
}: CalendarNavProps) {
  const round = 'rounded-full border border-brand/15 bg-white shadow-sm';
  return (
    <div className="flex items-center gap-3">
      <IconButton
        icon={ChevronLeft}
        label={prevLabel}
        intent="ghost"
        className={round}
        onClick={onPrev}
      />
      <h3 className="font-display text-xl font-bold capitalize text-brand">
        {label}
      </h3>
      <IconButton
        icon={ChevronRight}
        label={nextLabel}
        intent="ghost"
        className={round}
        onClick={onNext}
      />
      <Button intent="ghost" size="sm" onClick={onToday}>
        Hoje
      </Button>
    </div>
  );
}

/** Cabeçalho dos dias da semana; devolve as células para uma grelha de 7 colunas. */
export function CalendarWeekdayCells({
  labels,
}: {
  labels: readonly string[];
}) {
  return (
    <>
      {labels.map((w, i) => (
        <div
          key={`${w}-${i}`}
          className="cursor-default select-none rounded-card bg-brand/[0.07] py-2 text-center font-body text-sm font-bold capitalize text-brand"
        >
          {w}
        </div>
      ))}
    </>
  );
}

export interface CalendarChipProps {
  color: string;
  title?: string;
  onClick: () => void;
  /** Item já concluído/passado: esbatido. */
  muted?: boolean;
  /** Realce extra (ex.: conflito de atribuição). */
  className?: string;
  children: ReactNode;
}

export function CalendarChip({
  color,
  title,
  onClick,
  muted,
  className,
  children,
}: CalendarChipProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'block w-full break-words rounded-control px-1.5 py-1 text-left font-body text-micro font-semibold leading-tight text-brand transition hover:brightness-95',
        muted && 'opacity-70',
        className,
      )}
      style={{
        background: calendarTint(color, 14),
        borderLeft: `3px solid ${color}`,
      }}
    >
      {children}
    </button>
  );
}
