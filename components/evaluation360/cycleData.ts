// components/evaluation360/cycleData.ts
// Fonte de dados partilhada por CreateCycleModal (departamentos para o
// multi-select de distribuição em massa, addParticipantsByDepartment) e
// EvaluationCyclesTab (filtros Departamento/Unidade/Cargo da aba
// "Avaliações 360°", docs/evaluation360.md §2). Mesmo padrão de hook local
// por módulo já usado em components/{enrollments,onboarding,payroll}/*Data.ts.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

export interface Option {
  value: string;
  label: string;
}

interface Paginated<T> {
  data: T[];
}

/** Departamentos activos para o multi-select de "Criar e Distribuir". */
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<Paginated<{ id: number; name: string }>>(
    queryKeys.departments.list({ picker: 'evaluation360', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: Option[] = (query.data?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));
  return { options, loading: query.isLoading };
}

interface Unit {
  id: number;
  name: string;
}

interface Position {
  id: number;
  name: string;
}

/** Unidades para o filtro "Unidade" da aba "Avaliações 360°"
 *  (docs/evaluation360.md §2) — mesma fonte que
 *  components/departments/departmentFormData.ts#useUnitOptions. */
export function useUnitOptions(enabled = true) {
  const query = useApiQuery<Unit[]>(queryKeys.departments.units(), '/units', {
    staleTime: STALE_TIME.STATIC,
    enabled,
  });
  const options: Option[] = (query.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.name,
  }));
  return { options, loading: query.isLoading };
}

/** Cargos para o filtro "Cargo" da aba "Avaliações 360°"
 *  (docs/evaluation360.md §2) — mesma fonte que
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
