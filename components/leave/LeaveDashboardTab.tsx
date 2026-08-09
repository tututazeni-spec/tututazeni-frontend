// components/leave/LeaveDashboardTab.tsx
// Separador "Dashboard RH" — KPIs, distribuição por tipo e evolução
// mensal. Puramente apresentacional. Extraído de
// app/(platform)/leave/page.tsx.

import {
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingDown,
  Users,
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import { MonthlyChart } from './MonthlyChart';
import type { DashboardData, LeaveType } from './types';

export interface LeaveDashboardTabProps {
  dashboard: DashboardData | null;
  loading: boolean;
  leaveTypes: LeaveType[];
}

export function LeaveDashboardTab({
  dashboard,
  loading,
  leaveTypes,
}: LeaveDashboardTabProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <BarChart3 size={48} className="mb-4 opacity-30" />
        <p>Dashboard não disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Pendentes"
          value={dashboard.kpis.pending}
          icon={Clock}
          color="amber"
        />
        <KpiCard
          label="Aprovados"
          value={dashboard.kpis.approved}
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          label="Ausentes Hoje"
          value={dashboard.kpis.activeNow}
          icon={Users}
          color="blue"
        />
        <KpiCard
          label="Dias Perdidos"
          value={dashboard.kpis.totalWorkDays}
          icon={TrendingDown}
          color="violet"
          sub="no ano"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Por tipo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            Distribuição por Tipo
          </h3>
          <div className="space-y-3">
            {dashboard.byType.map((t) => {
              const total = dashboard.kpis.totalWorkDays || 1;
              const pct = Math.round((t.days / total) * 100);
              const lt = leaveTypes.find((l) => l.code === t.code);
              return (
                <div key={t.code}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{t.name}</span>
                    <span className="text-gray-400">
                      {t.days} dias ({t.count} pedidos)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: lt?.color ?? '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <MonthlyChart data={dashboard.byMonth} />
      </div>
    </div>
  );
}
