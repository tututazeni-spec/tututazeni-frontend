// src/app/(dashboard)/career/page.tsx
'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/career/ (mesmo
// padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/career/constants';
import { DashboardView } from '@/components/career/DashboardView';
import { PathsView } from '@/components/career/PathsView';
import { PlanView } from '@/components/career/PlanView';
import { VacanciesView } from '@/components/career/VacanciesView';
import type { View } from '@/components/career/types';

export default function CareerPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Gestão de Carreira
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              view === n.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {view === 'dashboard' && <DashboardView />}
      {view === 'paths' && <PathsView />}
      {view === 'vacancies' && <VacanciesView />}
      {view === 'plan' && <PlanView />}
    </div>
  );
}
