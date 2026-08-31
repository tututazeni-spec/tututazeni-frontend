// components/enrollments/enrollData.ts
// Fontes de dados partilhadas pelas modais de matrícula da aba "Gestão (Admin)"
// (EnrollUserModal + BulkEnrollModal): catálogo de cursos para o picker,
// lista de departamentos para o filtro em massa e pesquisa no diretório
// interno de colaboradores. Todos os hooks aceitam `enabled` para não
// dispararem pedidos enquanto a modal está fechada.

'use client';

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { DirectoryUser } from '@/components/users/types';

export type { DirectoryUser };

export interface Option {
  value: string;
  label: string;
}

// GET /courses e GET /departments devolvem { data, meta } (pagination.helper).
interface Paginated<T> {
  data: T[];
}

/** Catálogo enxuto de cursos para o Combobox (até 100, ordenados por criação desc). */
export function useCourseOptions(enabled = true) {
  const params = { limit: 100 };
  const query = useApiQuery<Paginated<{ id: number; title: string }>>(
    queryKeys.courses.list({ picker: 'enroll', ...params }),
    '/courses',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.title,
  }));
  return { options, loading: query.isLoading };
}

/** Departamentos activos para o filtro da matrícula em massa. */
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<Paginated<{ id: number; name: string }>>(
    queryKeys.departments.list({ picker: 'enroll', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));
  return { options, loading: query.isLoading };
}

/**
 * Pesquisa no diretório interno (GET /users/directory), com debounce no termo.
 * `departmentId` vazio = todos. Só corre quando `enabled` (modal aberta).
 */
export function useDirectoryUsers(
  rawSearch: string,
  departmentId: string,
  enabled = true,
) {
  const search = useDebounce(rawSearch);
  const params = {
    search: search || undefined,
    departmentId: departmentId || undefined,
  };
  const query = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory(search, departmentId),
    '/users/directory',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
      enabled,
    },
  );
  return { users: query.data ?? [], loading: query.isLoading };
}
