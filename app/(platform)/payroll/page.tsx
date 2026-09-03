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

      {!isDetail && (
        <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
          {TABS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              intent={nav.tab === t.id ? 'primary' : 'ghost'}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </Button>
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
