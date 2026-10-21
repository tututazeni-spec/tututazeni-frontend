// components/TabFromUrl.tsx
// Abre a aba indicada em `?tab=` ao entrar numa página de módulo — é o que faz
// funcionar os KPIs que ligam a outro módulo (ex.: /leave?tab=approvals). As
// abas montam depois da página, por isso tenta-se durante alguns segundos.

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { goToTab } from '@/lib/tabNavigation';

const RETRY_MS = 100;
const GIVE_UP_MS = 4000;

export function TabFromUrl() {
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');

  useEffect(() => {
    if (!tab) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (goToTab(tab) || Date.now() - started > GIVE_UP_MS) {
        clearInterval(timer);
      }
    }, RETRY_MS);
    return () => clearInterval(timer);
  }, [pathname, tab]);

  return null;
}
