// components/users/createUserData.ts
// Fontes de dados do formulário "Novo Utilizador" (docs/modulo_users.md
// Ponto 2): catálogos para os pickers de organização (departamento, cargo,
// unidade, gestor), acesso (perfil/role, permissões adicionais) e academia
// (cursos, percursos de aprendizagem, competências). Mesmo padrão
// módulo-local de components/onboarding/planData.ts e
// components/enrollments/enrollData.ts — todos os hooks aceitam `enabled`
// para não dispararem pedidos enquanto a secção não é usada.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { DirectoryUser } from '@/components/users/types';
import type { Position } from '@/components/organization/types';

export type { DirectoryUser };

export interface Option {
  value: string;
  label: string;
}

interface Paginated<T> {
  data: T[];
}

/** Departamentos activos para o Combobox de "Departamento". */
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<Paginated<{ id: number; name: string }>>(
    queryKeys.departments.list({ picker: 'create-user', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));
  return { options, loading: query.isLoading };
}

/** Unidades (filiais) para o Combobox de "Unidade". */
export function useUnitOptions(enabled = true) {
  const query = useApiQuery<{ id: number; name: string }[]>(
    queryKeys.departments.units(),
    '/units',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.name,
  }));
  return { options, loading: query.isLoading };
}

/** Cargos/posições para o Combobox de "Cargo". */
export function usePositionOptions(enabled = true) {
  const query = useApiQuery<{ data: Position[] }>(
    queryKeys.organization.positions(''),
    '/organization/positions',
    { staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.name,
  }));
  return { options, loading: query.isLoading };
}

/** Roles para o Select de "Perfil de acesso". GET /roles-permissions devolve
 *  um array simples (não paginado). */
export function useRoleOptions(enabled = true) {
  const query = useApiQuery<Array<{ id: number; name: string }>>(
    queryKeys.rolesPermissions.roles(),
    '/roles-permissions',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data ?? []).map((r) => ({
    value: String(r.id),
    label: r.name,
  }));
  return { options, loading: query.isLoading };
}

/** Catálogo de permissões para o picker de "Permissões adicionais". */
export function usePermissionOptions(enabled = true) {
  const query = useApiQuery<
    Array<{ id: number; name: string; action: string; subject: string }>
  >(queryKeys.acl.permissions(), '/acl/permissions', {
    staleTime: STALE_TIME.SEMI_STATIC,
    enabled,
  });
  const options: Option[] = (query.data ?? []).map((p) => ({
    value: String(p.id),
    label: `${p.subject} · ${p.action}`,
  }));
  return { options, loading: query.isLoading };
}

/** Catálogo de cursos para o picker de "Cursos atribuídos". */
export function useCourseOptions(enabled = true) {
  const params = { limit: 100 };
  const query = useApiQuery<Paginated<{ id: number; title: string }>>(
    queryKeys.courses.list({ picker: 'create-user', ...params }),
    '/courses',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.title,
  }));
  return { options, loading: query.isLoading };
}

/** Percursos de aprendizagem publicados — GET /users/lookups/learning-paths
 *  (sem catálogo próprio noutro módulo, ver users.service.getLearningPathLookups). */
export function useLearningPathOptions(enabled = true) {
  const query = useApiQuery<Array<{ id: number; title: string }>>(
    queryKeys.users.learningPathLookups(),
    '/users/lookups/learning-paths',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.title,
  }));
  return { options, loading: query.isLoading };
}

/** Catálogo de competências (activas) para o picker de "Competências". */
export function useCompetencyOptions(enabled = true) {
  const params = { limit: 200, status: 'ACTIVE' };
  const query = useApiQuery<{ data: Array<{ id: number; name: string }> }>(
    queryKeys.competencies.catalog({ picker: 'create-user', ...params }),
    '/competencies',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  return { options, loading: query.isLoading };
}

/**
 * Pesquisa no diretório interno (GET /users/directory), com debounce no
 * termo — usada para escolher o "Gestor direto". Só corre quando `enabled`.
 */
export function useDirectoryUsers(rawSearch: string, enabled = true) {
  const search = useDebounce(rawSearch);
  const params = { search: search || undefined };
  const query = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(search),
    '/users/directory',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const users = (query.data ?? []).filter(
    (u): u is DirectoryUser => u != null && u.id != null,
  );
  return { users, loading: query.isLoading };
}
