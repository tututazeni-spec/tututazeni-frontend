// components/development-plans/planData.ts
// Fontes de dados do CreatePlanWizard: pesquisa no diretório interno de
// colaboradores (para "Colaborador"/"Gestor"), catálogo de competências (para
// a secção "Competências") e ciclos de avaliação (para "Ciclo do PDI").
// Mesmo padrão de components/onboarding/planData.ts — módulo-local, todos os
// hooks aceitam `enabled` para não dispararem pedidos com a modal fechada.

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

/**
 * Pesquisa no diretório interno (GET /users/directory), com debounce no
 * termo. Só corre quando `enabled` (secção aberta e sem colaborador escolhido).
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

/** Catálogo de competências (para o picker da secção "Competências"). */
export function useCompetencyOptions(enabled = true) {
  const query = useApiQuery<{ data: { id: number; name: string }[] }>(
    ['development-plans', 'competencies-picker'],
    '/competencies',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  return { options, loading: query.isLoading };
}

/** Catálogo de cursos (para o picker "Curso associado" nas acções tipo COURSE). */
export function useCourseOptions(enabled = true) {
  const params = { limit: 100 };
  const query = useApiQuery<{ data: { id: number; title: string }[] }>(
    ['development-plans', 'courses-picker', params],
    '/courses',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.title,
  }));
  return { options, loading: query.isLoading };
}

/** Ciclos de avaliação (para "Ciclo do PDI" / ligação à avaliação de origem). */
export function useCycleOptions(enabled = true) {
  const query = useApiQuery<{ id: number; name: string }[]>(
    ['development-plans', 'cycles-picker'],
    '/performance/cycles',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  return { options, loading: query.isLoading };
}
