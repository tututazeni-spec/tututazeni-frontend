'use client';

import { useState } from 'react';
import { RunListView } from '@/components/payroll/RunListView';
import { RunDetailView } from '@/components/payroll/RunDetailView';

type Nav = { view: 'list' } | { view: 'detail'; runId: number };

export default function PayrollPage() {
  const [nav, setNav] = useState<Nav>({ view: 'list' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink">
          Folha de Pagamento
        </h1>
      </div>
      {nav.view === 'list' && (
        <RunListView onSelect={(runId) => setNav({ view: 'detail', runId })} />
      )}
      {nav.view === 'detail' && (
        <RunDetailView
          runId={nav.runId}
          onBack={() => setNav({ view: 'list' })}
        />
      )}
    </div>
  );
}
