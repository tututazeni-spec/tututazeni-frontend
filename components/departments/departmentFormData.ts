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
 */
export function useDirectoryUsers(rawSearch: string, enabled = true) {
  const search = useDebounce(rawSearch);
  const params = { search: search || undefined };
  const query = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(search),
    '/users/directory',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
      enabled,
    },
  );
  const users = (query.data ?? []).filter(
    (u): u is DirectoryUser => u != null && u.id != null,
  );
  return { users, loading: query.isLoading };
}

/** Lista de unidades/filiais (GET /units) — para o Select "Unidade/empresa". */
export function useUnits(enabled = true) {
  const query = useApiQuery<UnitOption[]>(queryKeys.departments.units(), '/units', {
    staleTime: STALE_TIME.SEMI_STATIC,
    enabled,
  });
  return { units: query.data ?? [], loading: query.isLoading };
}
