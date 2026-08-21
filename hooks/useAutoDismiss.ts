// hooks/useAutoDismiss.ts
// Chama `onClose` uma vez, `ms` depois de montar. Extraído de 3 componentes
// `Toast` locais que reimplementavam o mesmo useEffect+setTimeout.

'use client';

import { useEffect } from 'react';

export function useAutoDismiss(onClose: () => void, ms = 3500) {
  useEffect(() => {
    const t = setTimeout(onClose, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara uma única vez por montagem, independente de re-renders de `onClose`. Consequência: o React Compiler salta este hook (não há violação real das Regras do React, só não consegue verificar a omissão à volta de uma regra desligada).
  }, []);
}
