// components/events/eventsData.ts
// Fonte de dados partilhada pelo CreateEventModal: lista de departamentos
// para o picker de "Departamentos específicos" (restrictedDeptIds). Mesmo
// padrão de components/enrollments/enrollData.ts#useDepartmentOptions, mas
// mantido local ao módulo de eventos em vez de importar através de módulos.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// GET /departments devolve { data, meta } (pagination.helper).
interface Paginated<T> {
  data: T[];
}

export interface DepartmentOption {
  id: number;
  name: string;
}

/** Departamentos activos para o multi-select de restrição de evento. */
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<Paginated<{ id: number; name: string }>>(
    queryKeys.departments.list({ picker: 'events', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const departments: DepartmentOption[] = query.data?.data ?? [];
  return { departments, loading: query.isLoading };
}
