// hooks/useTheme.ts
// Tema atual (lido do atributo data-theme do <html>, que o servidor já emitiu)
// e função para o mudar. useSyncExternalStore evita erros de hidratação: no
// servidor devolve o tema por omissão e o cliente sincroniza logo a seguir.
'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  applyTheme,
  currentTheme,
  DEFAULT_THEME,
  type Theme,
} from '@/lib/theme';

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  return () => observer.disconnect();
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const theme = useSyncExternalStore(
    subscribe,
    currentTheme,
    () => DEFAULT_THEME,
  );
  const setTheme = useCallback((t: Theme) => applyTheme(t), []);
  return { theme, setTheme };
}
