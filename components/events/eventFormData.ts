// components/events/eventFormData.ts
// Fonte de dados auxiliar do CreateEventModal: lista de departamentos para
// o Select "Departamento" e para os checkboxes de "Departamentos elegíveis".
// Mesmo padrão de components/career/careerFormData.ts /
// components/departments/departmentFormData.ts (módulo-local, `enabled`
// só dispara o pedido enquanto a modal está aberta). "Unidade" e
// "Responsável" reutilizam useUnits/DepartmentUserPicker directamente de
// components/departments — já reutilizados cross-module (career, courses,
// evaluation).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

export interface SelectOption {
  value: string;
  label: string;
}

// GET /departments devolve { data, meta } (pagination.helper).
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list({ picker: 'events', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: SelectOption[] = (query.data?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));
  return { options, loading: query.isLoading };
}
