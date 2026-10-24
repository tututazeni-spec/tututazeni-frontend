// components/ui/SafeHtml.tsx
// Único ponto autorizado a usar dangerouslySetInnerHTML (regra ESLint no-restricted-syntax).
// Sanitiza sempre com DOMPurify antes de injectar — usar para HTML vindo da BD, da IA ou de
// utilizadores (lições, artigos, respostas do tutor).

import type { ElementType, HTMLAttributes } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

interface SafeHtmlProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children' | 'dangerouslySetInnerHTML'
> {
  html: string | null | undefined;
  as?: ElementType;
}

export function SafeHtml({ html, as: Tag = 'div', ...rest }: SafeHtmlProps) {
  return (
    <Tag {...rest} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
  );
}
