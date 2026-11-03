// components/ui/MultiCombobox.tsx
// Filtro de escolha múltipla (Filtros Underline): ao clicar abre a lista com
// pesquisa e caixas de marcar. Opcionalmente tem uma primeira linha «todos»
// que selecciona tudo com um clique.
'use client';

import { useMemo, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { ChevronDown, Search, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Checkbox } from './Checkbox';

export interface MultiComboboxOption {
  value: string;
  label: string;
}

export interface MultiComboboxProps {
  items: MultiComboboxOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  label: string;
  icon?: LucideIcon;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Se definido, mostra a linha «todos» (ex.: «Todos os departamentos»). */
  allLabel?: string;
  allSelected?: boolean;
  onToggleAll?: () => void;
  className?: string;
}

const normalize = (t: string) =>
  t
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

export function MultiCombobox({
  items,
  value,
  onValueChange,
  label,
  icon: Icon,
  searchPlaceholder = 'Escreva para filtrar…',
  emptyText = 'Sem resultados',
  allLabel,
  allSelected = false,
  onToggleAll,
  className,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return q ? items.filter((i) => normalize(i.label).includes(q)) : items;
  }, [items, query]);

  const summary = allSelected
    ? allLabel
    : value.length === 0
      ? undefined
      : value.length <= 2
        ? items
            .filter((i) => value.includes(i.value))
            .map((i) => i.label)
            .join(', ')
        : `${value.length} selecionados`;

  const toggle = (v: string) =>
    onValueChange(
      value.includes(v) ? value.filter((x) => x !== v) : [...value, v],
    );

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery('');
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={summary ? `${label}: ${summary}` : label}
          aria-expanded={open}
          className={cn(
            'group flex min-h-[44px] w-full items-center gap-3 border-b border-brand-line bg-transparent px-1 pb-2.5 pt-3 text-left font-body text-sm text-brand',
            'transition-colors hover:border-brand-muted focus-visible:border-brand focus-visible:outline-none',
            className,
          )}
        >
          {Icon && (
            <Icon
              aria-hidden
              size={20}
              strokeWidth={1.5}
              className="shrink-0 text-brand-muted"
            />
          )}
          <span className="min-w-0 flex-1 truncate">
            {summary ?? <span className="text-brand-muted">{label}</span>}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="shrink-0 text-brand-muted"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-[700] min-w-[var(--radix-popover-trigger-width)] max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-field bg-surface shadow-elevated"
        >
          <div className="m-2 flex items-center gap-2 rounded-pill border-[1.5px] border-field bg-surface px-3 py-[7px] focus-within:bg-field-soft">
            <Search
              size={14}
              strokeWidth={1.75}
              className="shrink-0 text-field"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent font-body text-sm text-field-ink outline-none placeholder:text-ink-muted"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
              }}
            />
          </div>
          <div className="list-scroll max-h-[min(16rem,var(--radix-popover-content-available-height))] overflow-y-auto p-1">
            {allLabel && onToggleAll && (
              <label className="flex cursor-pointer items-center gap-2 rounded-control px-3 py-2 font-body text-sm font-semibold text-ink hover:bg-field-soft">
                <Checkbox checked={allSelected} onChange={onToggleAll} />
                {allLabel}
              </label>
            )}
            {filtered.map((i) => (
              <label
                key={i.value}
                className="flex cursor-pointer items-center gap-2 rounded-control px-3 py-2 font-body text-sm text-ink hover:bg-field-soft"
              >
                <Checkbox
                  checked={allSelected || value.includes(i.value)}
                  onChange={() => toggle(i.value)}
                />
                {i.label}
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 font-body text-sm text-ink-muted">
                {emptyText}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
