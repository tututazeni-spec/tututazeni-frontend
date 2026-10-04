// components/leave/useEmployeeOptions.ts
// Lista de colaboradores para os pickers do módulo Leave (modais de férias,
// licença e ausência). Só consulta quando `enabled` — um COLABORADOR não
// escolhe outra pessoa, por isso não dispara o pedido.

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

/** POST /leave só aceita `userId` de outrem a estes perfis (assertCanAccess no controller). */
export const CAN_PICK_EMPLOYEE_LEAVE = ['ADMIN', 'RH', 'GESTOR'];
/** POST /leave/absences aceita também líderes e directores (dentro do seu âmbito). */
export const CAN_PICK_EMPLOYEE_ABSENCE = [
  'ADMIN',
  'RH',
  'GESTOR',
  'DIRECTOR',
  'LIDER',
];

export function useEmployeeOptions(picker: string, enabled: boolean) {
  const params = { limit: 100 };
  const q = useApiQuery<{ data: Array<{ id: number; name: string }> }>(
    queryKeys.employees.list({ picker, ...params }),
    '/employees',
    { params, staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  return (q.data?.data ?? []).map((e) => ({
    value: String(e.id),
    label: e.name,
  }));
}
