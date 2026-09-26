// lib/sessionActivity.ts
// Mantém a sessão viva enquanto o utilizador está realmente activo (rato,
// teclado, toque) e força logout ao fim de SESSION_IDLE_TIMEOUT_MS de
// inactividade — mesmo que pedidos de fundo (polling, React Query) continuem
// a acontecer sem qualquer interacção. Antes disto o access token (15 min,
// ver src/auth/auth.module.ts) simplesmente expirava sem que nada o
// renovasse: o frontend nunca chamava POST /auth/refresh, por isso a sessão
// caía aos 15 min mesmo com o utilizador activo.
//
// SESSION_IDLE_TIMEOUT_MS tem de espelhar o default do backend
// (src/auth/auth.service.ts#sessionIdleTimeoutMs / env SESSION_IDLE_TIMEOUT_MS)
// — este ficheiro é quem decide QUANDO parar de renovar; o backend é quem
// recusa a renovação se, por alguma razão, esta janela não for respeitada.

import { apiClient, logout } from './apiClient';

export const SESSION_IDLE_TIMEOUT_MS = 25 * 60 * 1000;

// Bem abaixo do TTL de 15 min do access token — mesmo perdendo uma tentativa
// por erro de rede, a seguinte ainda chega a tempo.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Cadência de verificação do relógio de inactividade; não gera pedido de
// rede nenhum por si só, só decide se é altura de renovar ou de desligar.
const CHECK_INTERVAL_MS = 15 * 1000;

// Partilhado entre separadores via localStorage: actividade num separador
// mantém a sessão viva nos outros também.
const ACTIVITY_STORAGE_KEY = 'innova:lastActivityAt';

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'wheel',
  'touchstart',
  'scroll',
] as const;

let lastActivityAt = Date.now();

function persistActivity(now: number): void {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now));
  } catch {
    // Privado/bloqueado — fica só em memória; perde-se a sincronização entre
    // separadores mas o relógio deste separador continua correcto.
  }
}

function readStoredActivity(): number {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function recordActivity(): void {
  const now = Date.now();
  lastActivityAt = now;
  persistActivity(now);
}

/** Actividade mais recente conhecida, incluindo a de outros separadores. */
function getLastActivityAt(): number {
  return Math.max(lastActivityAt, readStoredActivity());
}

/**
 * Liga o rastreio de inactividade. Devolve uma função de limpeza (remove os
 * listeners e o temporizador) — chamar a partir de um useEffect.
 */
export function startSessionIdleWatcher(): () => void {
  if (typeof window === 'undefined') return () => {};

  recordActivity();
  let stopped = false;

  const onActivity = () => recordActivity();
  for (const event of ACTIVITY_EVENTS) {
    window.addEventListener(event, onActivity, { passive: true });
  }

  let lastRefreshAt = Date.now();
  const refresh = () => {
    lastRefreshAt = Date.now();
    // Um 401 aqui já dispara logout() automaticamente (ver
    // lib/http.ts/apiClient.ts); um erro de rede resolve-se sozinho na
    // próxima tentativa, dentro de REFRESH_INTERVAL_MS.
    apiClient.post('/auth/refresh').catch(() => undefined);
  };
  // Corre já uma vez: cobre o caso de recarregar a página tarde na vida do
  // access token (ex.: 14 dos 15 min já passados) sem esperar pelo primeiro
  // tick do intervalo.
  refresh();

  const tick = () => {
    if (stopped) return;
    const idleMs = Date.now() - getLastActivityAt();

    if (idleMs >= SESSION_IDLE_TIMEOUT_MS) {
      stopped = true;
      logout('idle');
      return;
    }

    if (Date.now() - lastRefreshAt >= REFRESH_INTERVAL_MS) {
      refresh();
    }
  };

  const intervalId = window.setInterval(tick, CHECK_INTERVAL_MS);

  return () => {
    stopped = true;
    window.clearInterval(intervalId);
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, onActivity);
    }
  };
}
