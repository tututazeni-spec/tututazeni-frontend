// hooks/useCurrentUser.ts
// Fonte única do utilizador autenticado (GET /auth/me), cacheada pelo React Query.
// Antes desta hook, Topbar, settings e a página de detalhe do programa académico
// faziam cada um o seu próprio fetch a /auth/me com useState/useEffect — três
// cópias independentes que podiam desincronizar (ex: editar o perfil em
// Definições não actualizava o Topbar sem reload). Consumir esta hook em vez
// disso partilha uma única entrada de cache/invalidação para todos.

'use client';

import { useApiQuery } from './useApiQuery';
import { queryKeys } from '../lib/queryKeys';
import { STALE_TIME } from '../lib/queryClient';

export interface CurrentUser {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  active: boolean;
  createdAt: string;
  role?: { name: string; code: string | null; permissions: { name: string }[] };
  unit?: { name: string };
  department?: { name: string };
  position?: { name: string; level?: string };
  profile?: { bio: string };
  points?: { points: number };
  badgeAwards?: {
    badge: { name: string; description?: string };
    awardedAt: string;
  }[];
}

export function useCurrentUser() {
  return useApiQuery<CurrentUser>(queryKeys.auth.me(), '/auth/me', {
    staleTime: STALE_TIME.SEMI_STATIC,
  });
}
