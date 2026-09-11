// components/evaluation360/cycleData.ts
// Fonte de dados do modal "Novo Ciclo" (CreateCycleModal): departamentos
// para o multi-select de distribuição em massa (addParticipantsByDepartment).
// Mesmo padrão de hook local por módulo já usado em
// components/{enrollments,onboarding,payroll}/*Data.ts.

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
