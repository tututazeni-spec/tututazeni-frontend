'use client';

// Error boundary das páginas da plataforma. Fica dentro do layout, por isso a
// Sidebar e a Topbar continuam utilizáveis quando uma página rebenta (o
// app/error.tsx da raiz substituiria tudo).

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCard } from '@/components/ui/AlertCard';
import { reportError } from '@/lib/errorReporting';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, {
      source: 'app/(platform)/error.tsx',
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-12">
      <AlertCard
        variant="danger"
        title="Não foi possível mostrar esta página"
        message="O resto da aplicação continua a funcionar. Tente novamente ou volte ao painel; se persistir, indique a referência ao suporte."
        detail={error.digest ? `Referência: ${error.digest}` : undefined}
        onAction={reset}
        actionLabel="Tentar novamente"
      />
      <Link
        href="/dashboard"
        className="self-start font-body text-sm text-ink-muted underline"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
