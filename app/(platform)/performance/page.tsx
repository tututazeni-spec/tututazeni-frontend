'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/performance/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/performance/constants';
import { AnalyticsView } from '@/components/performance/AnalyticsView';
import { MyDashboard } from '@/components/performance/MyDashboard';
import { NineBoxView } from '@/components/performance/NineBoxView';
import { TeamView } from '@/components/performance/TeamView';
import type { View } from '@/components/performance/types';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function PerformancePage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="font-body text-sm text-ink-faint mt-0.5"></p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-surface-sunken p-1 rounded-card w-fit">
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

      {view === 'dashboard' && <MyDashboard />}
      {view === 'team' && <TeamView />}
      {view === 'matrix9box' && (
        <ErrorBoundary source="performance.NineBoxView">
          <NineBoxView />
        </ErrorBoundary>
      )}
      {view === 'analytics' && <AnalyticsView />}
    </div>
  );
}
