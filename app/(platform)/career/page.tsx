// src/app/(dashboard)/career/page.tsx
'use client';

// Módulo único "Carreira" — junta o antigo /career (perfil, trilhas, vagas
// internas, plano pessoal simples) com o antigo /career-plans (plano por
// cargo com prontidão de skills, equipa, analytics de promoções). Os dois
// back-ends continuam separados (ver src/career/career.module.ts) porque
// escrevem em modelos parcialmente sobrepostos com vocabulários próprios —
// aqui só se une a apresentação, sem perder nenhum separador de nenhum dos
// dois módulos originais. Container: gere o separador activo; delega
// dados+apresentação a cada componente auto-contido (mesmo padrão que
// components/payslips/page.tsx usa). Ver memory
// project_innova_component_separation_audit e
// project_innova_career_pdi_module_duplication.

import { useState } from 'react';
import { Compass, RefreshCcw } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { DashboardView } from '@/components/career/DashboardView';
import { PathsView } from '@/components/career/PathsView';
import { PlanView } from '@/components/career/PlanView';
import { VacanciesView } from '@/components/career/VacanciesView';
import { AnalyticsTab } from '@/components/career/plans/AnalyticsTab';
import { MyCareerTab } from '@/components/career/plans/MyCareerTab';
import { SimulateModal } from '@/components/career/plans/SimulateModal';
import { TeamTab } from '@/components/career/plans/TeamTab';
import type {
  CareerPlan as CareerPlansPlan,
  CareerPlansAnalytics,
  Role as CareerPlansRole,
} from '@/components/career/plans/types';

type CareerTab =
  | 'dashboard'
  | 'paths'
  | 'vacancies'
  | 'plan'
  | 'readiness'
  | 'team'
  | 'analytics';

const TABS: Array<{ id: CareerTab; label: string }> = [
  { id: 'dashboard', label: 'Minha Carreira' },
  { id: 'paths', label: 'Trilhas' },
  { id: 'vacancies', label: 'Vagas Internas' },
  { id: 'plan', label: 'Meu Plano' },
  { id: 'readiness', label: 'Prontidão & Metas' },
  { id: 'team', label: 'Equipa' },
  { id: 'analytics', label: 'Analytics' },
];

export default function CareerPage() {
  const [tab, setTab] = useState<CareerTab>('dashboard');
  const [showSimulate, setShowSimulate] = useState(false);
  const notify = useToast();

  // Dados do bloco "Planos de Carreira" (ex-módulo career-plans) —
  // mesmo comportamento de fetch que a página original tinha (plan/roles
  // sempre pedidos, analytics só quando o separador está activo).
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
  const analyticsQuery = useApiQuery<CareerPlansAnalytics>(
    queryKeys.careerPlans.analytics(),
    '/career-plans/analytics',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled: tab === 'analytics' },
  );

  const myPlan = planQuery.data ?? null;
  const roles = rolesQuery.data ?? [];
  const analytics = analyticsQuery.data ?? null;
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
          <h1 className="font-display text-xl font-semibold text-ink">Carreira</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button intent="secondary" size="sm" onClick={() => setShowSimulate(true)}>
            <Compass size={15} strokeWidth={1.75} /> Simular Carreira
          </Button>
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

      <Tabs value={tab} onValueChange={v => setTab(v as CareerTab)}>
        <div className="overflow-x-auto">
          <TabsList>
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="whitespace-nowrap">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          <DashboardView />
        </TabsContent>
        <TabsContent value="paths">
          <PathsView />
        </TabsContent>
        <TabsContent value="vacancies">
          <VacanciesView />
        </TabsContent>
        <TabsContent value="plan">
          <PlanView />
        </TabsContent>
        <TabsContent value="readiness">
          <MyCareerTab
            loading={plansLoading}
            myPlan={myPlan}
            onGoalProgress={handleGoalProgress}
          />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
        <TabsContent value="analytics">
          {analytics && <AnalyticsTab analytics={analytics} />}
        </TabsContent>
      </Tabs>

      {showSimulate && (
        <SimulateModal roles={roles} onClose={() => setShowSimulate(false)} />
      )}
    </div>
  );
}
