'use client';

import { useState } from 'react';
import { RunListView } from '@/components/payroll/RunListView';
import { RunDetailView } from '@/components/payroll/RunDetailView';
import { PayslipListView } from '@/components/payroll/PayslipListView';
import { AdminPayslipDetailView } from '@/components/payroll/AdminPayslipDetailView';
import { CreatePayslipModal } from '@/components/payroll/CreatePayslipModal';
import { HrDashboardView } from '@/components/payroll/HrDashboardView';
import { DisputesView } from '@/components/payroll/DisputesView';
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

const TABS: Array<{ id: Nav['tab']; label: string; adminOnly?: boolean }> = [
  { id: 'runs', label: 'Runs', adminOnly: true },
  { id: 'payslips', label: 'Recibos', adminOnly: true },
  { id: 'dashboard', label: 'Dashboard', adminOnly: true },
  { id: 'disputes', label: 'Disputas', adminOnly: true },
  { id: 'components', label: 'Componentes', adminOnly: true },
  { id: 'compensations', label: 'Compensações', adminOnly: true },
  { id: 'my', label: 'Os meus recibos' },
  { id: 'compare', label: 'Comparar meses' },
  { id: 'simulate', label: 'Simulador IRT' },
  { id: 'annual', label: 'Resumo anual' },
  { id: 'compensation', label: 'A minha compensação' },
];

const TITLES: Record<Nav['tab'], string> = {
  runs: 'Folha de Pagamento — Runs',
  payslips: 'Folha de Pagamento — Recibos',
  dashboard: 'Folha de Pagamento — Dashboard RH',
  disputes: 'Folha de Pagamento — Disputas',
  my: 'Folha de Pagamento — Os meus recibos',
  compare: 'Folha de Pagamento — Comparar meses',
  simulate: 'Folha de Pagamento — Simulador IRT Angola 2026',
  annual: 'Folha de Pagamento — Resumo anual',
  compensation: 'Folha de Pagamento — A minha compensação',
  components: 'Folha de Pagamento — Componentes salariais',
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
    selected ??
    (isAdmin ? { tab: 'runs', view: 'list' } : { tab: 'my', view: 'list' });
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

      {/* Tabs — formato de "cartão": cada botão é um cartão independente
          (borda + fundo branco + rounded), sem o fundo/pill de grupo
          anterior. Alinhadas horizontal e verticalmente (justify-center +
          items-center no wrapper) com largura mínima uniforme. Estado
          activo usa a mesma condição `nav.tab === t.id` de sempre para
          aplicar destaque azul (borda/fundo/texto primary). */}
      {!isDetail && (
        <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-2">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              className={`flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
                nav.tab === t.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

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
