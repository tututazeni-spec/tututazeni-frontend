'use client';
// src/app/(dashboard)/history/page.tsx
// Histórico transversal da organização (docs/history.md). Não substitui o
// Audit Logs técnico: junta os acontecimentos relevantes de todos os módulos.
// As 7 abas organizacionais são só para ADMIN/RH; todos os papéis têm a aba
// "Histórico do Colaborador" (o próprio, ou a equipa no caso de gestores).

import { ActivitiesTab } from '@/components/history/ActivitiesTab';
import { TABS } from '@/components/history/constants';
import { DocumentsTab } from '@/components/history/DocumentsTab';
import { EmployeeTab } from '@/components/history/EmployeeTab';
import {
  HistoryFilterBar,
  HistoryFiltersProvider,
} from '@/components/history/filters';
import { HistoryFeedTab } from '@/components/history/HistoryFeedTab';
import { MovementsTab } from '@/components/history/MovementsTab';
import { OrgChangesTab } from '@/components/history/OrgChangesTab';
import { OverviewTab } from '@/components/history/OverviewTab';
import { ReportsTab } from '@/components/history/ReportsTab';
import type { Tab } from '@/components/history/types';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { useState } from 'react';

export default function HistoryPage() {
  const isAdmin = useHasRole(ADMIN_ROLES);
  const [tab, setTab] = useState<Tab>('overview');

  // Papéis sem acesso organizacional só têm a aba do colaborador.
  const visibleTabs = TABS.filter((t) => isAdmin || t.id === 'employee');
  const active: Tab = isAdmin ? tab : 'employee';

  return (
    <div className="min-h-screen overflow-x-clip bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/historico.jpg"
          title="Histórico"
          hint={"Registo transversal de alterações e acontecimentos relevantes"}
        />
      </div>

      <HistoryFiltersProvider>
        <Tabs value={active} onValueChange={(v) => setTab(v as Tab)}>
          <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
            <PillTabsList items={visibleTabs} />
          </div>

          <div className="max-w-7xl mx-auto space-y-5 px-6 py-6">
            {isAdmin && <HistoryFilterBar />}

            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="history">
              <HistoryFeedTab />
            </TabsContent>
            <TabsContent value="employee">
              <EmployeeTab />
            </TabsContent>
            <TabsContent value="movements">
              <MovementsTab />
            </TabsContent>
            <TabsContent value="org">
              <OrgChangesTab />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab />
            </TabsContent>
            <TabsContent value="activities">
              <ActivitiesTab />
            </TabsContent>
            <TabsContent value="reports">
              <ReportsTab />
            </TabsContent>
          </div>
        </Tabs>
      </HistoryFiltersProvider>
    </div>
  );
}
