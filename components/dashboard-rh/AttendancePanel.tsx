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
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
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
        itemClassName="h-28 rounded-2xl bg-surface-sunken"
      />
    );

  const k = data?.kpis ?? {};

  return (
    <div className="space-y-5">
      <p className="font-body text-xs text-ink-faint">
        Situação de hoje ({data?.date ?? '–'})
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3">
          <GaugeChart
            value={k.attendanceRate ?? 0}
            label="Taxa de Presença"
            thresholds={{ warning: 90, danger: 75 }}
            size={120}
          />
        </div>
        <TopBarKpiCard
          icon={UserCheck}
          label="Presentes Agora"
          value={k.checkedInNow ?? 0}
          tone="green"
        />
        <TopBarKpiCard
          icon={UserX}
          label="Ausentes"
          value={k.totalAbsent ?? 0}
          tone="red"
        />
        <TopBarKpiCard
          icon={AlarmClock}
          label="Atrasos"
          value={k.totalLate ?? 0}
          tone="gold"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TopBarKpiCard
          icon={CalendarClock}
          label="Férias/Baixas Pendentes"
          value={k.pendingLeaves ?? 0}
          tone="blue"
        />
        <TopBarKpiCard
          icon={FileCheck}
          label="Justificações Pendentes"
          value={k.pendingJustifications ?? 0}
          tone="blue"
        />
        <TopBarKpiCard
          icon={Hourglass}
          label="Horas-Extra Pendentes"
          value={k.pendingOvertime ?? 0}
          tone="blue"
        />
      </div>
    </div>
  );
}

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </div>
    </div>
  );
}
