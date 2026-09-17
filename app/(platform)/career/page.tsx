// src/app/(dashboard)/career/page.tsx
'use client';

// Módulo "Carreira" — estrutura final por docs/04-modulo-career.md: Visão
// Geral, A Minha Carreira, Percursos de Carreira, Planos de Carreira,
// Oportunidades, PDI & Desenvolvimento, Sucessão, Histórico. Sucessão foi
// fundida aqui a partir do antigo /sucession (ver
// app/(platform)/sucession/page.tsx, agora um stub de redireccionamento) —
// os componentes continuam intactos em components/career/succession/.
// PDI continua um módulo próprio (src/development-plans); o separador
// "PDI & Desenvolvimento" só resume e liga para lá, não duplica.
// Container: gere o separador activo; delega dados+apresentação a cada
// componente auto-contido (mesmo padrão que components/payslips/page.tsx
// usa). Ver memory project_innova_component_separation_audit e
// project_innova_career_pdi_module_duplication.

import { useState } from 'react';
import { Compass, RefreshCcw } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EXECUTIVE_ROLES, filterByRole, type Role, type RoleRestricted } from '@/lib/roles';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { DashboardView } from '@/components/career/DashboardView';
import { HistoryTab } from '@/components/career/HistoryTab';
import { OverviewTab } from '@/components/career/OverviewTab';
import { PathsView } from '@/components/career/PathsView';
import { PdiTab } from '@/components/career/PdiTab';
import { VacanciesView } from '@/components/career/VacanciesView';
import { MyCareerTab } from '@/components/career/plans/MyCareerTab';
import { PlansManagementView } from '@/components/career/plans/PlansManagementView';
import { SimulateModal } from '@/components/career/plans/SimulateModal';
import { SuccessionTab } from '@/components/career/succession/SuccessionTab';
import type { CareerPlan as CareerPlansPlan, Role as CareerPlansRole } from '@/components/career/plans/types';

type CareerTab =
  | 'overview'
  | 'me'
  | 'paths'
  | 'plans'
  | 'opportunities'
  | 'pdi'
  | 'succession'
  | 'history';

const TABS: Array<{ id: CareerTab; label: string } & RoleRestricted> = [
  { id: 'overview', label: 'Visão Geral', roles: EXECUTIVE_ROLES },
  { id: 'me', label: 'A Minha Carreira' },
  { id: 'paths', label: 'Percursos de Carreira' },
  { id: 'plans', label: 'Planos de Carreira', roles: EXECUTIVE_ROLES },
  { id: 'opportunities', label: 'Oportunidades' },
  { id: 'pdi', label: 'PDI & Desenvolvimento' },
  { id: 'succession', label: 'Sucessão', roles: EXECUTIVE_ROLES },
  { id: 'history', label: 'Histórico' },
];

export default function CareerPage() {
  const { data: me } = useCurrentUser();
  const role = me?.role?.name as Role | undefined;
  const visibleTabs = filterByRole(TABS, role);

  const [tab, setTab] = useState<CareerTab>('me');
  const [showSimulate, setShowSimulate] = useState(false);
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
  const roles = rolesQuery.data ?? [];
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
            {visibleTabs.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="whitespace-nowrap">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="me">
          <div className="space-y-6">
            <DashboardView />
            <MyCareerTab loading={plansLoading} myPlan={myPlan} onGoalProgress={handleGoalProgress} />
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
        <TabsContent value="pdi">
          <PdiTab />
        </TabsContent>
        <TabsContent value="succession">
          <SuccessionTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>

      {showSimulate && (
        <SimulateModal roles={roles} onClose={() => setShowSimulate(false)} />
      )}
    </div>
  );
}
