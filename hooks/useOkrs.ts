// hooks/useOkrs.ts
// Extraído de app/(platform)/monitoring/okrs/page.tsx.

'use client';

import { useState, useEffect } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Cycle, Objective } from '@/components/monitoring/types';

export function useOkrs() {
  const [selectedCycle, setSelectedCycle] = useState<string>('');

  const {
    data: cycles = [],
    isLoading: loading,
    error: cyclesError,
    refetch,
  } = useApiQuery<Cycle[]>(
    queryKeys.monitoring.okrs({ kind: 'cycles' }),
    '/monitoring/okr/cycles',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // Selecciona o 1.º ciclo assim que a lista chega.
  useEffect(() => {
    if (!selectedCycle && cycles.length > 0) setSelectedCycle(cycles[0].id);
  }, [cycles, selectedCycle]);

  // Objectivos dependem do ciclo escolhido (waterfall legítimo) → enabled.
  const { data: objectives = [] } = useApiQuery<Objective[]>(
    queryKeys.monitoring.okrs({ kind: 'objectives', cycleId: selectedCycle }),
    `/monitoring/okr/cycles/${selectedCycle}/objectives`,
    { enabled: !!selectedCycle, staleTime: STALE_TIME.DYNAMIC },
  );

  return {
    cycles,
    selectedCycle,
    setSelectedCycle,
    objectives,
    loading,
    error: cyclesError?.message ?? '',
    onRetry: () => refetch(),
  };
}
