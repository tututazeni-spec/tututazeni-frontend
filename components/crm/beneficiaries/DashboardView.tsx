// components/crm/beneficiaries/DashboardView.tsx
// Separador "Dashboard" — consome GET /crm/beneficiaries/dashboard (endpoint
// já existia no backend sem UI). Só ADMIN/RH/GESTOR, espelha @Roles no
// controller (ver components/Sidebar.tsx).

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TopBarCard } from '@/components/ui/TopBarCard';
import { AlertTriangle, CalendarClock, CircleCheck, UserPlus, Users } from 'lucide-react';
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
            <Button intent="secondary">Acompanhamentos</Button>
          </Link>
          <Link href="/crm/beneficiaries/report">
            <Button intent="secondary">Relatório por período</Button>
          </Link>
          <Link href="/crm/beneficiaries">
            <Button intent="secondary">← Lista</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <TopBarCard
          label="Total"
          value={totals.total}
          tone="blue"
          icon={<Users className="h-6 w-6" />}
        />
        <TopBarCard
          label="Novos este mês"
          value={totals.newThisMonth}
          tone="blue"
          icon={<UserPlus className="h-6 w-6" />}
        />
        <TopBarCard
          label="Activos"
          value={totals.active}
          tone="green"
          icon={<CircleCheck className="h-6 w-6" />}
        />
        <TopBarCard
          label="Acompanhamentos a 30 dias"
          value={totals.pendingFollowUps}
          tone="gold"
          icon={<CalendarClock className="h-6 w-6" />}
        />
        <TopBarCard
          label="Necessidades em aberto"
          value={totals.openNeeds}
          tone="red"
          icon={<AlertTriangle className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <p className="p-4 font-body text-ink-faint">
              Sem interacções recentes
            </p>
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
                    {it.beneficiary.fullName} ({it.beneficiary.code})
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
  );
}
