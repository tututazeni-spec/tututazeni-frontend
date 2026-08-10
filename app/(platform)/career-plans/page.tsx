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
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Planos de Carreira
            </h1>
            <p className="text-sm text-gray-500">
              Crescimento e mobilidade profissional
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSimulate(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Compass size={15} /> Simular Carreira
            </button>
            <button
              onClick={loadData}
              aria-label="Actualizar"
              className="p-2 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50"
            >
              <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-colors ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'my' && (
          <MyCareerTab
            loading={loading}
            myPlan={myPlan}
            onGoalProgress={handleGoalProgress}
          />
        )}

        {tab === 'team' && <TeamTab />}

        {tab === 'analytics' && analytics && (
          <AnalyticsTab analytics={analytics} />
        )}
      </div>

      {showSimulate && (
        <SimulateModal roles={roles} onClose={() => setShowSimulate(false)} />
      )}
    </div>
  );
}
