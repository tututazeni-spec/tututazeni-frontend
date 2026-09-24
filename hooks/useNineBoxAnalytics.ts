// hooks/useNineBoxAnalytics.ts
// Matriz 9-Box (Performance x Potencial) de Avaliação 360º — dados reais de
// GET /evaluation360/analytics/nine-box (src/evaluation360/), consumida pelo
// separador "Matriz 9 Box" do módulo Planos de Desenvolvimento. Extraído de
// hooks/useEvaluation360.ts: a matriz agrega toda a organização, não é
// específica ao ecrã pessoal de 360º, por isso foi movida para junto das
// análises de PDI/equipa.

'use client';

import type { NineBoxEntry } from '@/components/development-plans/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// Espelha @Roles(ADMIN, RH) de GET /evaluation360/analytics/nine-box
// (evaluation360.controller.ts) — GESTOR não tem acesso desde que a matriz
// deixou de identificar indivíduos.
const NINE_BOX_ROLES = ['ADMIN', 'RH'];

interface RawCycle {
  id: string;
  status: string;
}

interface RawNineBoxEntry {
  performance: 'LOW' | 'MID' | 'HIGH';
  potential: 'LOW' | 'MID' | 'HIGH';
  count: number;
}

export function useNineBoxAnalytics() {
  const role = useCurrentRole();
  const canSeeNineBox = !!role && NINE_BOX_ROLES.includes(role);

  const { data: cyclesData, isLoading: cyclesLoading } = useApiQuery<{
    data: RawCycle[];
    total: number;
  }>(queryKeys.evaluation360.cycles(), '/evaluation360/cycles', {
    params: { tenantId: 'default', limit: 50 },
    enabled: canSeeNineBox,
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  const cycles = cyclesData?.data ?? [];
  // Ciclo activo: o mais recente com trabalho em curso, senão o mais recente
  // concluído/publicado, senão qualquer um (ex.: ainda em DRAFT).
  const cycle =
    cycles.find((c) => c.status === 'IN_PROGRESS') ??
    cycles.find((c) => c.status === 'COMPLETED') ??
    cycles.find((c) => c.status === 'PUBLISHED') ??
    cycles[0] ??
    null;
  const cycleId = cycle?.id;

  const { data: nineBoxData, isLoading: nineBoxLoading } = useApiQuery<RawNineBoxEntry[]>(
    queryKeys.evaluation360.nineBox(cycleId ?? ''),
    '/evaluation360/analytics/nine-box',
    {
      params: { cycleId },
      enabled: !!cycleId && canSeeNineBox,
      staleTime: STALE_TIME.DYNAMIC,
      meta: { silent: true },
    },
  );

  const nineBox: NineBoxEntry[] = (nineBoxData ?? []).map((n) => ({
    performance: n.performance,
    potential: n.potential,
    count: n.count,
  }));

  return {
    nineBox,
    canSeeNineBox,
    loading: canSeeNineBox && (cyclesLoading || nineBoxLoading),
  };
}
