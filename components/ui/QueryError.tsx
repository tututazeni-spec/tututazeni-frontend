// components/ui/QueryError.tsx
// Estado de erro inline para uma query/mutação falhada — alternativa ao
// EmptyState genérico quando o motivo de não haver dados é um erro real,
// não "ainda sem pesquisa" ou "lista vazia". Usar sempre que uma vista
// mostraria o mesmo empty-state para "nunca pesquisou" e "pesquisou e
// falhou" — essa ambiguidade é enganosa para o utilizador.

'use client';

import { AlertTriangle } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { friendlyMessage } from '@/lib/errorReporting';

export interface QueryErrorProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryError({
  error,
  title = 'Não foi possível carregar',
  onRetry,
  className,
}: QueryErrorProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={friendlyMessage(error)}
      action={
        onRetry ? { label: 'Tentar novamente', onClick: onRetry } : undefined
      }
      className={className}
    />
  );
}
