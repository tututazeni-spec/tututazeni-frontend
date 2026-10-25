// components/ui/LinkButton.tsx
//
// Botão com aspecto de link de texto ("Limpar", "Ver detalhe", código de uma
// instância…). Substitui os <button className="text-primary hover:underline">
// escritos à mão em cada módulo, que não tinham anel de foco.
// Para navegação entre rotas continua a usar-se <Link> do Next.

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type LinkButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'rounded-control font-body text-primary transition-colors duration-150 hover:underline',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        className,
      )}
      {...props}
    />
  ),
);
LinkButton.displayName = 'LinkButton';
