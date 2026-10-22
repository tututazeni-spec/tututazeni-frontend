// lib/polling.ts
// Polling inteligente para `refetchInterval`.
//
// - Separador oculto: o React Query já pausa o polling (refetchIntervalInBackground
//   é false por defeito), por isso não é tratado aqui.
// - Erro: recua exponencialmente (x2, x4, x8) em vez de martelar um endpoint que
//   está a falhar.
// - Inactividade: sem rato/teclado/toque há IDLE_AFTER_MS, abranda x4. Um separador
//   esquecido aberto deixa de custar pedidos ao backend.

const IDLE_AFTER_MS = 5 * 60 * 1000;
const IDLE_FACTOR = 4;
const MAX_ERROR_FACTOR = 8;

let lastActivity = Date.now();
let listening = false;

function markActive() {
  lastActivity = Date.now();
}

function ensureActivityTracking() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  for (const evt of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
    window.addEventListener(evt, markActive, { passive: true });
  }
}

/** Intervalo efectivo para um pedido base de `baseMs`. Exportado para testes. */
export function nextPollInterval(
  baseMs: number,
  errorCount: number,
  idleMs: number,
): number {
  const errorFactor = Math.min(2 ** errorCount, MAX_ERROR_FACTOR);
  const idleFactor = idleMs >= IDLE_AFTER_MS ? IDLE_FACTOR : 1;
  return baseMs * errorFactor * idleFactor;
}

/**
 * Usar em `refetchInterval`:
 *   `{ refetchInterval: pollInterval(60_000) }`
 */
export function pollInterval(baseMs: number) {
  ensureActivityTracking();
  // Tipo estrutural: qualquer Query do React Query satisfaz isto, seja qual for o TData.
  return (query: { state: { errorUpdateCount: number } }): number =>
    nextPollInterval(
      baseMs,
      query.state.errorUpdateCount,
      Date.now() - lastActivity,
    );
}
