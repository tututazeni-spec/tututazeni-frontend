'use client';

// Erros que os Error Boundaries do React não apanham: exceções em handlers de
// eventos / timers (window 'error') e promessas rejeitadas sem catch
// ('unhandledrejection'). Sem isto, estas falhas nunca chegam ao reportError.

import { useEffect } from 'react';
import { reportError } from '@/lib/errorReporting';

export function GlobalErrorHandlers() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      // "ResizeObserver loop..." é ruído benigno do browser.
      if (e.message?.startsWith('ResizeObserver loop')) return;
      reportError(e.error ?? e.message, {
        source: 'window.error',
        file: e.filename,
        line: e.lineno,
      });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      // Pedidos cancelados (navegação) não são falhas.
      if (reason instanceof DOMException && reason.name === 'AbortError')
        return;
      reportError(reason, { source: 'window.unhandledrejection' });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
