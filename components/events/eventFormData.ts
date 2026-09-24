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

import { useMemo } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import type { Event } from './types';

export interface SelectOption {
  value: string;
  label: string;
}

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// Opções de evento para os pickers das abas que operam no contexto de UM
// evento seleccionado (Participantes, Programação, Locais & Logística):
// publicados/ao vivo (uso corrente) + encerrados (gestão pós-evento).
// Rascunho/cancelado ficam de fora — sem dados reais para gerir.
export function useEventPickerOptions(scope: string) {
  const { data: activeEvents } = useApiQuery<Paginated<Event>>(
    queryKeys.events.list({ picker: `${scope}-active`, limit: 100 }),
    '/events',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: endedEvents } = useApiQuery<Paginated<Event>>(
    queryKeys.events.list({ picker: `${scope}-ended`, limit: 100, status: 'ENDED' }),
    '/events',
    { params: { limit: 100, status: 'ENDED' }, staleTime: STALE_TIME.DYNAMIC },
  );
  return useMemo(() => {
    const all = [...(activeEvents?.data ?? []), ...(endedEvents?.data ?? [])];
    return all
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())
      .map((e) => ({ value: String(e.id), label: `${e.title} — ${formatDate(e.startAt)}` }));
  }, [activeEvents, endedEvents]);
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

// GET /units devolve array directo (sem paginação) — usado pelo filtro
// "Unidade" da aba Eventos (docs/events.md #2).
export function useUnitOptions(enabled = true) {
  const query = useApiQuery<{ id: number; name: string }[]>(
    queryKeys.departments.units(),
    '/units',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  const options: SelectOption[] = (query.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.name,
  }));
  return { options, loading: query.isLoading };
}
