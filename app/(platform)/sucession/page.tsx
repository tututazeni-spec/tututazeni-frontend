// src/app/(dashboard)/succession/page.tsx
'use client';

import { useState } from 'react';
import { DashboardView } from '@/components/sucession/DashboardView';
import { NAV, TITLES } from '@/components/sucession/constants';
import { OrgChartView } from '@/components/sucession/OrgChartView';
import { PositionsView } from '@/components/sucession/PositionsView';
import { TalentPoolView } from '@/components/sucession/TalentPoolView';
import type { View } from '@/components/sucession/types';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function SuccessionPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Planeamento de Sucessão
          </p>
        </div>
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
      {view === 'org-chart' && (
        <ErrorBoundary source="sucession.OrgChartView">
          <OrgChartView />
        </ErrorBoundary>
      )}
      {view === 'positions' && <PositionsView />}
      {view === 'talent-pool' && <TalentPoolView />}
    </div>
  );
}
