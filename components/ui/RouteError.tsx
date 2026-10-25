'use client';

// Corpo partilhado dos error.tsx de rota (plataforma e módulos). Reporta o erro
// uma vez e mostra o aviso padrão com "Tentar novamente"; o `source` identifica
// o módulo no reporting.

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCard } from '@/components/ui/AlertCard';
import { reportError } from '@/lib/errorReporting';

export interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Identifica a rota/módulo para efeitos de reporting. */
  source: string;
}

export function RouteError({ error, reset, source }: RouteErrorProps) {
  useEffect(() => {
    reportError(error, { source, digest: error.digest });
  }, [error, source]);

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
