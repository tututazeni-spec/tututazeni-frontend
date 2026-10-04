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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { useState } from 'react';

export default function HistoryPage() {
  const role = useCurrentRole();
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const [tab, setTab] = useState<Tab>('overview');

  // Papéis sem acesso organizacional só têm a aba do colaborador.
  const visibleTabs = TABS.filter((t) => isAdmin || t.id === 'employee');
  const active: Tab = isAdmin ? tab : 'employee';

  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display text-xl font-bold text-ink">
            Histórico
          </h1>
          <p className="font-body text-sm text-ink-faint">
            Registo transversal de alterações e acontecimentos relevantes —
            todos os dados vêm dos módulos da plataforma.
          </p>
        </div>
      </div>

      <HistoryFiltersProvider>
        <Tabs value={active} onValueChange={(v) => setTab(v as Tab)}>
          {/* Tabs — formato de "cartão": cada trigger é um cartão independente
              (borda + fundo branco + rounded), com destaque azul no estado
              activo (data-[state=active] do Radix). */}
          <div className="bg-surface px-6 py-3">
            <TabsList className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 bg-transparent p-0">
              {visibleTabs.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="flex min-w-[140px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border bg-white px-4 py-2 text-center text-sm font-medium text-foreground shadow-none
                               data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                  >
                    <Icon size={16} strokeWidth={1.75} />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="max-w-7xl mx-auto space-y-5 px-6 py-6">
            {isAdmin && <HistoryFilterBar tab={active} />}

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
