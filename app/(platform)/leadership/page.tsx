'use client';
// Container: gere secção activa (Gestão de Equipa vs. Programas &
// Reconhecimento) e, dentro de cada uma, o separador/vista activa; delega
// dados+apresentação de cada separador aos componentes auto-contidos em
// components/leader/ e components/leadership/. Ver memory
// project_innova_component_separation_audit.
//
// Módulo fundido (pedido do utilizador): o antigo /leader ("Centro de
// Liderança" — dashboard do líder, equipa, performance, pipeline de
// talentos, PDIs) e o antigo /leadership ("Programas de Liderança" —
// programas, feedback 360°, ranking, kudos) passam a viver numa única
// página, sob a entrada "Liderança" da sidebar. Nenhum conteúdo de
// nenhum dos dois módulos foi removido — são as mesmas duas UIs,
// intactas, agora alternadas por um selector de secção em vez de dois
// links separados. Ver src/leadership/leadership.module.ts para o
// equivalente no backend.
//
// Task 7: quando um gestor escolhe "Gerir" num programa, a secção de
// Programas troca a navegação por separadores pelo ProgramWorkspace desse
// programa (Visão Geral, Participantes, Mentores & Coaches, Projetos,
// Avaliações, Resultados, Configurações).

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { DashboardTab } from '@/components/leader/DashboardTab';
import { PerformanceTab } from '@/components/leader/PerformanceTab';
import { PlansTab } from '@/components/leader/PlansTab';
import { TABS as TEAM_TABS, TEAM_MANAGEMENT_ROLES } from '@/components/leader/constants';
import { TalentPipelineTab } from '@/components/leader/TalentPipelineTab';
import { TeamTab } from '@/components/leader/TeamTab';
import { NAV, PROGRAM_MANAGER_ROLES, TITLES } from '@/components/leadership/constants';
import { Feedback360View } from '@/components/leadership/Feedback360View';
import { KudosView } from '@/components/leadership/KudosView';
import { MyDashboardView } from '@/components/leadership/MyDashboardView';
import { ProgramsView } from '@/components/leadership/ProgramsView';
import { ProgramWorkspace } from '@/components/leadership/ProgramWorkspace';
import { RankingView } from '@/components/leadership/RankingView';
import { TeamView } from '@/components/leadership/TeamView';
import type { View } from '@/components/leadership/types';
import { Button, IconButton } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { filterByRole, isRoleAllowed, type Role } from '@/lib/roles';

type Section = 'team-management' | 'programs';

const SECTIONS: { id: Section; label: string; roles?: readonly Role[] }[] = [
  { id: 'team-management', label: 'Gestão de Equipa', roles: TEAM_MANAGEMENT_ROLES },
  { id: 'programs', label: 'Programas & Reconhecimento' },
];

export default function LeadershipPage() {
  const [section, setSection] = useState<Section>('team-management');
  const [view, setView] = useState<View>('my-dashboard');
  const [workspaceProgramId, setWorkspaceProgramId] = useState<number | null>(null);
  const { data: me } = useCurrentUser();
  const role = me?.role?.name as Role | undefined;
  const canManagePrograms = isRoleAllowed(PROGRAM_MANAGER_ROLES, role);
  const visibleSections = filterByRole(SECTIONS, role);
  const visibleNav = filterByRole(NAV, role);
  // Colaborador sem acesso a "Gestão de Equipa": força a secção de programas.
  const activeSection = visibleSections.some((s) => s.id === section)
    ? section
    : visibleSections[0]?.id ?? 'programs';

  if (workspaceProgramId != null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ProgramWorkspace
          programId={workspaceProgramId}
          canManage={canManagePrograms}
          onBack={() => setWorkspaceProgramId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <h1 className="mb-1 font-display text-xl font-bold text-ink">Liderança</h1>
            <p className="font-body text-sm text-ink-faint">
              {activeSection === 'team-management' ? 'Centro de Liderança' : TITLES[view]}
            </p>
          </div>
          {activeSection === 'team-management' && (
            <IconButton
              icon={RefreshCw}
              label="Actualizar"
              intent="secondary"
              onClick={() => window.location.reload()}
            />
          )}
        </div>

        {visibleSections.length > 1 && (
          <div className="mx-auto mt-4 flex max-w-7xl w-fit flex-wrap gap-1 rounded-card bg-surface-sunken p-1">
            {visibleSections.map((s) => (
              <Button
                key={s.id}
                size="sm"
                intent={activeSection === s.id ? 'primary' : 'ghost'}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {activeSection === 'team-management' ? (
        <Tabs defaultValue="dashboard">
          <div className="border-b border-border bg-surface px-6">
            <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
              {TEAM_TABS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className={
                      i < TEAM_TABS.length - 1
                        ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                        : 'gap-2 whitespace-nowrap'
                    }
                  >
                    <Icon size={15} strokeWidth={1.75} />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="mx-auto max-w-7xl px-6 py-6">
            <TabsContent value="dashboard">
              <DashboardTab />
            </TabsContent>
            <TabsContent value="team">
              <TeamTab />
            </TabsContent>
            <TabsContent value="performance">
              <PerformanceTab />
            </TabsContent>
            <TabsContent value="pipeline">
              <TalentPipelineTab />
            </TabsContent>
            <TabsContent value="plans">
              <PlansTab />
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex w-fit flex-wrap gap-1 rounded-card bg-surface-sunken p-1">
            {visibleNav.map((n) => (
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
          {view === 'programs' && <ProgramsView onOpenWorkspace={setWorkspaceProgramId} />}
          {view === 'feedback360' && <Feedback360View />}
          {view === 'ranking' && <RankingView />}
          {view === 'kudos' && <KudosView />}
        </div>
      )}
    </div>
  );
}
