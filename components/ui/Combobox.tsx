// components/ui/Combobox.tsx
// Select pesquisável: ao digitar, filtra a lista para as opções cujo
// rótulo começa pelo texto escrito (sem distinguir acentos/maiúsculas),
// mantendo ordem alfabética nos resultados filtrados.
'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { Check, ChevronDown, Search, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { VirtualList } from './VirtualList';

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
  /** Permite escrever um valor que não está na lista (Enter ou "Usar «texto»"). */
  allowCustom?: boolean;
  /**
   * `box` (por omissão): campo com caixa e rótulo flutuante.
   * `underline`: filtro minimalista (Filtros Underline) — ícone à esquerda,
   * só uma linha por baixo e seta à direita; mantém a pesquisa na lista.
   */
  variant?: 'box' | 'underline';
  /** Só na variante `underline`: ícone à esquerda do filtro. */
  icon?: LucideIcon;
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
  allowCustom,
  variant = 'box',
  icon: Icon,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const contentId = useId();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected =
    items.find((i) => i.value === value) ??
    (allowCustom && value ? { value, label: value } : undefined);
  const customText = query.trim();
  const showCustom =
    allowCustom &&
    customText !== '' &&
    !items.some((i) => normalize(i.label) === normalize(customText));

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
          role="combobox"
          // role=combobox não tira o nome do conteúdo: rótulo + valor explícitos.
          aria-label={
            selected
              ? `${label ?? placeholder}: ${selected.label}`
              : (label ?? placeholder)
          }
          aria-expanded={open}
          aria-controls={contentId}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          data-placeholder={selected ? undefined : ''}
          className={cn(
            variant === 'underline'
              ? [
                  'group flex min-h-[40px] w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left font-body text-sm text-brand',
                  'transition-colors focus-visible:border-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 data-[state=open]:border-indigo-500',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  invalid && 'border-danger focus-visible:border-danger',
                ]
              : [
                  'group relative inline-flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-gray-200',
                  'bg-white px-3 py-2 text-left font-body text-sm text-field-ink',
                  'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 data-[state=open]:border-indigo-500',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  invalid &&
                    'border-danger focus:border-danger focus:ring-danger-subtle',
                ],
            className,
          )}
        >
          {variant === 'underline' ? (
            <>
              {Icon && (
                <Icon
                  aria-hidden
                  size={20}
                  strokeWidth={1.5}
                  className="shrink-0 text-brand-muted"
                />
              )}
              <span className="min-w-0 flex-1 truncate">
                {selected ? (
                  selected.label
                ) : (
                  <span className="text-brand-muted">
                    {label ?? placeholder}
                  </span>
                )}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className="shrink-0 text-brand-muted"
              />
            </>
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate">
                {selected ? (
                  selected.label
                ) : (
                  <span className="text-ink-muted">{label ?? placeholder}</span>
                )}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className="shrink-0 text-brand-muted"
              />
            </>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          id={contentId}
          align="start"
          sideOffset={4}
          collisionPadding={8}
          className="z-[700] min-w-[var(--radix-popover-trigger-width)] max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-field bg-surface shadow-elevated"
        >
          <div className="m-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
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
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredItems.length > 0) {
                    onValueChange?.(filteredItems[0].value);
                    setOpen(false);
                  } else if (showCustom) {
                    onValueChange?.(customText);
                    setOpen(false);
                  }
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
            />
          </div>
          <VirtualList
            items={filteredItems}
            getKey={(item) => item.value}
            estimateSize={40}
            className="list-scroll max-h-[min(16rem,var(--radix-popover-content-available-height))] p-1"
            header={
              <>
                {showCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      onValueChange?.(customText);
                      setOpen(false);
                    }}
                    className="flex w-full cursor-pointer items-center rounded-control px-3 py-2 text-left font-body text-sm font-medium text-primary outline-none hover:bg-field-soft"
                  >
                    Usar «{customText}»
                  </button>
                )}
                {filteredItems.length === 0 && !showCustom && (
                  <div className="px-3 py-2 font-body text-sm text-ink-muted">
                    {emptyText}
                  </div>
                )}
              </>
            }
            renderItem={(item) => (
              <button
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
            )}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
