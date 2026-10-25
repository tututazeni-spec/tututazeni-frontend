// components/ui/QueryBoundary.tsx
// Trata os três estados de uma query num só sítio: a carregar, falhada (com
// «Tentar novamente») e com dados. Evita o padrão em que uma query falhada
// renderiza o ecrã como se não houvesse dados (zeros, lista vazia ou skeleton
// infinito). Se já existirem dados em cache, mostra-os mesmo que um refetch
// tenha falhado — o toast global avisa, e o utilizador não perde o contexto.

'use client';

import type { ReactNode } from 'react';
import { QueryError } from './QueryError';
import { Skeleton } from './Skeleton';

export interface QueryLike<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

export interface QueryBoundaryProps<T> {
  query: QueryLike<T>;
  /** Placeholder de carregamento; por omissão um Skeleton genérico. */
  loading?: ReactNode;
  /** Título do estado de erro. */
  errorTitle?: string;
  className?: string;
  children: ReactNode | ((data: T) => ReactNode);
}

export function QueryBoundary<T>({
  query,
  loading,
  errorTitle,
  className,
  children,
}: QueryBoundaryProps<T>) {
  const { data, isLoading, isError, error, refetch } = query;

  if (data === undefined || data === null) {
    if (isError) {
      return (
        <QueryError
          error={error}
          title={errorTitle}
          className={className}
          onRetry={() => void refetch()}
        />
      );
    }
    if (isLoading) return <>{loading ?? <Skeleton />}</>;
    return null;
  }

  return <>{typeof children === 'function' ? children(data) : children}</>;
}
