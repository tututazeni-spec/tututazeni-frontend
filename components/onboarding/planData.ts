// components/onboarding/planData.ts
// Fontes de dados partilhadas pela gestão de planos de onboarding
// (PlansView + AssignPlanModal): catálogo de templates para o picker,
// lista de departamentos para o filtro e pesquisa no diretório interno de
// colaboradores. Mesmo padrão de components/enrollments/enrollData.ts —
// módulo-local, todos os hooks aceitam `enabled` para não dispararem
// pedidos enquanto a modal está fechada.

'use client';

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { DirectoryUser } from '@/components/users/types';
import type { OnboardingTemplate } from './types';

export type { DirectoryUser };

export interface Option {
  value: string;
  label: string;
}

// GET /departments devolve { data, meta } (pagination.helper); GET
// /onboarding/templates devolve um array simples.

/** Templates activos para o Combobox da atribuição de plano. */
export function useTemplateOptions(enabled = true) {
  const query = useApiQuery<OnboardingTemplate[]>(
    queryKeys.onboarding.templates(),
    '/onboarding/templates',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data ?? [])
    .filter((t) => t.active)
    .map((t) => ({ value: String(t.id), label: t.name }));
  return { options, loading: query.isLoading };
}

/** Departamentos activos para o filtro da lista de planos. */
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list({ picker: 'onboarding-plans', ...params }),
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
 * Pesquisa no diretório interno (GET /users/directory), com debounce no
 * termo. Só corre quando `enabled` (modal aberta e sem colaborador escolhido).
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
