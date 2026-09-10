'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/leadership/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.
//
// Task 7: quando um gestor escolhe "Gerir" num programa, a página troca a
// navegação por separadores pelo ProgramWorkspace desse programa (Visão
// Geral, Participantes, Mentores & Coaches, Projetos, Avaliações,
// Resultados, Configurações).

import { useState } from 'react';
import { NAV, PROGRAM_MANAGER_ROLES, TITLES } from '@/components/leadership/constants';
import { Feedback360View } from '@/components/leadership/Feedback360View';
import { KudosView } from '@/components/leadership/KudosView';
import { MyDashboardView } from '@/components/leadership/MyDashboardView';
import { ProgramsView } from '@/components/leadership/ProgramsView';
import { ProgramWorkspace } from '@/components/leadership/ProgramWorkspace';
import { RankingView } from '@/components/leadership/RankingView';
import { TeamView } from '@/components/leadership/TeamView';
import type { View } from '@/components/leadership/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isRoleAllowed, type Role } from '@/lib/roles';
import { Button } from '@/components/ui/Button';

export default function LeadershipPage() {
  const [view, setView] = useState<View>('my-dashboard');
  const [workspaceProgramId, setWorkspaceProgramId] = useState<number | null>(null);
  const { data: me } = useCurrentUser();
  const canManage = isRoleAllowed(
    PROGRAM_MANAGER_ROLES,
    me?.role?.name as Role | undefined,
  );

  if (workspaceProgramId != null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ProgramWorkspace
          programId={workspaceProgramId}
          canManage={canManage}
          onBack={() => setWorkspaceProgramId(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
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
      {view === 'programs' && (
        <ProgramsView onOpenWorkspace={setWorkspaceProgramId} />
      )}
      {view === 'feedback360' && <Feedback360View />}
      {view === 'ranking' && <RankingView />}
      {view === 'kudos' && <KudosView />}
    </div>
  );
}
