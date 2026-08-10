// src/app/(dashboard)/succession/page.tsx
'use client';

import { useState } from 'react';
import { DashboardView } from '@/components/sucession/DashboardView';
import { NAV, TITLES } from '@/components/sucession/constants';
import { OrgChartView } from '@/components/sucession/OrgChartView';
import { PositionsView } from '@/components/sucession/PositionsView';
import { TalentPoolView } from '@/components/sucession/TalentPoolView';
import type { View } from '@/components/sucession/types';

export default function SuccessionPage() {
  const [view, setView] = useState<View>('dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Planeamento de Sucessão
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
      {view === 'org-chart' && <OrgChartView />}
      {view === 'positions' && <PositionsView />}
      {view === 'talent-pool' && <TalentPoolView />}
    </div>
  );
}
