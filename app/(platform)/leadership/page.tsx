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
import { Button } from '@/components/ui/Button';

export default function LeadershipPage() {
  const [view, setView] = useState<View>('my-dashboard');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Desenvolvimento de Liderança
          </p>
        </div>
      </div>

      <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-card bg-surface-sunken p-1">
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

      {view === 'my-dashboard' && <MyDashboardView />}
      {view === 'team' && <TeamView />}
      {view === 'programs' && <ProgramsView />}
      {view === 'feedback360' && <Feedback360View />}
      {view === 'ranking' && <RankingView />}
      {view === 'kudos' && <KudosView />}
    </div>
  );
}
