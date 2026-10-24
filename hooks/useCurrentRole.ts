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

/**
 * `true` se o utilizador autenticado tem um dos papéis indicados.
 *
 * Substitui a linha `const x = !!role && SOME_ROLES.includes(role)` repetida em
 * ~50 componentes (cada um com o seu useCurrentRole). Enquanto o utilizador
 * ainda não carregou devolve `false` (esconde a acção); isto é o oposto de
 * isRoleAllowed(), que deixa passar para não piscar itens de navegação.
 */
export function useHasRole(allowed: readonly string[]): boolean {
  const role = useCurrentRole();
  return !!role && allowed.includes(role);
}
