// components/dashboard-rh/AttendancePanel.tsx
// Painel "Presenças" — situação de hoje (check-ins, ausências, pendentes de
// aprovação). Delega em AttendanceService.getDashboard() (ver fix em
// dashboard-rh.service.ts — deixou de ler o modelo Attendance legado).

'use client';

import {
  AlarmClock,
  CalendarClock,
  FileCheck,
  Hourglass,
  UserCheck,
  UserX,
} from 'lucide-react';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { rateTone } from './rateTone';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
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
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );

  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <p className="font-body text-xs text-ink-faint">
        Situação de hoje ({data?.date ?? '–'})
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          icon={UserCheck}
          tone={rateTone(k.attendanceRate ?? 0, { warning: 90, danger: 75 })}
          label="Taxa de Presença"
          value={`${Math.round(k.attendanceRate ?? 0)}%`}
        />
        <NavyStatCard
          icon={UserCheck}
          label="Presentes Agora"
          value={k.checkedInNow ?? 0}
          tone="green"
        />
        <NavyStatCard
          icon={UserX}
          label="Ausentes"
          value={k.totalAbsent ?? 0}
          tone="red"
        />
        <NavyStatCard
          icon={AlarmClock}
          label="Atrasos"
          value={k.totalLate ?? 0}
          tone="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NavyStatCard
          icon={CalendarClock}
          label="Férias/Baixas Pendentes"
          value={k.pendingLeaves ?? 0}
          tone="blue"
        />
        <NavyStatCard
          icon={FileCheck}
          label="Justificações Pendentes"
          value={k.pendingJustifications ?? 0}
          tone="blue"
        />
        <NavyStatCard
          icon={Hourglass}
          label="Horas-Extra Pendentes"
          value={k.pendingOvertime ?? 0}
          tone="blue"
        />
      </div>
    </div>
  );
}


