// src/app/(dashboard)/competencies/page.tsx
'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/competencies/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/competencies/constants';
import { CatalogView } from '@/components/competencies/CatalogView';
import { DashboardView } from '@/components/competencies/DashboardView';
import { MyProfileView } from '@/components/competencies/MyProfileView';
import { SkillMatrixView } from '@/components/competencies/SkillMatrixView';
import type { View } from '@/components/competencies/types';

export default function CompetenciesPage() {
  const [view, setView] = useState<View>('catalog');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Gestão de Competências
          </p>
        </div>
        {view === 'catalog' && (
          <button
            onClick={() => alert('Abrir formulário de criação de competência')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Nova competência
          </button>
        )}
      </div>

      {/* Tabs */}
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

      {/* Sem vista de detalhe ligada ainda — o CatalogView exige onSelect mas
          nada consome o id seleccionado neste momento. */}
      {view === 'catalog' && <CatalogView onSelect={() => {}} />}
      {view === 'my-profile' && <MyProfileView />}
      {view === 'matrix' && <SkillMatrixView />}
      {view === 'dashboard' && <DashboardView />}
    </div>
  );
}
