// lib/sessionActivity.ts
// Mantém a sessão viva enquanto o utilizador mexe no rato/teclado e termina-a
// após 30 minutos sem qualquer actividade.
//
// Porquê: o backend mede a inactividade desde a última rotação do refresh
// token (POST /auth/refresh), e o apiClient só rodava o token depois de um
// 401. Quem estava a ler/escrever sem fazer pedidos à API passava os 30 min
// desde o último refresh e era expulso mesmo com rato e teclado activos.
// Aqui a actividade real do utilizador dispara o refresh proactivamente.

export const IDLE_LIMIT_MS = 30 * 60_000;
/** Intervalo mínimo entre refreshes proactivos (access token dura 15 min). */
export const REFRESH_EVERY_MS = 5 * 60_000;
export const TICK_MS = 30_000;

const ACTIVITY_KEY = 'innova:lastActivity';
const REFRESH_KEY = 'innova:lastRefresh';

export type TickAction = 'none' | 'refresh' | 'logout';

/** Decisão pura (testável): o que fazer neste tick. */
export function decideTick(
  now: number,
  lastActivity: number,
  lastRefresh: number,
): TickAction {
  if (now - lastActivity >= IDLE_LIMIT_MS) return 'logout';
  if (lastActivity > lastRefresh && now - lastRefresh >= REFRESH_EVERY_MS) {
    return 'refresh';
  }
  return 'none';
}

function readNumber(key: string): number {
  try {
    const v = Number(window.localStorage.getItem(key));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function writeNumber(key: string, value: number): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage indisponível — o estado em memória continua a funcionar */
  }
}

// Fallback em memória quando localStorage está bloqueado.
let memActivity = 0;
let memRefresh = 0;

export function getLastActivity(): number {
  return Math.max(memActivity, readNumber(ACTIVITY_KEY));
}

export function getLastRefresh(): number {
  return Math.max(memRefresh, readNumber(REFRESH_KEY));
}

export function markRefreshed(now = Date.now()): void {
  memRefresh = now;
  writeNumber(REFRESH_KEY, now);
}

export function markActivity(now = Date.now()): void {
  memActivity = now;
  writeNumber(ACTIVITY_KEY, now);
}

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'wheel',
  'scroll',
  'touchstart',
  'click',
] as const;

/**
 * Arranca o rastreio. Devolve a função de limpeza.
 * `refresh` renova a sessão (true = ok); `onExpire` termina-a.
 */
export function startSessionActivity(
  refresh: () => Promise<boolean>,
  onExpire: () => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  // Abrir/recarregar a app é actividade (evita herdar um timestamp velho de
  // uma sessão anterior e expirar logo após o login). Se nunca houve refresh
  // registado, o login acabou de o fazer.
  const boot = Date.now();
  markActivity(boot);
  if (!getLastRefresh()) markRefreshed(boot);

  let lastWrite = 0;
  const onActivity = () => {
    const now = Date.now();
    // Limita escritas (mousemove dispara dezenas de vezes por segundo).
    if (now - lastWrite < 1000) return;
    lastWrite = now;
    markActivity(now);
  };

  const tick = () => {
    const action = decideTick(Date.now(), getLastActivity(), getLastRefresh());
    if (action === 'logout') {
      onExpire();
    } else if (action === 'refresh') {
      void refresh();
    }
  };

  for (const ev of ACTIVITY_EVENTS) {
    window.addEventListener(ev, onActivity, { passive: true, capture: true });
  }
  // Timers de separadores em segundo plano são atrasados: reavaliar ao voltar.
  const onVisible = () => {
    if (document.visibilityState === 'visible') tick();
  };
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', tick);

  const timer = window.setInterval(tick, TICK_MS);
  tick();

  return () => {
    for (const ev of ACTIVITY_EVENTS) {
      window.removeEventListener(ev, onActivity, { capture: true });
    }
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', tick);
    window.clearInterval(timer);
  };
}
