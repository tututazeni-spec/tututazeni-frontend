'use client';
// components/product/UsageTracker.tsx
//
// Regista um evento `page_view` por mudança de ecrã, para a análise de
// utilização em /feedback. Só envia o caminho (ids trocados por :id no backend),
// nunca conteúdo. Falhas são silenciosas: medir nunca pode atrapalhar o utilizador.

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

export function UsageTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    apiClient
      .post('/product-experience/track', { event: 'page_view', path: pathname })
      .catch(() => undefined);
  }, [pathname]);

  return null;
}
