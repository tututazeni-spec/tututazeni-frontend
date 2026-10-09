// components/ui/Select.tsx
'use client';

import { Select as RadixSelect } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectItemOption {
  value: string;
  label: string;
}

export interface SelectProps {
  items: SelectItemOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Rótulo flutuante; por omissão usa o placeholder. */
  label?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  items,
  value,
  onValueChange,
  placeholder = 'Selecionar…',
  label,
  invalid,
  disabled,
  className,
}: SelectProps) {
  const emptyItem = items.find((i) => i.value === '');
  const shownLabel = label ?? emptyItem?.label ?? placeholder;

  return (
    <RadixSelect.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        aria-invalid={invalid || undefined}
        className={cn(
          'group relative inline-flex min-h-[48px] max-w-full items-center justify-between gap-2 rounded-control border-[1.5px] border-field',
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
            'pointer-events-none absolute left-3 max-w-[calc(100%-2.75rem)] truncate whitespace-nowrap origin-left font-body text-ink-muted transition-all duration-150',
            'top-[6px] text-[11px] font-medium text-field',
            'group-data-[placeholder]:top-1/2 group-data-[placeholder]:-translate-y-1/2 group-data-[placeholder]:text-sm',
            'group-data-[placeholder]:font-normal group-data-[placeholder]:text-ink-muted',
            'group-focus:top-[6px] group-focus:translate-y-0 group-focus:text-[11px] group-focus:font-medium group-focus:text-field',
          )}
        >
          {shownLabel}
        </span>
        <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)] overflow-hidden">
          {[shownLabel, ...items.map((i) => i.label)].map((t, n) => (
            <span
              key={n}
              aria-hidden
              className="invisible col-start-1 row-start-1 whitespace-nowrap"
            >
              {t}
            </span>
          ))}
          <span className="col-start-1 row-start-1 min-w-0 truncate whitespace-nowrap">
            <RadixSelect.Value placeholder={' '} />
          </span>
        </span>
        <RadixSelect.Icon>
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="shrink-0 text-field"
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-[60] min-w-[var(--radix-select-trigger-width)] max-w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-card border border-field bg-surface shadow-elevated"
          position="popper"
          sideOffset={4}
          collisionPadding={8}
        >
          <RadixSelect.Viewport className="p-1 max-h-[var(--radix-select-content-available-height)] overflow-y-auto">
            {items.map((item) => (
              <RadixSelect.Item
                key={item.value}
                value={item.value}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-control px-3 py-2 font-body text-sm text-field-ink',
                  'outline-none data-[highlighted]:bg-field-soft',
                )}
              >
                <span className="min-w-0 whitespace-normal break-words">
                  <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
                </span>
                <RadixSelect.ItemIndicator>
                  <Check
                    size={14}
                    strokeWidth={1.75}
                    className="text-primary"
                  />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
