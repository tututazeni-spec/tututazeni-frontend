// hooks/useLatest.ts
// Ref que aponta sempre para o último valor recebido. Permite a um efeito
// (ou timer/listener) chamar a versão mais recente de um callback sem o pôr
// nas dependências — evita closures stale sem desligar exhaustive-deps.

'use client';

import { useEffect, useRef } from 'react';

export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
