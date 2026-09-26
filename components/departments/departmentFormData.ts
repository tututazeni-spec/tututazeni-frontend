// components/departments/departmentFormData.ts
// Fontes de dados do CreateDepartmentModal: pesquisa no diretório interno de
// colaboradores (para "Responsável"/"Gestor directo") e lista de unidades
// (para "Unidade/empresa"). Módulo-local, mesmo padrão de
// components/development-plans/planData.ts.

'use client';

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { DirectoryUser } from '@/components/users/types';

export type { DirectoryUser };

export interface UnitOption {
  id: number;
  name: string;
  code: string;
}

/**
 * Pesquisa no diretório interno (GET /users/directory), com debounce no
 * termo. Só corre quando `enabled` (picker aberto e sem utilizador escolhido).
 *
 * Quando o termo é puramente numérico, é tratado como ID de colaborador em
 * vez de nome — /users/directory não pesquisa por ID, por isso vai-se
 * directo a GET /users/:id (mesmo padrão do useEntityLookup em DetailView),
 * para que "por nome e por ID" funcione num único campo.
 */
export function useDirectoryUsers(rawSearch: string, enabled = true) {
  const search = useDebounce(rawSearch);
  const trimmed = search.trim();
  const asId = /^\d+$/.test(trimmed) ? Number(trimmed) : null;

  const nameQuery = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(search),
    '/users/directory',
    {
      params: { search: search || undefined },
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
      enabled: enabled && asId === null,
    },
  );
  const idQuery = useApiQuery<DirectoryUser>(
    queryKeys.users.detail(asId ?? 0),
    `/users/${asId ?? 0}`,
    { enabled: enabled && asId !== null, retry: false, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (asId !== null) {
    const users = idQuery.data ? [idQuery.data] : [];
    return { users, loading: idQuery.isLoading || idQuery.isFetching };
  }

  const users = (nameQuery.data ?? []).filter(
    (u): u is DirectoryUser => u != null && u.id != null,
  );
  return { users, loading: nameQuery.isLoading };
}

/** Lista de unidades/filiais (GET /units) — para o Select "Unidade/empresa". */
export function useUnits(enabled = true) {
  const query = useApiQuery<UnitOption[]>(queryKeys.departments.units(), '/units', {
    staleTime: STALE_TIME.SEMI_STATIC,
    enabled,
  });
  return { units: query.data ?? [], loading: query.isLoading };
}
