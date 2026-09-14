// src/app/(dashboard)/analytics/page.tsx
'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/analytics/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.
//
// Migrado para a fundação de design: pills de separador manuais passam
// a components/ui/Tabs (Radix) — TabsContent só monta a vista activa,
// mesmo comportamento que a renderização condicional anterior.
//
// NAV é filtrada por role antes de renderizar: cada separador só aparece a
// quem o endpoint principal por trás dele (em
// src/analytics/analytics.controller.ts) realmente deixa passar — evita
// mostrar um separador que só vai devolver 403 (ver constants.ts).

import { useMemo, useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { NAV, TITLES } from '@/components/analytics/constants';
import { CompetencyGapsView } from '@/components/analytics/CompetencyGapsView';
import { CoursesPerformanceView } from '@/components/analytics/CoursesPerformanceView';
import { EngagementView } from '@/components/analytics/EngagementView';
import { HRDashboardView } from '@/components/analytics/HRDashboardView';
import { LearningAnalyticsView } from '@/components/analytics/LearningAnalyticsView';
import { ManagerView } from '@/components/analytics/ManagerView';
import { MyDashboardView } from '@/components/analytics/MyDashboardView';
import { OverviewView } from '@/components/analytics/OverviewView';
import { PDIAnalyticsView } from '@/components/analytics/PDIAnalyticsView';
import { PeopleAnalyticsView } from '@/components/analytics/PeopleAnalyticsView';
import { RisksView } from '@/components/analytics/RisksView';
import { ROIView } from '@/components/analytics/ROIView';
import { SnapshotsView } from '@/components/analytics/SnapshotsView';
import type { View } from '@/components/analytics/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function AnalyticsPage() {
  const [view, setView] = useState<View>('overview');
  const role = useCurrentRole();

  const nav = useMemo(
    () => NAV.filter((n) => !n.roles || (role && n.roles.includes(role))),
    [role],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="font-body text-sm text-ink-faint mt-0.5"></p>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-6 w-fit flex-wrap gap-x-8 gap-y-2">
          {nav.map((n) => {
            const Icon = n.icon;
            return (
              <TabsTrigger
                key={n.id}
                value={n.id}
                className="gap-2 whitespace-nowrap"
              >
                <Icon size={14} strokeWidth={1.75} />
                {n.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview">
          <OverviewView />
        </TabsContent>
        <TabsContent value="my">
          <MyDashboardView />
        </TabsContent>
        <TabsContent value="manager">
          <ManagerView />
        </TabsContent>
        <TabsContent value="hr">
          <HRDashboardView />
        </TabsContent>
        <TabsContent value="learning">
          <LearningAnalyticsView />
        </TabsContent>
        <TabsContent value="courses">
          <CoursesPerformanceView />
        </TabsContent>
        <TabsContent value="pdi">
          <PDIAnalyticsView />
        </TabsContent>
        <TabsContent value="competencies">
          <CompetencyGapsView />
        </TabsContent>
        <TabsContent value="people">
          <PeopleAnalyticsView />
        </TabsContent>
        <TabsContent value="engagement">
          <EngagementView />
        </TabsContent>
        <TabsContent value="roi">
          <ROIView />
        </TabsContent>
        <TabsContent value="risks">
          <RisksView />
        </TabsContent>
        <TabsContent value="snapshots">
          <SnapshotsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
