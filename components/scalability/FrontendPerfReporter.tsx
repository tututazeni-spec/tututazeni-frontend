'use client';

// modulo_scalability.md §10 — recolha RUM: mede Web Vitals e peso dos recursos
// de cada página e envia UMA amostra quando o utilizador sai/esconde a página.

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface LayoutShiftLike extends PerformanceEntry {
  value?: number;
}

function resourceBytes(entries: PerformanceResourceTiming[], types: string[]) {
  return entries
    .filter((e) => types.includes(e.initiatorType) || /\.(js|css)(\?|$)/.test(e.name))
    .reduce((s, e) => s + (e.transferSize || 0), 0);
}

export function FrontendPerfReporter() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    const path = pathname || window.location.pathname;
    let fcp: number | undefined;
    let lcp: number | undefined;
    let inp = 0;
    let errors = 0;
    let sent = false;
    const observers: PerformanceObserver[] = [];

    const observe = (type: string, cb: (e: PerformanceEntry) => void, opts = {}) => {
      try {
        const po = new PerformanceObserver((list) => list.getEntries().forEach(cb));
        po.observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
        observers.push(po);
      } catch {
        /* tipo não suportado neste browser */
      }
    };

    observe('paint', (e) => {
      if (e.name === 'first-contentful-paint') fcp = e.startTime;
    });
    observe('largest-contentful-paint', (e) => {
      lcp = e.startTime;
    });
    // INP aproximado: maior duração de interacção observada.
    observe(
      'event',
      (e) => {
        if ((e as LayoutShiftLike & { interactionId?: number }).interactionId) {
          inp = Math.max(inp, e.duration);
        }
      },
      { durationThreshold: 40 },
    );

    const onError = () => {
      errors += 1;
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onError);

    const send = () => {
      if (sent) return;
      sent = true;
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const body = {
        path,
        ttfbMs: nav ? nav.responseStart : undefined,
        fcpMs: fcp,
        lcpMs: lcp,
        inpMs: inp || undefined,
        loadMs: nav && nav.loadEventEnd > 0 ? nav.loadEventEnd : undefined,
        jsBytes: Math.round(resourceBytes(res, ['script'])),
        cssBytes: Math.round(resourceBytes(res, ['css', 'link'])),
        imageBytes: Math.round(
          res.filter((e) => e.initiatorType === 'img').reduce((s, e) => s + (e.transferSize || 0), 0),
        ),
        requests: res.length,
        // transferSize 0 com tamanho > 0 = servido da cache do browser.
        cacheHits: res.filter((e) => e.transferSize === 0 && e.decodedBodySize > 0).length,
        errors,
      };
      // Valores NaN/negativos seriam rejeitados pelo DTO — descarta-os.
      for (const k of Object.keys(body) as (keyof typeof body)[]) {
        const v = body[k];
        if (typeof v === 'number' && (!Number.isFinite(v) || v < 0)) delete body[k];
      }
      try {
        void fetch('/api/scalability/frontend-perf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          keepalive: true,
        }).catch(() => undefined);
      } catch {
        /* telemetria nunca deve afectar a página */
      }
    };

    const onHide = () => {
      if (document.visibilityState === 'hidden') send();
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      // Navegação interna (SPA): fecha a amostra da página que sai.
      send();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onError);
      observers.forEach((o) => o.disconnect());
    };
  }, [pathname]);

  return null;
}
