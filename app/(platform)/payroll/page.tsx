'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RunListView } from '@/components/payroll/RunListView';
import { RunDetailView } from '@/components/payroll/RunDetailView';
import { PayslipListView } from '@/components/payroll/PayslipListView';
import { AdminPayslipDetailView } from '@/components/payroll/AdminPayslipDetailView';
import { CreatePayslipModal } from '@/components/payroll/CreatePayslipModal';
import { HrDashboardView } from '@/components/payroll/HrDashboardView';
import { DisputesView } from '@/components/payroll/DisputesView';

type Nav =
  | { tab: 'runs'; view: 'list' }
  | { tab: 'runs'; view: 'detail'; runId: number }
  | { tab: 'payslips'; view: 'list' }
  | { tab: 'payslips'; view: 'detail'; payslipId: number }
  | { tab: 'dashboard' }
  | { tab: 'disputes' };

const TABS: Array<{ id: Nav['tab']; label: string }> = [
  { id: 'runs', label: 'Runs' },
  { id: 'payslips', label: 'Recibos' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'disputes', label: 'Disputas' },
];

const TITLES: Record<Nav['tab'], string> = {
  runs: 'Folha de Pagamento — Runs',
  payslips: 'Folha de Pagamento — Recibos',
  dashboard: 'Folha de Pagamento — Dashboard RH',
  disputes: 'Folha de Pagamento — Disputas',
};

export default function PayrollPage() {
  const [nav, setNav] = useState<Nav>({ tab: 'runs', view: 'list' });
  const [creating, setCreating] = useState(false);

  const isDetail =
    (nav.tab === 'runs' && nav.view === 'detail') ||
    (nav.tab === 'payslips' && nav.view === 'detail');

  const selectTab = (tab: Nav['tab']) => {
    if (tab === 'runs' || tab === 'payslips') setNav({ tab, view: 'list' });
    else setNav({ tab });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">{TITLES[nav.tab]}</h1>
      </div>

      {/* Tabs — formato de "cartão": cada botão é um cartão independente
          (borda + fundo branco + rounded), sem o fundo/pill de grupo
          anterior. Alinhadas horizontal e verticalmente (justify-center +
          items-center no wrapper) com largura mínima uniforme. Estado
          activo usa a mesma condição `nav.tab === t.id` de sempre para
          aplicar destaque azul (borda/fundo/texto primary). */}
      {!isDetail && (
        <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-2">
          {TABS.map((t) => (
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

      {nav.tab === 'runs' && nav.view === 'list' && (
        <RunListView onSelect={(runId) => setNav({ tab: 'runs', view: 'detail', runId })} />
      )}
      {nav.tab === 'runs' && nav.view === 'detail' && (
        <RunDetailView runId={nav.runId} onBack={() => setNav({ tab: 'runs', view: 'list' })} />
      )}

      {nav.tab === 'payslips' && nav.view === 'list' && (
        <PayslipListView
          onSelect={(payslipId) => setNav({ tab: 'payslips', view: 'detail', payslipId })}
          onCreate={() => setCreating(true)}
        />
      )}
      {nav.tab === 'payslips' && nav.view === 'detail' && (
        <AdminPayslipDetailView
          payslipId={nav.payslipId}
          onBack={() => setNav({ tab: 'payslips', view: 'list' })}
        />
      )}

      {nav.tab === 'dashboard' && <HrDashboardView />}
      {nav.tab === 'disputes' && (
        <DisputesView
          onOpenPayslip={(payslipId) => setNav({ tab: 'payslips', view: 'detail', payslipId })}
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