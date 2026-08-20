'use client';

import { useState } from 'react';
import { NAV, TITLES } from '@/components/organization/constants';
import { DashboardView } from '@/components/organization/DashboardView';
import { DepartmentsView } from '@/components/organization/DepartmentsView';
import { OrgChartView } from '@/components/organization/OrgChartView';
import { PositionsView } from '@/components/organization/PositionsView';
import { TimelineView } from '@/components/organization/TimelineView';
import type { View } from '@/components/organization/types';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useToast } from '@/providers/ToastProvider';

export default function OrganizationPage() {
  const notify = useToast();
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Estrutura Organizacional
          </p>
        </div>
        {view === 'departments' && (
          <Button
            size="sm"
            onClick={() =>
              notify({
                title: 'Abrir formulário de criação de departamento',
                intent: 'info',
              })
            }
          >
            + Departamento
          </Button>
        )}
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {NAV.map((n) => (
          <Button
            key={n.id}
            size="sm"
            intent={view === n.id ? 'primary' : 'ghost'}
            onClick={() => setView(n.id)}
          >
            {n.label}
          </Button>
        ))}
      </div>

      {view === 'dashboard' && <DashboardView />}
      {view === 'chart' && (
        <ErrorBoundary source="organization.OrgChartView">
          <OrgChartView />
        </ErrorBoundary>
      )}
      {view === 'departments' && <DepartmentsView />}
      {view === 'positions' && <PositionsView />}
      {view === 'timeline' && <TimelineView />}
    </div>
  );
}
