// lib/roles.ts
// Fonte única de verdade do lado do frontend para papéis e filtro por role.
//
// Antes desta migração, components/Sidebar.tsx e app/(platform)/dashboard/page.tsx
// definiam cada um o seu próprio `type Role` e a sua própria lógica de
// map+filter, sem nada a garantir que ficavam sincronizados entre si nem com o
// backend — a mesma classe de bug já apanhada uma vez no dashboard (GESTOR
// esquecido num array local de roles). Ver memory
// project_innova_component_separation_audit e project_innova_role_array_drift.
//
// Espelha src/auth/enums/role.enum.ts (backend) — comparar sempre com esse
// ficheiro antes de alargar esta lista, e nunca adivinhar um valor novo.

export type Role =
  | 'ADMIN'
  | 'RH'
  | 'GESTOR'
  | 'LIDER'
  | 'COLABORADOR'
  | 'INSTRUCTOR'
  | 'DIRECTOR'
  | 'AUDITOR';

/** Espelha AUTHENTICATED_ROLES em src/auth/enums/role.enum.ts. */
export const AUTHENTICATED_ROLES: readonly Role[] = [
  'COLABORADOR',
  'LIDER',
  'GESTOR',
  'RH',
  'ADMIN',
  'INSTRUCTOR',
  'DIRECTOR',
  'AUDITOR',
];

/** Espelha MGMT_ROLES em src/dashboard/dashboard.controller.ts. */
export const MGMT_ROLES: readonly Role[] = ['ADMIN', 'RH', 'LIDER', 'GESTOR'];

/** Espelha ADMIN_ROLES em src/dashboard/dashboard.controller.ts. */
export const ADMIN_ROLES: readonly Role[] = ['ADMIN', 'RH'];

/**
 * Todos os papéis autenticados excepto COLABORADOR. Para separadores/links
 * que um pedido do utilizador pede para esconder só de COLABORADOR, mesmo
 * quando o endpoint por trás tem uma @Roles() mais restrita no backend (ex.:
 * dashboard de competências é ADMIN/RH no backend, mas o pedido foi só
 * esconder de COLABORADOR) — não presumir que esta lista espelha um guard
 * exacto do backend antes de a reutilizar.
 */
export const NON_COLABORADOR_ROLES: readonly Role[] = AUTHENTICATED_ROLES.filter(
  (r) => r !== 'COLABORADOR',
);

/**
 * Espelha EVAL_CREATOR_ROLES em src/assessments/assessments.controller.ts:
 * quem pode criar/gerir avaliações formais (tudo excepto COLABORADOR e
 * AUDITOR, que só vêem e participam).
 */
export const EVAL_CREATOR_ROLES: readonly Role[] = AUTHENTICATED_ROLES.filter(
  (r) => r !== 'COLABORADOR' && r !== 'AUDITOR',
);

export interface RoleRestricted {
  /** Omitido/vazio = sem @Roles() no endpoint principal → visível a todos. */
  roles?: readonly Role[];
}

/**
 * Verdadeiro se `role` tem acesso a um item.
 * - `itemRoles` omitido/vazio → sem restrição, visível a todos.
 * - `role` undefined (ainda a carregar após login/reload) → deixa passar,
 *   para não esconder e voltar a mostrar itens no primeiro render.
 */
export function isRoleAllowed(
  itemRoles: readonly Role[] | undefined,
  role: Role | undefined,
): boolean {
  if (!itemRoles || itemRoles.length === 0) return true;
  if (!role) return true;
  return itemRoles.includes(role);
}

/** Filtra uma lista de itens (nav, tabs, ...) pelos visíveis para `role`. */
export function filterByRole<T extends RoleRestricted>(
  items: T[],
  role: Role | undefined,
): T[] {
  return items.filter((item) => isRoleAllowed(item.roles, role));
}

/**
 * Filtra secções de navegação (label + items), removendo secções que ficam
 * sem nenhum item visível. Usado pelo Sidebar.
 */
export function filterNavSections<
  T extends RoleRestricted,
  S extends { items: T[] },
>(sections: S[], role: Role | undefined): S[] {
  return sections
    .map((section) => ({
      ...section,
      items: filterByRole(section.items, role),
    }))
    .filter((section) => section.items.length > 0);
}
