// hooks/useAutoDismiss.ts
// Chama `onClose` uma vez, `ms` depois de montar. Extraído de 3 componentes
// `Toast` locais que reimplementavam o mesmo useEffect+setTimeout.

'use client';

import { useEffect } from 'react';
import { useLatest } from '@/hooks/useLatest';

export function useAutoDismiss(onClose: () => void, ms = 3500) {
  // Ref para o último `onClose`: o timer arma-se uma vez por montagem mas
  // chama sempre a versão mais recente, sem closure stale.
  const onCloseRef = useLatest(onClose);

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), ms);
    return () => clearTimeout(t);
  }, [ms, onCloseRef]);
}
