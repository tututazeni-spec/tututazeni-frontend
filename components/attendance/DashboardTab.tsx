// components/attendance/DashboardTab.tsx
// Separador "Visão Geral" — KPIs + listas de presentes/ausentes ao
// vivo. Extraído de app/(platform)/attendance/page.tsx.

'use client';

import { BarChart3, Calendar, Clock, FileText, Timer, TrendingUp, UserCheck, UserX, Zap } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { KpiCard } from '@/components/ui/KpiCard';
import { STATUS_CONFIG } from './constants';
import type { AttendanceStatus, DashboardData } from './types';
import type { StatusBadgeMap } from '@/lib/statusBadge';

// Construir mapa para StatusBadge usando STATUS_CONFIG
const STATUS_BADGE_MAP: StatusBadgeMap<AttendanceStatus> = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([key, cfg]) => [
    key,
    { label: cfg.label, cls: cfg.color },
  ]),
) as StatusBadgeMap<AttendanceStatus>;

interface DashboardTabProps {
  data: DashboardData | null;
  loading: boolean;
  refetch: () => void;
}

export function DashboardTab({ data, loading, refetch }: DashboardTabProps) {
  if (loading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface-sunken rounded-panel" />
        ))}
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
        <BarChart3 size={48} className="mb-4 opacity-30" />
        <p>Dashboard não disponível</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Presentes Hoje"
          value={data.kpis.totalPresent}
          icon={UserCheck}
          intent="success"
          trend={5}
        />
        <KpiCard
          label="Ausentes"
          value={data.kpis.totalAbsent}
          icon={UserX}
          intent="danger"
          trend={-3}
        />
        <KpiCard
          label="Atrasos"
          value={data.kpis.totalLate}
          icon={Clock}
          intent="warning"
        />
        <KpiCard
          label="Taxa de Presença"
          value={`${data.kpis.attendanceRate}%`}
          icon={TrendingUp}
          intent="primary"
        />
        <KpiCard
          label="Activos Agora"
          value={data.kpis.checkedInNow}
          icon={Timer}
          intent="accent"
        />
        <KpiCard
          label="Pedidos Licença"
          value={data.kpis.pendingLeaves}
          icon={Calendar}
          intent="warning"
          sub="pendentes"
        />
        <KpiCard
          label="Justificativas"
          value={data.kpis.pendingJustifications}
          icon={FileText}
          intent="warning"
          sub="pendentes"
        />
        <KpiCard
          label="Horas Extra"
          value={data.kpis.pendingOvertime}
          icon={Zap}
          intent="accent"
          sub="pendentes"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Presentes */}
        <div className="bg-surface rounded-panel border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-success" />
              <h3 className="font-semibold text-ink text-sm">Presentes</h3>
              <span className="text-xs text-ink-muted">
                ({data.presentList.length})
              </span>
            </div>
          </div>
          <div className="divide-y divide-border max-h-60 overflow-y-auto">
            {data.presentList.length === 0 && (
              <p className="px-5 py-6 text-sm text-ink-muted text-center">
                Nenhum registo
              </p>
            )}
            {data.presentList.map((p) => (
              <div
                key={p.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} />
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {p.name}
                    </p>
                    <p className="text-xs text-ink-muted">{p.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-data text-ink-muted">{p.clockIn}</p>
                  <StatusBadge
                    value={p.status as AttendanceStatus}
                    map={STATUS_BADGE_MAP}
                    variant="dot"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ausentes */}
        <div className="bg-surface rounded-panel border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-danger" />
            <h3 className="font-semibold text-ink text-sm">Ausentes</h3>
            <span className="text-xs text-ink-muted">
              ({data.absentList.length})
            </span>
          </div>
          <div className="divide-y divide-border max-h-60 overflow-y-auto">
            {data.absentList.length === 0 && (
              <p className="px-5 py-6 text-sm text-ink-muted text-center">
                Nenhuma ausência hoje
              </p>
            )}
            {data.absentList.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                <Avatar name={p.name} />
                <div>
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">{p.department}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
