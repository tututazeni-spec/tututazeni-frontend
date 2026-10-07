'use client';

import { PillNav } from '@/components/ui/PillTabs';
import {
  Banknote,
  BarChart3,
  Calculator,
  CalendarRange,
  Coins,
  Gift,
  GitCompare,
  LayoutDashboard,
  Lock,
  MessageSquareWarning,
  Percent,
  PieChart,
  PlayCircle,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { RunListView } from '@/components/payroll/RunListView';
import { RunDetailView } from '@/components/payroll/RunDetailView';
import { PayslipListView } from '@/components/payroll/PayslipListView';
import { AdminPayslipDetailView } from '@/components/payroll/AdminPayslipDetailView';
import { CreatePayslipModal } from '@/components/payroll/CreatePayslipModal';
import { HrDashboardView } from '@/components/payroll/HrDashboardView';
import { DisputesView } from '@/components/payroll/DisputesView';
import { OverviewView } from '@/components/payroll/OverviewView';
import { EmployeesView } from '@/components/payroll/EmployeesView';
import { DeductionsView } from '@/components/payroll/DeductionsView';
import { PaymentsView } from '@/components/payroll/PaymentsView';
import { ClosureView } from '@/components/payroll/ClosureView';
import { ReportsView } from '@/components/payroll/ReportsView';
import { AnnualView } from '@/components/payslips/AnnualView';
import { CompareView } from '@/components/payslips/CompareView';
import { CompensationDetailView } from '@/components/payslips/CompensationDetailView';
import { CompensationsView } from '@/components/payslips/CompensationsView';
import { CompensationView } from '@/components/payslips/CompensationView';
import { ComponentsView } from '@/components/payslips/ComponentsView';
import { DetailView } from '@/components/payslips/DetailView';
import { ListView } from '@/components/payslips/ListView';
import { SimulateView } from '@/components/payslips/SimulateView';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';

type Nav =
  | { tab: 'overview' }
  | { tab: 'employees' }
  | { tab: 'deductions' }
  | { tab: 'payments' }
  | { tab: 'closure' }
  | { tab: 'reports' }
  | { tab: 'runs'; view: 'list' }
  | { tab: 'runs'; view: 'detail'; runId: number }
  | { tab: 'payslips'; view: 'list' }
  | { tab: 'payslips'; view: 'detail'; payslipId: number }
  | { tab: 'dashboard' }
  | { tab: 'disputes' }
  // Ex-módulo /payslips (autosserviço do colaborador + catálogo salarial),
  // integrado como separadores do Payroll — ver docs/payroll.md §6.
  | { tab: 'my'; view: 'list' }
  | { tab: 'my'; view: 'detail'; payslipId: number }
  | { tab: 'compare' }
  | { tab: 'simulate' }
  | { tab: 'annual' }
  | { tab: 'compensation' }
  | { tab: 'components' }
  | { tab: 'compensations'; view: 'list' }
  | { tab: 'compensations'; view: 'detail'; userId: number };

const TABS: Array<{
  id: Nav['tab'];
  label: string;
  hint?: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
}> = [
  {
    id: 'overview',
    hint: 'Resumo da folha',
    icon: LayoutDashboard,
    label: 'Visão Geral',
    adminOnly: true,
  },
  {
    id: 'runs',
    hint: 'Ciclos de processamento',
    icon: PlayCircle,
    label: 'Processamentos',
    adminOnly: true,
  },
  {
    id: 'employees',
    hint: 'Dados salariais',
    icon: Users,
    label: 'Colaboradores',
    adminOnly: true,
  },
  {
    id: 'components',
    hint: 'Componentes salariais',
    icon: Coins,
    label: 'Remunerações',
    adminOnly: true,
  },
  {
    id: 'deductions',
    hint: 'IRT e segurança social',
    icon: Percent,
    label: 'Deduções & Impostos',
    adminOnly: true,
  },
  {
    id: 'payslips',
    hint: 'Todos os recibos',
    icon: Receipt,
    label: 'Recibos de Vencimento',
    adminOnly: true,
  },
  {
    id: 'payments',
    hint: 'Transferências',
    icon: Banknote,
    label: 'Pagamentos',
    adminOnly: true,
  },
  {
    id: 'closure',
    hint: 'Encerrar o mês',
    icon: Lock,
    label: 'Fecho Salarial',
    adminOnly: true,
  },
  {
    id: 'reports',
    hint: 'Relatórios',
    icon: BarChart3,
    label: 'Relatórios',
    adminOnly: true,
  },
  {
    id: 'dashboard',
    hint: 'Indicadores de recibos',
    icon: PieChart,
    label: 'Dashboard Recibos',
    adminOnly: true,
  },
  {
    id: 'disputes',
    hint: 'Contestações',
    icon: MessageSquareWarning,
    label: 'Disputas',
    adminOnly: true,
  },
  {
    id: 'compensations',
    hint: 'Compensações da equipa',
    icon: Gift,
    label: 'Compensações',
    adminOnly: true,
  },
  {
    id: 'my',
    hint: 'Os teus recibos',
    icon: Receipt,
    label: 'Os meus recibos',
  },
  {
    id: 'compare',
    hint: 'Mês a mês',
    icon: GitCompare,
    label: 'Comparar meses',
  },
  {
    id: 'simulate',
    hint: 'Simulador de IRT',
    icon: Calculator,
    label: 'Simulador IRT',
  },
  {
    id: 'annual',
    hint: 'Totais do ano',
    icon: CalendarRange,
    label: 'Resumo anual',
  },
  {
    id: 'compensation',
    hint: 'A tua compensação',
    icon: Wallet,
    label: 'A minha compensação',
  },
];

const TITLES: Record<Nav['tab'], string> = {
  overview: 'Folha de Pagamento — Visão Geral',
  employees: 'Folha de Pagamento — Colaboradores',
  deductions: 'Folha de Pagamento — Deduções & Impostos',
  payments: 'Folha de Pagamento — Pagamentos',
  closure: 'Folha de Pagamento — Fecho Salarial',
  reports: 'Folha de Pagamento — Relatórios',
  runs: 'Folha de Pagamento — Processamentos',
  payslips: 'Folha de Pagamento — Recibos de Vencimento',
  dashboard: 'Folha de Pagamento — Dashboard RH',
  disputes: 'Folha de Pagamento — Disputas',
  my: 'Folha de Pagamento — Os meus recibos',
  compare: 'Folha de Pagamento — Comparar meses',
  simulate: 'Folha de Pagamento — Simulador IRT Angola 2026',
  annual: 'Folha de Pagamento — Resumo anual',
  compensation: 'Folha de Pagamento — A minha compensação',
  components: 'Folha de Pagamento — Remunerações',
  compensations: 'Folha de Pagamento — Compensações',
};

// Separadores com sub-vista lista/detalhe.
const LIST_TABS: ReadonlyArray<Nav['tab']> = [
  'runs',
  'payslips',
  'my',
  'compensations',
];

export default function PayrollPage() {
  const role = useCurrentRole();
  // Enquanto a role ainda não chegou (arranque pós-login/reload) tratamos
  // como não-admin — os separadores adminOnly aparecem assim que
  // /auth/me resolve.
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const visibleTabs = isAdmin ? TABS : TABS.filter((t) => !t.adminOnly);

  const [selected, setNav] = useState<Nav | null>(null);
  const nav: Nav =
    selected ?? (isAdmin ? { tab: 'overview' } : { tab: 'my', view: 'list' });
  const [creating, setCreating] = useState(false);

  const isDetail = 'view' in nav && nav.view === 'detail';

  const selectTab = (tab: Nav['tab']) => {
    if (LIST_TABS.includes(tab)) setNav({ tab, view: 'list' } as Nav);
    else setNav({ tab } as Nav);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">
          {TITLES[nav.tab]}
        </h1>
      </div>

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      {!isDetail && (
        <PillNav
          items={visibleTabs}
          value={nav.tab}
          onChange={(id) => selectTab(id as Nav['tab'])}
          label="Folha salarial"
          className="mb-6"
        />
      )}

      {isAdmin && nav.tab === 'overview' && <OverviewView />}
      {isAdmin && nav.tab === 'employees' && <EmployeesView />}
      {isAdmin && nav.tab === 'deductions' && <DeductionsView />}
      {isAdmin && nav.tab === 'payments' && <PaymentsView />}
      {isAdmin && nav.tab === 'closure' && <ClosureView />}
      {isAdmin && nav.tab === 'reports' && <ReportsView />}

      {isAdmin && nav.tab === 'runs' && nav.view === 'list' && (
        <RunListView
          onSelect={(runId) => setNav({ tab: 'runs', view: 'detail', runId })}
        />
      )}
      {isAdmin && nav.tab === 'runs' && nav.view === 'detail' && (
        <RunDetailView
          runId={nav.runId}
          onBack={() => setNav({ tab: 'runs', view: 'list' })}
        />
      )}

      {isAdmin && nav.tab === 'payslips' && nav.view === 'list' && (
        <PayslipListView
          onSelect={(payslipId) =>
            setNav({ tab: 'payslips', view: 'detail', payslipId })
          }
          onCreate={() => setCreating(true)}
        />
      )}
      {isAdmin && nav.tab === 'payslips' && nav.view === 'detail' && (
        <AdminPayslipDetailView
          payslipId={nav.payslipId}
          onBack={() => setNav({ tab: 'payslips', view: 'list' })}
        />
      )}

      {isAdmin && nav.tab === 'dashboard' && <HrDashboardView />}
      {isAdmin && nav.tab === 'disputes' && (
        <DisputesView
          onOpenPayslip={(payslipId) =>
            setNav({ tab: 'payslips', view: 'detail', payslipId })
          }
        />
      )}

      {nav.tab === 'my' && nav.view === 'list' && (
        <ListView
          onSelect={(payslipId) =>
            setNav({ tab: 'my', view: 'detail', payslipId })
          }
        />
      )}
      {nav.tab === 'my' && nav.view === 'detail' && (
        <DetailView
          payslipId={nav.payslipId}
          onBack={() => setNav({ tab: 'my', view: 'list' })}
        />
      )}
      {nav.tab === 'compare' && <CompareView />}
      {nav.tab === 'simulate' && <SimulateView />}
      {nav.tab === 'annual' && <AnnualView />}
      {nav.tab === 'compensation' && <CompensationView />}

      {isAdmin && nav.tab === 'components' && <ComponentsView />}
      {isAdmin && nav.tab === 'compensations' && nav.view === 'list' && (
        <CompensationsView
          onOpenDetail={(userId) =>
            setNav({ tab: 'compensations', view: 'detail', userId })
          }
        />
      )}
      {isAdmin && nav.tab === 'compensations' && nav.view === 'detail' && (
        <CompensationDetailView
          userId={nav.userId}
          onBack={() => setNav({ tab: 'compensations', view: 'list' })}
        />
      )}

      {creating && (
        <CreatePayslipModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            setNav({ tab: 'payslips', view: 'detail', payslipId: id });
          }}
        />
      )}
    </div>
  );
}
