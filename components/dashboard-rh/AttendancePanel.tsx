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
          <GaugeChart value={k.attendanceRate ?? 0} label="Taxa de Presença" thresholds={{ warning: 90, danger: 75 }} size={120} />
        </div>
        <StatCard
          icon={UserCheck}
          label="Presentes Agora"
          value={k.checkedInNow ?? 0}
          intent="success"
        />
        <StatCard
          icon={UserX}
          label="Ausentes"
          value={k.totalAbsent ?? 0}
          intent="danger"
        />
        <StatCard
          icon={AlarmClock}
          label="Atrasos"
          value={k.totalLate ?? 0}
          intent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarClock}
          label="Férias/Baixas Pendentes"
          value={k.pendingLeaves ?? 0}
          intent="info"
        />
        <StatCard
          icon={FileCheck}
          label="Justificações Pendentes"
          value={k.pendingJustifications ?? 0}
          intent="info"
        />
        <StatCard
          icon={Hourglass}
          label="Horas-Extra Pendentes"
          value={k.pendingOvertime ?? 0}
          intent="info"
        />
      </div>
    </div>
  );
}

// Cartão estilo Udemy/MasterClass: badge de ícone colorido, número grande
// em destaque, etiqueta discreta por baixo, elevação subtil ao hover.
// Local a este painel — não substitui o KpiCard partilhado.
type StatIntent = 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const STAT_INTENT_STYLES: Record<StatIntent, { badge: string }> = {
  primary: { badge: 'bg-primary/10 text-primary' },
  info: { badge: 'bg-info/10 text-info' },
  success: { badge: 'bg-success/10 text-success' },
  warning: { badge: 'bg-warning/10 text-warning' },
  danger: { badge: 'bg-danger/10 text-danger' },
  accent: { badge: 'bg-accent/10 text-accent' },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  intent = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  intent?: StatIntent;
}) {
  const styles = STAT_INTENT_STYLES[intent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${styles.badge}`}
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 font-body text-sm font-medium text-ink-muted">{label}</p>
      {sub && <p className="mt-0.5 font-body text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}