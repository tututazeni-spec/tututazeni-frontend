// components/ui/Toast.tsx
'use client';

import { Toast as RadixToast } from 'radix-ui';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ToastOptions } from '@/providers/ToastProvider';

const INTENT_ICON = { success: CheckCircle2, danger: XCircle, info: Info } as const;
const INTENT_COLOR = {
  success: 'text-success',
  danger: 'text-danger',
  info: 'text-info',
} as const;

export interface ToastItemProps extends ToastOptions {
  id: string;
  onOpenChange: (open: boolean) => void;
}

export function ToastItem({ title, description, intent = 'info', onOpenChange }: ToastItemProps) {
  const Icon = INTENT_ICON[intent];
  return (
    <RadixToast.Root
      onOpenChange={onOpenChange}
      duration={4000}
      className={cn(
        'flex items-start gap-3 rounded-card border border-border bg-surface p-4 shadow-elevated',
        'translate-y-2 opacity-0 transition-[transform,opacity] duration-200',
        'data-[state=open]:translate-y-0 data-[state=open]:opacity-100',
        'data-[state=closed]:opacity-0',
      )}
    >
      <Icon size={20} strokeWidth={1.75} className={cn('shrink-0', INTENT_COLOR[intent])} />
      <div className="flex-1">
        <RadixToast.Title className="font-body text-sm font-semibold text-ink">
          {title}
        </RadixToast.Title>
        {description && (
          <RadixToast.Description className="mt-0.5 font-body text-xs text-ink-muted">
            {description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close aria-label="Fechar notificação" className="text-ink-faint hover:text-ink">
        <X size={16} strokeWidth={1.75} />
      </RadixToast.Close>
    </RadixToast.Root>
  );
}

export function ToastViewport() {
  return (
    <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2 outline-none" />
  );
}
