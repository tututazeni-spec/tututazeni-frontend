// components/career/careerFormData.ts
// Fontes de dados auxiliares das modais de criação do módulo Carreira
// (Novo Percurso, Novo Plano, Nova Oportunidade). Mesmo padrão de
// components/payroll/runData.ts / components/onboarding/planData.ts —
// módulo-local, cada hook aceita `enabled` para só disparar o pedido
// enquanto a modal está aberta.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { JobFamily, Position } from './types';

export interface SelectOption {
  value: string;
  label: string;
}

// GET /departments devolve { data, meta } (pagination.helper).
export function useDepartmentOptions(enabled = true) {
  const params = { limit: 200, active: true };
  const query = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list({ picker: 'career', ...params }),
    '/departments',
    { params, staleTime: STALE_TIME.STATIC, enabled },
  );
  const options: SelectOption[] = (query.data?.data ?? []).map((d) => ({
    value: String(d.id),
    label: d.name,
  }));
  return { options, loading: query.isLoading };
}

export function useJobFamilyOptions(enabled = true) {
  const query = useApiQuery<JobFamily[]>(queryKeys.career.jobFamilies(), '/career/job-families', {
    staleTime: STALE_TIME.STATIC,
    enabled,
  });
  const options: SelectOption[] = (query.data ?? []).map((f) => ({
    value: String(f.id),
    label: f.code ? `${f.name} (${f.code})` : f.name,
  }));
  return { options, loading: query.isLoading };
}

export function usePositionOptions(enabled = true) {
  const query = useApiQuery<Position[]>(queryKeys.career.positions(), '/career/positions', {
    staleTime: STALE_TIME.STATIC,
    enabled,
  });
  const options: SelectOption[] = (query.data ?? []).map((p) => ({
    value: String(p.id),
    label: p.level ? `${p.name} · ${p.level}` : p.name,
  }));
  return { options, loading: query.isLoading };
}
