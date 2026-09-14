// components/dashboard-rh/AttendancePanel.tsx
// Painel "Presenças" — situação de hoje (check-ins, ausências, pendentes de
// aprovação). Delega em AttendanceService.getDashboard() (ver fix em
// dashboard-rh.service.ts — deixou de ler o modelo Attendance legado).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AttendanceData } from './types';

export function AttendancePanel() {
  const { data, isLoading: loading } = useApiQuery<AttendanceData>(
    queryKeys.dashboardRh.attendance(),
    '/dashboard-rh/attendance',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <p className="font-body text-xs text-ink-faint">
        Situação de hoje ({data?.date ?? '–'})
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Taxa de Presença"
          value={`${k.attendanceRate ?? 0}%`}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Presentes Agora"
          value={k.checkedInNow ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          label="Ausentes"
          value={k.totalAbsent ?? 0}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          label="Atrasos"
          value={k.totalLate ?? 0}
          intent="warning"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Férias/Baixas Pendentes"
          value={k.pendingLeaves ?? 0}
          intent="info"
          className="w-full"
        />
        <KpiCard
          label="Justificações Pendentes"
          value={k.pendingJustifications ?? 0}
          intent="info"
          className="w-full"
        />
        <KpiCard
          label="Horas-Extra Pendentes"
          value={k.pendingOvertime ?? 0}
          intent="info"
          className="w-full"
        />
      </div>
    </div>
  );
}
