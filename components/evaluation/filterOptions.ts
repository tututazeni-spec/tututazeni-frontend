// components/evaluation/filterOptions.ts
// Opções de filtro por nome (ciclo, departamento) para os separadores
// Calibração e Relatórios, em vez de pedir o ID escrito à mão. Cargo e
// unidade reutilizam usePositionOptions / useUnits.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { SelectItemOption } from '@/components/ui/Select';
import type { DepartmentNode } from '@/components/departments/types';
import type { Cycle } from './types';

/** Valor do item "sem filtro" — o Select não aceita valor vazio. */
export const ALL = 'ALL';

function flattenTree(nodes: DepartmentNode[], depth = 0): SelectItemOption[] {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

/** Ciclos de avaliação pelo nome (GET /evaluations/cycles). */
export function useCycleOptions(): SelectItemOption[] {
  const { data } = useApiQuery<{ data: Cycle[] }>(
    queryKeys.evaluation.cycles(),
    '/evaluations/cycles',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return (data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));
}

/** Departamentos pelo nome, com indentação por nível (GET /departments/tree). */
export function useDepartmentOptions(): SelectItemOption[] {
  const { data } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return flattenTree(data ?? []);
}
