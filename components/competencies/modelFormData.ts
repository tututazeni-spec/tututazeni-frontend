// components/competencies/modelFormData.ts
// Fontes de dados partilhadas pelos formulários da aba "Modelos de
// Competências" (§4, Fase 2) e pelos filtros das abas "Matriz de
// Competências" (§5) e "Avaliações" (§6): departamentos, cargos e
// competências para pickers, e pesquisa no diretório interno de
// colaboradores. Mesmo padrão de components/onboarding/planData.ts —
// módulo-local, hooks aceitam `enabled` para não disparar pedidos com a
// modal/filtro fechado.

'use client';

import { keepPreviousData } from '@tanstack/react-query';
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

/** Departamentos activos para o filtro/formulário de modelos. */
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list({ picker: 'competency-models', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));
  return { options, loading: query.isLoading };
}

/** Competências activas para o picker de itens de um modelo e para o
 *  filtro/formulário de níveis de proficiência. */
export function useCompetencyOptions(enabled = true) {
  const params = { limit: 200, status: 'ACTIVE' };
  const query = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.competencies.catalog({ picker: true, ...params }),
    '/competencies',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
  return { options, loading: query.isLoading };
}

/** Cargos/funções para os filtros das abas "Matriz de Competências" e
 *  "Avaliações" (docs/módulo_competencies.md §5/§6). Mesma fonte que
 *  components/onboarding/planData.ts#usePositionOptions. */
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

/** Pesquisa no diretório interno (GET /users/directory), com debounce no
 *  termo — filtro "Colaborador" das abas Matriz/Avaliações. Mesmo padrão
 *  que components/onboarding/planData.ts#useDirectoryUsers. */
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
