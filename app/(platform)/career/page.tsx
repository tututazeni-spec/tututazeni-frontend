// src/app/(dashboard)/career/page.tsx
'use client';

// Módulo "Carreira" — estrutura final por docs/04-modulo-career.md: Visão
// Geral, A Minha Carreira, Percursos de Carreira, Planos de Carreira,
// Oportunidades, Sucessão, Histórico. Sucessão
// NÃO é módulo separado — é um separador deste módulo (components/career/
// succession/*), reconstruído a partir do motor que sobreviveu à limpeza
// de "módulos legados" (#295), que apanhou src/succession/ por engano
// junto com módulos efectivamente mortos — ver [[project_innova_...]].
// PDI é um módulo próprio (src/development-plans); o separador "PDI &
// Desenvolvimento" foi removido deste módulo.
// Container: gere o separador activo; delega dados+apresentação a cada
// componente auto-contido (mesmo padrão que components/payslips/page.tsx
// usa). Ver memory project_innova_component_separation_audit e
// project_innova_career_pdi_module_duplication.

import { useState } from 'react';
import {
  Briefcase,
  ClipboardList,
  Crown,
  History,
  LayoutDashboard,
  RefreshCcw,
  Route,
  User,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  EXECUTIVE_ROLES,
  filterByRole,
  type Role,
  type RoleRestricted,
} from '@/lib/roles';
import { useToast } from '@/providers/ToastProvider';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import { DashboardView } from '@/components/career/DashboardView';
import { HistoryTab } from '@/components/career/HistoryTab';
import { OverviewTab } from '@/components/career/OverviewTab';
import { PathsView } from '@/components/career/PathsView';
import { VacanciesView } from '@/components/career/VacanciesView';
import { MyCareerTab } from '@/components/career/plans/MyCareerTab';
import { PlansManagementView } from '@/components/career/plans/PlansManagementView';
import { SuccessionTab } from '@/components/career/succession/SuccessionTab';
import { QualificationsTab } from '@/components/users/QualificationsTab';
import type {
  CareerPlan as CareerPlansPlan,
  Role as CareerPlansRole,
} from '@/components/career/plans/types';

type CareerTab =
  | 'overview'
  | 'me'
  | 'paths'
  | 'plans'
  | 'opportunities'
  | 'succession'
  | 'history';

const TABS: Array<PillTabItem & { id: CareerTab } & RoleRestricted> = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Panorama da carreira',
    icon: LayoutDashboard,
    roles: EXECUTIVE_ROLES,
  },
  { id: 'me', label: 'A Minha Carreira', hint: 'O teu percurso', icon: User },
  {
    id: 'paths',
    label: 'Percursos de Carreira',
    hint: 'Trilhas possíveis',
    icon: Route,
  },
  {
    id: 'plans',
    label: 'Planos de Carreira',
    hint: 'Planos da equipa',
    icon: ClipboardList,
    roles: EXECUTIVE_ROLES,
  },
  {
    id: 'opportunities',
    label: 'Oportunidades',
    hint: 'Vagas e movimentos',
    icon: Briefcase,
  },
  // ADMIN/RH apenas (não GESTOR) — CriticalPositionsView chama
  // GET/POST /succession/critical-positions, que o backend restringe a
  // @Roles(ADMIN, RH); só o dashboard/matriz aceitam GESTOR também.
  {
    id: 'succession',
    label: 'Sucessão',
    hint: 'Posições críticas',
    icon: Crown,
    roles: ['ADMIN', 'RH'],
  },
  {
    id: 'history',
    label: 'Histórico',
    hint: 'Movimentos passados',
    icon: History,
  },
];

export default function CareerPage() {
  const { data: me } = useCurrentUser();
  const role = me?.role?.name as Role | undefined;
  const visibleTabs = filterByRole(TABS, role);

  const [tab, setTab] = useState<CareerTab>('me');
  const notify = useToast();

  // Dados do bloco "Prontidão & Metas" (ex-módulo career-plans) — mesmo
  // comportamento de fetch que a página original tinha.
  const planQuery = useApiQuery<CareerPlansPlan | null>(
    queryKeys.careerPlans.my(),
    '/career-plans/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const rolesQuery = useApiQuery<CareerPlansRole[]>(
    queryKeys.careerPlans.roles(),
    '/career-plans/roles',
    { staleTime: STALE_TIME.STATIC },
  );

  const myPlan = planQuery.data ?? null;
  const plansLoading = planQuery.isLoading || rolesQuery.isLoading;

  const refreshPlans = () => {
    planQuery.refetch();
    rolesQuery.refetch();
  };

  const handleGoalProgress = async (goalId: number, progress: number) => {
    try {
      await apiClient.patch(`/career-plans/goals/${goalId}/progress`, {
        progress,
      });
      refreshPlans();
    } catch (e) {
      reportError(e, { source: 'CareerPage.handleGoalProgress' });
      notify({
        title: 'Não foi possível actualizar o progresso',
        intent: 'danger',
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            Carreira
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPlans}
            aria-label="Actualizar"
            className="p-2 rounded-control border border-border bg-surface text-ink-muted hover:bg-surface-sunken"
          >
            <RefreshCcw
              size={15}
              strokeWidth={1.75}
              className={plansLoading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as CareerTab)}>
        <PillTabsList items={visibleTabs} className="mb-6" />

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="me">
          <div className="space-y-6">
            <DashboardView />
            <MyCareerTab
              loading={plansLoading}
              myPlan={myPlan}
              onGoalProgress={handleGoalProgress}
            />
            {/* Dados que o Simulador compara com os requisitos do cargo. */}
            {me?.id !== undefined && (
              <section aria-labelledby="my-qualifications">
                <h2
                  id="my-qualifications"
                  className="mb-3 font-display text-base font-semibold text-ink"
                >
                  As minhas qualificações
                </h2>
                <QualificationsTab userId={me.id} />
              </section>
            )}
          </div>
        </TabsContent>
        <TabsContent value="paths">
          <PathsView />
        </TabsContent>
        <TabsContent value="plans">
          <PlansManagementView />
        </TabsContent>
        <TabsContent value="opportunities">
          <VacanciesView />
        </TabsContent>
        <TabsContent value="succession">
          <SuccessionTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
