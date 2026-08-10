'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/leadership/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/leadership/constants';
import { Feedback360View } from '@/components/leadership/Feedback360View';
import { KudosView } from '@/components/leadership/KudosView';
import { MyDashboardView } from '@/components/leadership/MyDashboardView';
import { ProgramsView } from '@/components/leadership/ProgramsView';
import { RankingView } from '@/components/leadership/RankingView';
import { TeamView } from '@/components/leadership/TeamView';
import type { View } from '@/components/leadership/types';

export default function LeadershipPage() {
  const [view, setView] = useState<View>('my-dashboard');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Desenvolvimento de Liderança
          </p>
        </div>
      </div>

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

      {view === 'my-dashboard' && <MyDashboardView />}
      {view === 'team' && <TeamView />}
      {view === 'programs' && <ProgramsView />}
      {view === 'feedback360' && <Feedback360View />}
      {view === 'ranking' && <RankingView />}
      {view === 'kudos' && <KudosView />}
    </div>
  );
}
