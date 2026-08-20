// lib/errorReporting.ts
// Ponto único de reporting de erros da aplicação. Hoje faz apenas
// console.error estruturado; quando houver um serviço de observabilidade
// (Sentry, Datadog, etc.), liga-se aqui — sem tocar em cada chamador.

import { ApiError } from './apiClient';

export interface ErrorContext {
  /** Onde o erro ocorreu (componente, hook ou operação). */
  source: string;
  [key: string]: unknown;
}

export function reportError(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error);
  const status = error instanceof ApiError ? error.status : undefined;

  // eslint-disable-next-line no-console -- ponto central de logging; ver comentário acima.
  console.error(
    `[error]${context?.source ? ` ${context.source}:` : ''} ${message}`,
    { status, context, error },
  );

  // TODO: quando existir serviço de observabilidade, enviar aqui, ex:
  // Sentry.captureException(error, { extra: context, tags: { source: context?.source } });
}

/** Mensagem amigável para mostrar ao utilizador a partir de um erro (API ou não). */
export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0)
      return 'Sem ligação ao servidor. Verifique a sua ligação à internet.';
    if (error.status === 401)
      return 'Sessão expirada. Inicie sessão novamente.';
    if (error.status === 403) return 'Não tem permissão para esta acção.';
    if (error.status === 404) return 'Recurso não encontrado.';
    if (error.status >= 500)
      return 'Erro no servidor. Tente novamente mais tarde.';
    return error.message || 'Ocorreu um erro.';
  }
  if (error instanceof Error)
    return error.message || 'Ocorreu um erro inesperado.';
  return 'Ocorreu um erro inesperado.';
}
