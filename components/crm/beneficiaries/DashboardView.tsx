// components/crm/beneficiaries/DashboardView.tsx
// Separador "Dashboard" — consome GET /crm/beneficiaries/dashboard (endpoint
// já existia no backend sem UI). Só ADMIN/RH/GESTOR, espelha @Roles no
// controller (ver components/Sidebar.tsx).

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  DistributionList,
  ListSkeleton,
  ErrorBanner,
  SummaryCard,
  formatDate,
} from '@/components/crm/shared';
import { Card } from '@/components/ui/Card';
import type { BeneficiaryDashboard } from './types';

interface DashboardViewProps {
  dashboard: BeneficiaryDashboard | undefined;
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
            Dashboard — Beneficiários
          </h1>
          <p className="font-body text-ink-muted">Visão geral do CRM</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/beneficiaries/follow-ups">
            <Button intent="secondary">Follow-ups</Button>
          </Link>
          <Link href="/crm/beneficiaries/report">
            <Button intent="secondary">Relatório por período</Button>
          </Link>
          <Link href="/crm/beneficiaries">
            <Button intent="secondary">← Lista</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total" value={String(totals.total)} color="text-ink" />
        <SummaryCard
          label="Novos este mês"
          value={String(totals.newThisMonth)}
          color="text-primary"
        />
        <SummaryCard label="Activos" value={String(totals.active)} color="text-success-ink" />
        <SummaryCard
          label="Follow-ups a 30 dias"
          value={String(totals.pendingFollowUps)}
          color="text-warning-ink"
        />
        <SummaryCard
          label="Necessidades em aberto"
          value={String(totals.openNeeds)}
          color="text-danger-ink"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DistributionList title="Por tipo" data={distributions.byType} labelKey="type" />
        <DistributionList title="Por estado" data={distributions.byStatus} labelKey="status" />
        <DistributionList
          title="Por província"
          data={distributions.byProvince}
          labelKey="province"
        />
      </div>

      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="font-body text-sm font-semibold text-ink">
            Satisfação média: {satisfaction ? satisfaction.toFixed(1) : '—'}/5
          </h3>
        </div>
        <div className="divide-y divide-border">
          {recentInteractions.length === 0 ? (
            <p className="p-4 font-body text-ink-faint">Sem interacções recentes</p>
          ) : (
            recentInteractions.map((it) => (
              <div key={it.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-body text-sm font-medium text-ink">{it.subject}</p>
                  <p className="font-body text-xs text-ink-muted">
                    {it.beneficiary.fullName} ({it.beneficiary.code})
                    {it.user?.fullName ? ` · ${it.user.fullName}` : ''}
                  </p>
                </div>
                <span className="font-body text-xs text-ink-faint">{formatDate(it.date)}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
