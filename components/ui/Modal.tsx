// components/ui/Modal.tsx
'use client';

import { useEffect, type ComponentProps, type ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useModalVisibilityStore } from '@/lib/modalVisibility';

// Envolve o Dialog.Root só para registar no store partilhado quando este
// modal está aberto — o Topbar usa isso para se auto-ocultar. Mesma API do
// Dialog.Root, por isso todos os consumidores existentes continuam a funcionar.
export function Modal({ open, ...props }: ComponentProps<typeof Dialog.Root>) {
  useEffect(() => {
    if (!open) return;
    useModalVisibilityStore.getState().increment();
    return () => useModalVisibilityStore.getState().decrement();
  }, [open]);

  return <Dialog.Root open={open} {...props} />;
}
export const ModalTrigger = Dialog.Trigger;
export const ModalClose = Dialog.Close;

export interface ModalContentProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Passthrough para `Dialog.Content` — permite ao consumidor controlar o foco inicial de forma determinística. */
  onOpenAutoFocus?: (event: Event) => void;
}

export function ModalContent({
  title,
  description,
  children,
  className,
  onOpenAutoFocus,
}: ModalContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-ink/40',
          'opacity-0 transition-opacity duration-200',
          'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
        )}
      />
      <Dialog.Content
        onOpenAutoFocus={onOpenAutoFocus}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
          'max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain',
          'rounded-panel border border-border bg-surface p-6 shadow-elevated',
          'focus:outline-none',
          'scale-95 opacity-0 transition-[transform,opacity] duration-200',
          'data-[state=open]:scale-100 data-[state=open]:opacity-100',
          'data-[state=closed]:scale-95 data-[state=closed]:opacity-0',
          className,
        )}
      >
        <Dialog.Title className="pr-8 font-display text-lg font-bold text-ink">
          {title}
        </Dialog.Title>
        {description && (
          <Dialog.Description className="mt-2 font-body text-sm text-ink-muted">
            {description}
          </Dialog.Description>
        )}
        {children}
        <Dialog.Close asChild>
          <button
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
