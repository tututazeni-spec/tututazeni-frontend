'use client';

// Aviso persistente de «sem ligação». Ao voltar a rede, repete as queries que
// falharam enquanto estava offline (o refetchOnReconnect do React Query só
// cobre queries obsoletas, não as que ficaram em erro).

import { useEffect, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCard } from '@/components/ui/AlertCard';

function subscribe(cb: () => void): () => void {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

export function OfflineBanner() {
  const qc = useQueryClient();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  useEffect(() => {
    if (!online) return;
    void qc.invalidateQueries({
      predicate: (q) => q.state.status === 'error',
    });
  }, [online, qc]);

  if (online) return null;
  return (
    <AlertCard
      variant="warning"
      compact
      className="mb-4"
      title="Sem ligação à internet"
      message="Os dados podem estar desactualizados; voltamos a carregá-los quando a ligação regressar."
    />
  );
}
