// hooks/useClockInOut.ts
// Container do widget de picagem de ponto — query do dia (para saber se já
// há um clock-in em aberto), o efeito que inicializa o estado a partir do
// servidor, e as 2 mutações (clock-in/clock-out). Extraído de ClockWidget
// em app/(platform)/attendance/page.tsx (170 linhas, misturava isto com o
// relógio ao vivo e o JSX). O relógio ao vivo (`time`, actualizado a cada
// segundo) fica na vista apresentacional — é puramente UI, não precisa de
// estar aqui; por isso a hora de entrada em `handleClockIn` é calculada
// com `new Date()` directamente em vez de reaproveitar esse estado.
// Ver memory project_innova_component_separation_audit, item 3.5.

'use client';

import { useEffect, useRef, useState } from 'react';
import { useApiMutation, useApiQuery } from './useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { MyAttendanceData } from '@/components/attendance/types';

export type ClockStatus = 'idle' | 'checked-in' | 'checked-out';

export function useClockInOut(onAction: () => void) {
  const [status, setStatus] = useState<ClockStatus>('idle');
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');

  // Verificar se já tem clock-in hoje (query cacheada).
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayData } = useApiQuery<MyAttendanceData>(
    queryKeys.attendance.my({ from: todayStr }),
    '/attendance/my',
    { params: { from: todayStr }, staleTime: STALE_TIME.DYNAMIC },
  );

  // Inicializa o estado a partir do servidor uma única vez (quando `todayData`
  // chega pela primeira vez). Antes, o guard usava `status !== 'idle'` — o
  // próprio estado que o efeito escreve — o que funciona mas é confuso: cada
  // `setStatus` disparava o efeito de novo só para sair logo a seguir. Um ref
  // dedicado tem a mesma semântica ("só inicializa uma vez") sem essa
  // dependência circular.
  const initializedFromServerRef = useRef(false);
  useEffect(() => {
    if (!todayData || initializedFromServerRef.current) return;
    initializedFromServerRef.current = true;
    const rec = todayData.records?.find((r) => {
      const d = new Date(r.date).toDateString();
      return d === new Date().toDateString() && r.context === 'WORK';
    });
    if (rec?.clockIn && !rec.clockOut) {
      setStatus('checked-in');
      setClockInTime(rec.clockIn ?? null);
    } else if (rec?.clockOut) {
      setStatus('checked-out');
      setClockInTime(rec.clockIn ?? null);
    }
  }, [todayData]);

  const clockIn = useApiMutation(
    () =>
      apiClient.post('/attendance/clock-in', {
        method: 'MANUAL',
        context: 'WORK',
        notes,
      }),
    {
      invalidateKeys: [queryKeys.attendance.all],
      onSuccess: () => {
        setStatus('checked-in');
        setClockInTime(new Date().toTimeString().slice(0, 5));
        onAction();
      },
      onError: (e) => setError(e.message),
    },
  );

  const clockOut = useApiMutation(
    () => apiClient.post('/attendance/clock-out', {}),
    {
      invalidateKeys: [queryKeys.attendance.all],
      onSuccess: () => {
        setStatus('checked-out');
        onAction();
      },
      onError: (e) => setError(e.message),
    },
  );

  const loading = clockIn.isPending || clockOut.isPending;
  const handleClockIn = () => {
    setError('');
    clockIn.mutate(undefined);
  };
  const handleClockOut = () => {
    setError('');
    clockOut.mutate(undefined);
  };

  return {
    status,
    clockInTime,
    error,
    notes,
    setNotes,
    loading,
    handleClockIn,
    handleClockOut,
  };
}
