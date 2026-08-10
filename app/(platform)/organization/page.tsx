'use client';

import { useState } from 'react';
import { NAV, TITLES } from '@/components/organization/constants';
import { DashboardView } from '@/components/organization/DashboardView';
import { DepartmentsView } from '@/components/organization/DepartmentsView';
import { OrgChartView } from '@/components/organization/OrgChartView';
import { PositionsView } from '@/components/organization/PositionsView';
import { TimelineView } from '@/components/organization/TimelineView';
import type { View } from '@/components/organization/types';

export default function OrganizationPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Estrutura Organizacional
          </p>
        </div>
        {view === 'departments' && (
          <button
            onClick={() => alert('Abrir formulário de criação de departamento')}
            className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            + Departamento
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

      {view === 'dashboard' && <DashboardView />}
      {view === 'chart' && <OrgChartView />}
      {view === 'departments' && <DepartmentsView />}
      {view === 'positions' && <PositionsView />}
      {view === 'timeline' && <TimelineView />}
    </div>
  );
}
