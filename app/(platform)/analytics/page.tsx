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

import { useState } from 'react';
import { NAV, TITLES } from '@/components/analytics/constants';
import { HRDashboardView } from '@/components/analytics/HRDashboardView';
import { ManagerView } from '@/components/analytics/ManagerView';
import { MyDashboardView } from '@/components/analytics/MyDashboardView';
import { OverviewView } from '@/components/analytics/OverviewView';
import { RisksView } from '@/components/analytics/RisksView';
import type { View } from '@/components/analytics/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export default function AnalyticsPage() {
  const [view, setView] = useState<View>('overview');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="font-body text-sm text-ink-faint mt-0.5">
          </p>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-6 w-fit gap-12">
          {NAV.map((n) => (
            <TabsTrigger key={n.id} value={n.id}>
              {n.label}
            </TabsTrigger>
          ))}
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
        <TabsContent value="risks">
          <RisksView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
