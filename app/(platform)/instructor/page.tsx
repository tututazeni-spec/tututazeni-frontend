// src/app/(dashboard)/instructor/page.tsx
'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AtRiskView } from '@/components/instructor/AtRiskView';
import { CohortDetailView } from '@/components/instructor/CohortDetailView';
import { CohortsView } from '@/components/instructor/CohortsView';
import { NAV, TITLES } from '@/components/instructor/constants';
import { DashboardView } from '@/components/instructor/DashboardView';
import type { View } from '@/components/instructor/types';
import { Button } from '@/components/ui/Button';

export default function InstructorPage() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedCohort, setSelectedCohort] = useState<number | null>(null);

  const handleSelectCohort = (id: number) => {
    setSelectedCohort(id);
    setView('cohort-detail');
  };
  const handleBack = () => {
    setSelectedCohort(null);
    setView('cohorts');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Gestão de Instrutores
          </p>
        </div>
        {view === 'cohort-detail' && (
          <Button intent="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={14} strokeWidth={1.75} />
            Voltar
          </Button>
        )}
      </div>

      {view !== 'cohort-detail' && (
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
      )}

      {view === 'dashboard' && (
        <DashboardView onSelectCohort={handleSelectCohort} />
      )}
      {view === 'cohorts' && (
        <CohortsView onSelectCohort={handleSelectCohort} />
      )}
      {view === 'at-risk' && <AtRiskView />}
      {view === 'cohort-detail' && selectedCohort !== null && (
        <CohortDetailView cohortId={selectedCohort} onBack={handleBack} />
      )}
    </div>
  );
}
