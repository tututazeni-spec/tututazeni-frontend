// components/crm/funders/DashboardView.tsx
// Separador "Dashboard" — GET /crm/funders/dashboard, só ADMIN/RH/GESTOR.
// Endpoint já existia no backend sem UI.

import {
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  Landmark,
  Wallet,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import {
  DistributionList,
  ListSkeleton,
  ErrorBanner,
  SummaryCard,
  formatMoney,
  formatDate,
} from '@/components/crm/shared';
import type { FunderDashboard } from './types';
import { EmptyState } from '@/components/ui/EmptyState';

interface DashboardViewProps {
  dashboard: FunderDashboard | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  onRetry: () => void;
}

export function DashboardView({
  dashboard,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: DashboardViewProps) {
  if (isLoading) return <ListSkeleton />;
  if (isError || !dashboard)
    return <ErrorBanner message={errorMessage} onRetry={onRetry} />;

  const { totals, distributions, recentDisbursements, recentInteractions } =
    dashboard;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total"
          value={String(totals.total)}
          color="text-ink"
          icon={Building2}
        />
        <SummaryCard
          label="Activos"
          value={String(totals.active)}
          color="text-success-ink"
          icon={CheckCircle2}
        />
        <SummaryCard
          label="Subvenções activas"
          value={String(totals.activeGrants)}
          color="text-primary"
          icon={Landmark}
        />
        <SummaryCard
          label="Relatórios em atraso"
          value={String(totals.overdueReports)}
          color="text-danger-ink"
          icon={AlertTriangle}
        />
        <SummaryCard
          label="Comprometido"
          value={formatMoney(totals.totalCommitted)}
          color="text-ink"
          icon={Wallet}
        />
        <SummaryCard
          label="Recebido"
          value={formatMoney(totals.totalReceived)}
          color="text-success-ink"
          icon={Banknote}
        />
        <SummaryCard
          label="Pendente"
          value={formatMoney(totals.totalPending)}
          color="text-warning-ink"
          icon={Clock}
        />
        <DonutStatCard
          label="Taxa de execução"
          value={totals.executionRate}
          sub={`${totals.executionRate.toFixed(1)}%`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DistributionList
          title="Por tipo"
          data={distributions.byType}
          labelKey="type"
        />
        <DistributionList
          title="Por estado"
          data={distributions.byStatus}
          labelKey="status"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-4 border-b border-border">
            <h3 className="font-body text-sm font-semibold text-ink">
              Desembolsos recentes
            </h3>
          </div>
          <div className="divide-y divide-border">
            {recentDisbursements.length === 0 ? (
              <EmptyState variant="inline" title="Sem desembolsos recentes" />
            ) : (
              recentDisbursements.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-ink">
                      {d.grant.title}
                    </p>
                    <p className="font-body text-xs text-ink-muted">
                      {formatMoney(d.amount)}
                      {d.createdBy?.fullName
                        ? ` · ${d.createdBy.fullName}`
                        : ''}
                    </p>
                  </div>
                  <span className="font-body text-xs text-ink-faint">
                    {formatDate(d.receivedAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b border-border">
            <h3 className="font-body text-sm font-semibold text-ink">
              Interacções recentes
            </h3>
          </div>
          <div className="divide-y divide-border">
            {recentInteractions.length === 0 ? (
              <EmptyState variant="inline" title="Sem interacções recentes" />
            ) : (
              recentInteractions.map((it) => (
                <div
                  key={it.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-ink">
                      {it.subject}
                    </p>
                    <p className="font-body text-xs text-ink-muted">
                      {it.funder.name} ({it.funder.code})
                      {it.user?.fullName ? ` · ${it.user.fullName}` : ''}
                    </p>
                  </div>
                  <span className="font-body text-xs text-ink-faint">
                    {formatDate(it.date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
