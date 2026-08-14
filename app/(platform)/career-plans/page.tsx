'use client';

// ─── app/(dashboard)/career-plans/page.tsx ───────────────────────────────────
// INNOVA — Módulo de Planos de Carreira
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { BarChart3, Compass, RefreshCcw, Target, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { AnalyticsTab } from '@/components/career-plans/AnalyticsTab';
import { MyCareerTab } from '@/components/career-plans/MyCareerTab';
import { SimulateModal } from '@/components/career-plans/SimulateModal';
import { TeamTab } from '@/components/career-plans/TeamTab';
import type {
  CareerPlan,
  CareerPlansAnalytics,
  Role,
  TabKey,
} from '@/components/career-plans/types';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function CareerPlansPage() {
  const [tab, setTab] = useState<TabKey>('my');
  const [showSimulate, setShowSimulate] = useState(false);

  const planQuery = useApiQuery<CareerPlan | null>(
    queryKeys.careerPlans.my(),
    '/career-plans/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const rolesQuery = useApiQuery<Role[]>(
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
  const loading = planQuery.isLoading || rolesQuery.isLoading;

  const loadData = () => {
    planQuery.refetch();
    rolesQuery.refetch();
  };

  const handleGoalProgress = async (goalId: number, progress: number) => {
    try {
      await apiClient.patch(`/career-plans/goals/${goalId}/progress`, {
        progress,
      });
      loadData();
    } catch {}
  };

  const tabs: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
    { key: 'my', label: 'Minha Carreira', icon: Target },
    { key: 'team', label: 'Equipa', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Planos de Carreira
            </h1>
            <p className="font-body text-sm text-ink-faint">
              Crescimento e mobilidade profissional
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              intent="secondary"
              size="sm"
              onClick={() => setShowSimulate(true)}
            >
              <Compass size={15} strokeWidth={1.75} /> Simular Carreira
            </Button>
            <button
              onClick={loadData}
              aria-label="Actualizar"
              className="p-2 rounded-control border border-border bg-surface text-ink-muted hover:bg-surface-sunken"
            >
              <RefreshCcw
                size={15}
                strokeWidth={1.75}
                className={loading ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="max-w-5xl mx-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="gap-2">
                <t.icon size={15} strokeWidth={1.75} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6">
          <TabsContent value="my">
            <MyCareerTab
              loading={loading}
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
        </div>
      </Tabs>

      {showSimulate && (
        <SimulateModal roles={roles} onClose={() => setShowSimulate(false)} />
      )}
    </div>
  );
}
