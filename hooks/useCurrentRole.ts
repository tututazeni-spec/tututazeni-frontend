// hooks/useCurrentRole.ts
// Papel do utilizador autenticado, já com o cast para o union `Role`.
//
// Antes desta hook, ~16 ficheiros repetiam a mesma linha:
//   const role = currentUser?.role?.name as Role | undefined;
// sempre a partir de useCurrentUser(). Centralizar o cast evita que uma
// mude de forma (ex.: passar a ler de `role.code`) sem as outras.

'use client';

import { useCurrentUser } from './useCurrentUser';
import type { Role } from '../lib/roles';

/** `undefined` enquanto o utilizador ainda não carregou (pós-login/reload). */
export function useCurrentRole(): Role | undefined {
  const { data: me } = useCurrentUser();
  return (me?.role?.name as Role | undefined) ?? undefined;
}
