// components/competencies/modelFormData.ts
// Fontes de dados partilhadas pelos formulários da aba "Modelos de
// Competências" (§4, Fase 2): departamentos para o filtro/formulário do
// modelo e competências para o picker de itens. Mesmo padrão de
// components/onboarding/planData.ts — módulo-local, hooks aceitam
// `enabled` para não disparar pedidos com a modal fechada.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

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
