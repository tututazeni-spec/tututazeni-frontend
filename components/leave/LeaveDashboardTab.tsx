// components/leave/LeaveDashboardTab.tsx
// Separador "Dashboard RH" — KPIs, distribuição por tipo e evolução
// mensal. Puramente apresentacional. Extraído de
// app/(platform)/leave/page.tsx. Migrado para a fundação de design: o
// KpiCard local (duplicado) passa a components/ui/KpiCard (color→intent);
// wrapper "por tipo" passa a Card; skeleton/empty state bespoke passam a
// Skeleton/EmptyState. A cor de cada tipo de licença (`leaveType.color`)
// continua dinâmica — é codificação de dados por categoria, não decoração.

import {
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingDown,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 bg-surface-sunken rounded-card"
      />
    );
  }

  if (!dashboard) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Dashboard não disponível"
        description="Ainda não há dados suficientes para gerar o dashboard."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Pendentes"
          value={dashboard.kpis.pending}
          icon={Clock}
          intent="warning"
        />
        <KpiCard
          label="Aprovados"
          value={dashboard.kpis.approved}
          icon={CheckCircle2}
          intent="success"
        />
        <KpiCard
          label="Ausentes Hoje"
          value={dashboard.kpis.activeNow}
          icon={Users}
          intent="primary"
        />
        <KpiCard
          label="Dias Perdidos"
          value={dashboard.kpis.totalWorkDays}
          icon={TrendingDown}
          intent="accent"
          sub="no ano"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Por tipo */}
        <Card className="p-5">
          <h3 className="font-body text-sm font-semibold text-ink mb-4">
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
                    <span className="font-medium text-ink-muted">{t.name}</span>
                    <span className="text-ink-faint">
                      {t.days} dias ({t.count} pedidos)
                    </span>
                  </div>
                  <div className="h-2 bg-surface-sunken rounded-pill overflow-hidden">
                    <div
                      className="h-full rounded-pill"
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
        </Card>

        <MonthlyChart data={dashboard.byMonth} />
      </div>
    </div>
  );
}
