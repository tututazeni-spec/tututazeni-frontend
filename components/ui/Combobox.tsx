// components/ui/Combobox.tsx
// Select pesquisável: ao digitar, filtra a lista para as opções cujo
// rótulo começa pelo texto escrito (sem distinguir acentos/maiúsculas),
// mantendo ordem alfabética nos resultados filtrados.
'use client';

import { useMemo, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  items: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Rótulo flutuante; por omissão usa o placeholder. */
  label?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = 'Selecionar…',
  label,
  searchPlaceholder = 'Escreva para filtrar…',
  emptyText = 'Sem resultados',
  invalid,
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.value === value);

  const filteredItems = useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items
      .filter((i) => normalize(i.label).startsWith(q))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt'));
  }, [items, query]);

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
          disabled={disabled}
          aria-invalid={invalid || undefined}
          data-placeholder={selected ? undefined : ''}
          className={cn(
            'group relative inline-flex min-h-[48px] w-full items-center justify-between gap-2 rounded-control border-[1.5px] border-field',
            'bg-surface px-3 pb-[6px] pt-[18px] text-left font-body text-sm text-field-ink',
            'focus:bg-field-soft focus:outline-none focus:ring-[3px] focus:ring-field-soft',
            'disabled:cursor-not-allowed disabled:opacity-50',
            invalid && 'border-danger focus:ring-danger-subtle',
            className,
          )}
        >
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute left-3 origin-left font-body transition-all duration-150',
              'top-[6px] text-[11px] font-medium text-field',
              'group-data-[placeholder]:top-1/2 group-data-[placeholder]:-translate-y-1/2 group-data-[placeholder]:text-sm',
              'group-data-[placeholder]:font-normal group-data-[placeholder]:text-ink-muted',
              'group-focus:top-[6px] group-focus:translate-y-0 group-focus:text-[11px] group-focus:font-medium group-focus:text-field',
            )}
          >
            {label ?? placeholder}
          </span>
          <span className="min-w-0 flex-1 truncate">
            {selected ? selected.label : ' '}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="shrink-0 text-field"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-[60] min-w-[var(--radix-popover-trigger-width)] max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-field bg-surface shadow-elevated"
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
                if (e.key === 'Enter' && filteredItems.length > 0) {
                  onValueChange?.(filteredItems[0].value);
                  setOpen(false);
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
            />
          </div>
          <div className="max-h-[min(16rem,var(--radix-popover-content-available-height))] overflow-y-auto p-1">
            {filteredItems.length === 0 && (
              <div className="px-3 py-2 font-body text-sm text-ink-muted">
                {emptyText}
              </div>
            )}
            {filteredItems.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onValueChange?.(item.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-control px-3 py-2 font-body text-sm text-field-ink',
                  'outline-none hover:bg-field-soft',
                  item.value === value && 'bg-field-soft',
                )}
              >
                <span className="min-w-0 whitespace-normal break-words text-left">
                  {item.label}
                </span>
                {item.value === value && (
                  <Check
                    size={14}
                    strokeWidth={1.75}
                    className="text-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
