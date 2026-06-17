// lib/performanceMonitor.ts
// Monitorização leve de performance das chamadas à API.
//
// Regra de optimização: "monitore performance — trackeie tempo de resposta e erros".
// Mantém uma janela das últimas N amostras em memória e expõe agregados (média,
// p95, taxa de erro) por endpoint. Em dev faz log de pedidos lentos/erros.
// Sem dependências externas — pode ligar-se depois a Sentry/Datadog se necessário.

export interface RequestSample {
  /** Método + path normalizado, ex: "GET /crm/beneficiaries". */
  key: string;
  method: string;
  url: string;
  status: number;
  ok: boolean;
  durationMs: number;
  timestamp: number;
}

export interface EndpointStats {
  key: string;
  count: number;
  errors: number;
  errorRate: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
}

const MAX_SAMPLES = 500;
// Acima deste tempo, um pedido é considerado lento (alinhado com o threshold
// local de p95 < 3000ms definido no guia de carga do projecto).
const SLOW_THRESHOLD_MS = 3000;

const samples: RequestSample[] = [];
type Listener = (sample: RequestSample) => void;
const listeners = new Set<Listener>();

const isDev = process.env.NODE_ENV !== 'production';

/** Remove ids/uuids/números do path para agrupar endpoints semelhantes. */
export function normalizePath(url: string): string {
  let path = url;
  try {
    // Aceita URLs absolutos e relativos.
    path = new URL(url, 'http://x').pathname;
  } catch {
    /* mantém url tal como veio */
  }
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

export function recordRequest(sample: RequestSample): void {
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) samples.shift();

  for (const l of listeners) l(sample);

  if (isDev) {
    if (!sample.ok) {
      console.warn(
        `[perf] ${sample.key} → ${sample.status} em ${Math.round(sample.durationMs)}ms`,
      );
    } else if (sample.durationMs > SLOW_THRESHOLD_MS) {
      console.warn(
        `[perf] LENTO ${sample.key} → ${Math.round(sample.durationMs)}ms (> ${SLOW_THRESHOLD_MS}ms)`,
      );
    }
  }
}

export function onRequest(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

/** Agregados por endpoint — útil para um painel de debug ou export. */
export function getStats(): EndpointStats[] {
  const byKey = new Map<string, RequestSample[]>();
  for (const s of samples) {
    const arr = byKey.get(s.key) ?? [];
    arr.push(s);
    byKey.set(s.key, arr);
  }

  return [...byKey.entries()]
    .map(([key, arr]) => {
      const durations = arr.map((s) => s.durationMs).sort((a, b) => a - b);
      const errors = arr.filter((s) => !s.ok).length;
      const sum = durations.reduce((a, b) => a + b, 0);
      return {
        key,
        count: arr.length,
        errors,
        errorRate: arr.length ? errors / arr.length : 0,
        avgMs: arr.length ? sum / arr.length : 0,
        p95Ms: percentile(durations, 95),
        maxMs: durations.length ? durations[durations.length - 1] : 0,
      };
    })
    .sort((a, b) => b.avgMs - a.avgMs);
}

export function getSamples(): readonly RequestSample[] {
  return samples;
}

export function resetMetrics(): void {
  samples.length = 0;
}

// Expõe no window em dev para inspecção rápida na consola: __innovaPerf.getStats()
if (isDev && typeof window !== 'undefined') {
  (window as unknown as { __innovaPerf?: unknown }).__innovaPerf = {
    getStats,
    getSamples,
    resetMetrics,
  };
}
