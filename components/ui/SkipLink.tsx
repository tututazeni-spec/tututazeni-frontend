// components/ui/SkipLink.tsx
//
// «Saltar para o conteúdo»: primeiro elemento focável da página. Invisível até
// receber foco por teclado (Tab), permite a quem navega sem rato passar à frente
// da Sidebar e da Topbar. O destino é o elemento com `id={targetId}` — o <main>
// do layout (precisa de `tabIndex={-1}` para receber o foco).

import { cn } from '@/lib/cn';

export interface SkipLinkProps {
  /** `id` do elemento de destino, sem `#`. */
  targetId?: string;
  className?: string;
}

export function SkipLink({
  targetId = 'conteudo-principal',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000]',
        'focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:font-body focus:text-sm focus:font-semibold focus:text-white',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
        className,
      )}
    >
      Saltar para o conteúdo
    </a>
  );
}
