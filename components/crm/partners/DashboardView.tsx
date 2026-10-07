// components/crm/partners/DashboardView.tsx
// Separador "Dashboard" — GET /crm/partners/dashboard, só ADMIN/RH/GESTOR.
// Endpoint já existia no backend sem UI.

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatKz } from '@/lib/format';
import {
  DistributionList,
  ListSkeleton,
  ErrorBanner,
  SummaryCard,
  formatDate,
} from '@/components/crm/shared';
import type { PartnerDashboard } from './types';

interface DashboardViewProps {
  dashboard: PartnerDashboard | undefined;
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

  const { totals, satisfaction, distributions, recentInteractions } = dashboard;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Dashboard — Parceiros
          </h1>
          <p className="font-body text-ink-muted">Visão geral do CRM</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/partners/expiring-contracts">
            <Button intent="secondary">Contratos a expirar</Button>
          </Link>
          <Link href="/crm/partners/overdue-milestones">
            <Button intent="secondary">Milestones em atraso</Button>
          </Link>
          <Link href="/crm/partners/report">
            <Button intent="secondary">Relatório por período</Button>
          </Link>
          <Link href="/crm/partners">
            <Button intent="secondary">← Lista</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total"
          value={String(totals.total)}
          color="text-ink"
        />
        <SummaryCard
          label="Novos este mês"
          value={String(totals.newThisMonth)}
          color="text-primary"
        />
        <SummaryCard
          label="Activos"
          value={String(totals.active)}
          color="text-success-ink"
        />
        <SummaryCard
          label="Valor total anual"
          value={formatKz(totals.totalValueAOA)}
          color="text-ink"
        />
        <SummaryCard
          label="Contratos a expirar (30d)"
          value={String(totals.expiringContracts)}
          color="text-warning-ink"
        />
        <SummaryCard
          label="Milestones em atraso"
          value={String(totals.overdueMilestones)}
          color="text-danger-ink"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DistributionList
          title="Por tipo"
          data={distributions.byType}
          labelKey="type"
        />
        <DistributionList
          title="Por nível"
          data={distributions.byTier}
          labelKey="tier"
        />
        <DistributionList
          title="Por estado"
          data={distributions.byStatus}
          labelKey="status"
        />
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="font-body text-sm font-semibold text-ink">
            Satisfação média: {satisfaction ? satisfaction.toFixed(1) : '—'}/5
          </h3>
        </div>
        <div className="overflow-hidden">
          <table className="w-full font-body text-sm">
            <thead className="bg-[#0F1F3D] text-white uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Assunto
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Parceiro
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Responsável
                </th>
                <th className="px-4 py-3 text-left font-medium text-xs">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentInteractions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-ink-faint"
                  >
                    Sem interacções recentes
                  </td>
                </tr>
              ) : (
                recentInteractions.map((it) => (
                  <tr
                    key={it.id}
                    className="hover:bg-surface-sunken transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-ink">
                      {it.subject}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {it.partner.name}{' '}
                      <span className="font-mono text-primary">
                        ({it.partner.code})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {it.user?.fullName || '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {formatDate(it.date)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
