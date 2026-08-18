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
          className={cn(
            'inline-flex w-full items-center justify-between gap-2 rounded-control border-[1.5px] border-border-strong',
            'bg-surface px-3 py-[9px] font-body text-sm text-ink',
            'focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle',
            'disabled:cursor-not-allowed disabled:opacity-50',
            invalid &&
              'border-danger focus:border-danger focus:ring-danger-subtle',
            className,
          )}
        >
          <span className={cn(!selected && 'text-ink-muted')}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="text-ink-muted"
          />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[--radix-popover-trigger-width] overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search
              size={14}
              strokeWidth={1.75}
              className="shrink-0 text-ink-muted"
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent font-body text-sm text-ink outline-none placeholder:text-ink-muted"
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
          <div className="max-h-64 overflow-y-auto p-1">
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
                  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-control px-3 py-2 font-body text-sm text-ink',
                  'outline-none hover:bg-primary-subtle',
                  item.value === value && 'bg-primary-subtle',
                )}
              >
                <span>{item.label}</span>
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
