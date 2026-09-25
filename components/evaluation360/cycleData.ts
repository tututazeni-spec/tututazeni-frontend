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

interface CycleOption {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

/** Selector de ciclo partilhado pelas abas "Avaliados" e "Avaliadores"
 *  (docs/evaluation360.md §4/§5) — ambas listam entidades por-ciclo
 *  (CycleParticipant/EvaluatorAssignment), sem "ciclo activo" implícito como
 *  a vista pessoal tem (hooks/useEvaluation360.ts); quem gere o módulo
 *  escolhe qual ciclo quer inspeccionar. Ordenado por createdAt desc (mesmo
 *  endpoint de EvaluationCyclesTab) — o mais recente vem primeiro. */
export function useCycleSelectorOptions(enabled = true) {
  const params = { tenantId: 'default', limit: '100' };
  const query = useApiQuery<{ data: CycleOption[]; total: number }>(
    queryKeys.evaluation360.cyclesList(params),
    '/evaluation360/cycles',
    { params, staleTime: STALE_TIME.DYNAMIC, enabled },
  );
  const cycles = query.data?.data ?? [];
  const options: Option[] = cycles.map((c) => ({ value: c.id, label: c.name }));
  return { cycles, options, loading: query.isLoading };
}
