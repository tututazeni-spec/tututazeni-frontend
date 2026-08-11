// components/ui/DropdownMenu.tsx
'use client';

import type { ComponentProps } from 'react';
import { DropdownMenu as RadixDropdown } from 'radix-ui';
import { cn } from '@/lib/cn';

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof RadixDropdown.Content>) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[180px] rounded-card border border-border bg-surface p-1 shadow-elevated',
          className,
        )}
        {...props}
      />
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: ComponentProps<typeof RadixDropdown.Item>) {
  return (
    <RadixDropdown.Item
      className={cn(
        'cursor-pointer rounded-control px-3 py-2 font-body text-sm text-ink outline-none',
        'data-[highlighted]:bg-primary-subtle',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof RadixDropdown.Separator>) {
  return (
    <RadixDropdown.Separator className={cn('my-1 h-px bg-border', className)} {...props} />
  );
}
