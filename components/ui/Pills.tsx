// components/ui/Pills.tsx
// Pílulas do design dos separadores do History (Linha de tempo / Marcos /
// Actividade): borda de 1,5px, texto semi-negrito, activa em navy #0F1F3D com
// letra branca.
//  - <PeriodPills>   → seletor de período (7/30/90 dias, janelas…): uma activa.
//  - <ShortcutPills> → atalhos: pílula inactiva que fica navy ao passar o cursor.
// Hover do <PeriodPills>: inverte as cores — a não seleccionada (fundo branco,
// letra escura) fica navy com letra branca; a seleccionada fica branca com
// letra navy.
// Sem lógica própria: quem usa decide o que cada opção/atalho faz.

import { cn } from '@/lib/cn';

const PILL =
  'rounded-pill border-[1.5px] px-3.5 py-1.5 font-body text-sm font-semibold transition-colors';
const PILL_ACTIVE = 'border-brand bg-brand text-white';
const PILL_IDLE =
  'border-border-strong bg-surface text-ink-muted hover:bg-surface-sunken';
const PILL_HOVER_NAVY = 'hover:border-brand hover:bg-brand hover:text-white';

/** Hover da pílula activa: inverte (fundo branco, letra navy). */
const PILL_ACTIVE_HOVER_INVERT =
  'hover:border-brand hover:bg-surface hover:text-brand';

/** Classes da pílula, para pílulas que são links (navegação entre rotas). */
export const pillClass = (active: boolean) =>
  cn(PILL, active ? PILL_ACTIVE : PILL_IDLE);

export interface PeriodPillOption<T extends string | number> {
  value: T;
  label: string;
}

export function PeriodPills<T extends string | number>({
  options,
  value,
  onChange,
  label = 'Período',
  className,
}: {
  options: readonly PeriodPillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              PILL,
              active
                ? cn(PILL_ACTIVE, PILL_ACTIVE_HOVER_INVERT)
                : cn(PILL_IDLE, PILL_HOVER_NAVY),
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export interface ShortcutPillItem {
  label: string;
  onClick: () => void;
}

export function ShortcutPills({
  items,
  className,
}: {
  items: readonly ShortcutPillItem[];
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={it.onClick}
          className={cn(PILL, PILL_IDLE, PILL_HOVER_NAVY)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
