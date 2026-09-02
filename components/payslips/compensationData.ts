// components/payslips/compensationData.ts
// Fontes de dados partilhadas pelas vistas da aba "Compensações" (B-3):
// catálogo de componentes activos para os pickers do editor de overrides, e
// re-export da pesquisa no diretório interno (reutiliza enrollData).
'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { SalaryComponent } from './types';

export {
  useDirectoryUsers,
  type DirectoryUser,
} from '@/components/enrollments/enrollData';

export function useSalaryComponentOptions(enabled = true) {
  const params = { active: 'true' };
  const query = useApiQuery<SalaryComponent[]>(
    queryKeys.payslips.salaryComponents({ picker: 'overrides', ...params }),
    '/payroll/components',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const list = query.data ?? [];
  const options = list.map((c) => ({
    value: c.code,
    label: `${c.code} — ${c.name} (${c.type === 'EARNING' ? 'Rendimento' : 'Desconto'})`,
  }));
  const byCode = Object.fromEntries(list.map((c) => [c.code, c])) as Record<
    string,
    SalaryComponent
  >;
  return { options, byCode, loading: query.isLoading };
}
