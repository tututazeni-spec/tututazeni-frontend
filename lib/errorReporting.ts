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

  console.error(
    `[error]${context?.source ? ` ${context.source}:` : ''} ${message}`,
    { status, context, error },
  );

  forward(error, message, status, context);
}

// Destino externo opcional. Define NEXT_PUBLIC_ERROR_REPORT_URL para enviar
// cada erro (JSON, via sendBeacon) a um colector; para ligar Sentry/Datadog,
// regista um sink com registerErrorSink() — sem tocar nos chamadores.
export type ErrorSink = (payload: ErrorPayload) => void;

export interface ErrorPayload {
  message: string;
  status?: number;
  source?: string;
  stack?: string;
  path?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

let sink: ErrorSink | null = null;

export function registerErrorSink(fn: ErrorSink | null): void {
  sink = fn;
}

// Evita inundar o colector com o mesmo erro (ex.: query com retries).
const DEDUPE_MS = 5_000;
const MAX_TRACKED = 50;
const recent = new Map<string, number>();

function forward(
  error: unknown,
  message: string,
  status: number | undefined,
  context?: ErrorContext,
): void {
  try {
    const key = `${context?.source ?? ''}|${status ?? ''}|${message}`;
    const now = Date.now();
    const last = recent.get(key);
    if (last !== undefined && now - last < DEDUPE_MS) return;
    if (recent.size >= MAX_TRACKED) recent.clear();
    recent.set(key, now);

    const { source, ...rest } = context ?? { source: undefined };
    const payload: ErrorPayload = {
      message,
      status,
      source,
      stack: error instanceof Error ? error.stack : undefined,
      path:
        typeof window !== 'undefined' ? window.location.pathname : undefined,
      context: JSON.parse(
        JSON.stringify(rest, (_k, v) => (v instanceof Error ? v.message : v)),
      ),
      timestamp: new Date(now).toISOString(),
    };

    sink?.(payload);

    const url = process.env.NEXT_PUBLIC_ERROR_REPORT_URL;
    if (url && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        url,
        new Blob([JSON.stringify(payload)], { type: 'application/json' }),
      );
    }
  } catch {
    // O reporting nunca pode ele próprio rebentar a aplicação.
  }
}

/**
 * Mensagem amigável para mostrar ao utilizador a partir de um erro (API ou não).
 * Cada mensagem diz o que aconteceu E o que fazer a seguir; mensagens de
 * validação devolvidas pelo backend (4xx com texto legível) são preservadas.
 */
export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const { status } = error;
    if (status === 0)
      return 'Sem ligação ao servidor. Verifique a sua internet e tente novamente.';
    if (status === 401)
      return 'A sua sessão expirou. Inicie sessão novamente para continuar.';
    if (status === 403)
      return 'Não tem permissão para esta acção. Peça acesso ao administrador da sua empresa.';
    if (status === 404)
      return 'Não encontrámos o que procura. Pode ter sido removido; volte atrás e tente de novo.';
    if (status === 408 || status === 504)
      return 'O pedido demorou demasiado. Tente novamente dentro de instantes.';
    if (status === 409)
      return error.message || 'Este registo já existe ou foi alterado entretanto. Actualize a página e reveja os dados.';
    if (status === 413)
      return 'O ficheiro é demasiado grande. Escolha um ficheiro mais pequeno.';
    if (status === 429)
      return 'Fez demasiados pedidos seguidos. Aguarde um minuto e tente novamente.';
    if (status >= 500)
      return 'Algo correu mal do nosso lado. Tente novamente dentro de instantes; se persistir, contacte o suporte.';
    return error.message || 'Não foi possível concluir. Reveja os dados e tente novamente.';
  }
  if (error instanceof Error)
    return error.message || 'Ocorreu um erro inesperado. Tente novamente.';
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
