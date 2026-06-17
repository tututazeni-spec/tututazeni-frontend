// hooks/useDebounce.ts
// Adia a actualização de um valor até parar de mudar por `delay` ms. Usado em
// campos de pesquisa para não disparar uma requisição por cada tecla.

'use client';

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
