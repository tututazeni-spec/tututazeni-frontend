'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/onboarding/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/onboarding/constants';
import { DashboardView } from '@/components/onboarding/DashboardView';
import { MyPlanView } from '@/components/onboarding/MyPlanView';
import { TemplatesView } from '@/components/onboarding/TemplatesView';
import type { View } from '@/components/onboarding/types';

export default function OnboardingPage() {
  const [view, setView] = useState<View>('my-plan');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Integração de Colaboradores
          </p>
        </div>
        {view === 'templates' && (
          <button
            onClick={() => alert('Abrir formulário de criação de template')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Novo template
          </button>
        )}
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

      {view === 'my-plan' && <MyPlanView />}
      {view === 'dashboard' && <DashboardView />}
      {view === 'templates' && <TemplatesView />}
    </div>
  );
}
