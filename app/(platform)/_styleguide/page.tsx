// app/(platform)/_styleguide/page.tsx
// Referência viva de todos os primitivos de components/ui/ — mesma
// finalidade do companion visual usado no brainstorming, mas versionada
// e sempre actualizada. Serve de base para a Fase B (migração dos módulos).
// Acesso restrito: não expõe dados, mas mantém-se atrás do guard ADMIN
// tal como decidido no spec.

'use client';

import type { ReactNode } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ADMIN_ROLES, type Role } from '@/lib/roles';

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

export default function StyleguidePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) return null;

  if (!user?.role?.code || !ADMIN_ROLES.includes(user.role.code as Role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas font-body text-sm text-ink-muted">
        Acesso restrito à administração.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-[var(--space-section)] bg-canvas p-10 font-body text-ink">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Guia de estilo — INNOVA
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Referência viva dos componentes de <code>components/ui/</code>.
        </p>
      </div>
      {/* Tasks seguintes acrescentam <StyleguideSection> aqui, por ordem */}
    </div>
  );
}
