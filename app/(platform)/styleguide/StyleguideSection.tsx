// app/(platform)/styleguide/StyleguideSection.tsx
// Secção de apresentação usada pela página de styleguide para agrupar
// exemplos de um mesmo primitivo de components/ui/.

import type { ReactNode } from 'react';

export function StyleguideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-[var(--space-stack)]">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  );
}
