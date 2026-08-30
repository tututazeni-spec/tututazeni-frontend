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
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Select({
  items,
  value,
  onValueChange,
  placeholder = 'Selecionar…',
  invalid,
  disabled,
  className,
}: SelectProps) {
  return (
    <RadixSelect.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        aria-invalid={invalid || undefined}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-control border-[1.5px] border-border-strong',
          'bg-surface px-3 py-[9px] font-body text-sm text-ink',
          'focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid &&
            'border-danger focus:border-danger focus:ring-danger-subtle',
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown
            size={16}
            strokeWidth={1.75}
            className="text-ink-muted"
          />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-50 overflow-hidden rounded-card border border-border bg-surface shadow-elevated"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1 max-h-[var(--radix-select-content-available-height)] overflow-y-auto">
            {items.map((item) => (
              <RadixSelect.Item
                key={item.value}
                value={item.value}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-2 rounded-control px-3 py-2 font-body text-sm text-ink',
                  'outline-none data-[highlighted]:bg-primary-subtle',
                )}
              >
                <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
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
