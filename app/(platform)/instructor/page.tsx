// src/app/(dashboard)/instructor/page.tsx
'use client';

import { useState } from 'react';
import { AtRiskView } from '@/components/instructor/AtRiskView';
import { CohortDetailView } from '@/components/instructor/CohortDetailView';
import { CohortsView } from '@/components/instructor/CohortsView';
import { NAV, TITLES } from '@/components/instructor/constants';
import { DashboardView } from '@/components/instructor/DashboardView';
import type { View } from '@/components/instructor/types';

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Gestão de Instrutores
          </p>
        </div>
        {view === 'cohort-detail' && (
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            ← Voltar
          </button>
        )}
      </div>

      {view !== 'cohort-detail' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === n.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {n.label}
            </button>
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
