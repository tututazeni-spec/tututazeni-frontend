// components/SessionIdleWatcher.tsx
// Componente sem UI, montado no layout das páginas autenticadas
// (app/(platform)/layout.tsx). Liga lib/sessionActivity.ts ao ciclo de vida
// React — nunca em app/layout.tsx (que também envolve /login e /health, onde
// não faz sentido nenhum contar inactividade nem tentar renovar sessão).
'use client';

import { useEffect } from 'react';
import { startSessionIdleWatcher } from '@/lib/sessionActivity';

export default function SessionIdleWatcher() {
  useEffect(() => startSessionIdleWatcher(), []);
  return null;
}
