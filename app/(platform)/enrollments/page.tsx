'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/enrollments/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/enrollments/constants';
import { AdminView } from '@/components/enrollments/AdminView';
import { ComplianceView } from '@/components/enrollments/ComplianceView';
import { MyEnrollmentsView } from '@/components/enrollments/MyEnrollmentsView';
import { TeamView } from '@/components/enrollments/TeamView';
import type { View } from '@/components/enrollments/types';

export default function EnrollmentsPage() {
  const [view, setView] = useState<View>('my');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Gestão de Formação
          </p>
        </div>
        {view === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={() => alert('Abrir formulário de matrícula')}
              className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
            >
              + Matricular
            </button>
            <button
              onClick={() => alert('Abrir modal de matrículas em massa')}
              className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
            >
              ⚡ Em massa
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
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

      {view === 'my' && <MyEnrollmentsView />}
      {view === 'admin' && <AdminView />}
      {view === 'compliance' && <ComplianceView />}
      {view === 'team' && <TeamView />}
    </div>
  );
}
