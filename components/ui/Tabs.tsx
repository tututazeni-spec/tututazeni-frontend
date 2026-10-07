// components/ui/Tabs.tsx
'use client';

import type { ComponentProps } from 'react';
import { Tabs as RadixTabs } from 'radix-ui';
import { cn } from '@/lib/cn';

export const Tabs = RadixTabs.Root;

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('flex gap-1 border-b border-border', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'border-b-2 border-transparent px-3 py-2 font-body text-sm font-medium text-ink-muted',
        'transition-all duration-200 hover:scale-105 hover:text-ink data-[state=inactive]:hover:border-primary/60 motion-reduce:hover:scale-100',
        'data-[state=active]:border-primary data-[state=active]:text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      className={cn(
        'pt-4 font-body text-sm text-ink focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  );
}
