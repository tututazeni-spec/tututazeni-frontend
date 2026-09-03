// components/payroll/runData.ts
// Fontes de dados auxiliares da criação de um PayrollRun (CreateRunModal).
// Mesmo padrão de components/onboarding/planData.ts — módulo-local, o hook
// aceita `enabled` para não disparar o pedido enquanto a modal está fechada.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

export interface DepartmentOption {
  value: number;
  label: string;
}

// GET /departments devolve { data, meta } (pagination.helper).

/** Departamentos activos para o selector de âmbito do run. */
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list({ picker: 'payroll-run', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: DepartmentOption[] = (query.data?.data ?? []).map((d) => ({
    value: d.id,
    label: d.name,
  }));
  return { options, loading: query.isLoading };
}
