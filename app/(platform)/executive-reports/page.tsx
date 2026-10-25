'use client';

// src/app/(platform)/executive-reports/page.tsx
//
// Container do módulo Relatórios Executivos (docs/Executive_Reports.md):
// cabeçalho + barra de abas "glassmorphism" + filtros globais — mesmo
// esqueleto de app/(platform)/dashboard-rh/page.tsx. Os separadores visíveis
// vêm do backend (GET /executive-reports/tabs) conforme o papel do
// utilizador; cada painel é auto-contido em components/executive-reports/.

import { useState } from 'react';
import {
  Banknote,
  BarChart2,
  Building2,
  CalendarClock,
  Clock,
  FileText,
  FolderKanban,
  GraduationCap,
  Gauge,
  History,
  ShieldAlert,
  Star,
  Users,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
import { AlertsPanel } from '@/components/executive-reports/AlertsPanel';
import { CustomReportsPanel } from '@/components/executive-reports/CustomReportsPanel';
import { DepartmentsPanel } from '@/components/executive-reports/DepartmentsPanel';
import {
  DomainPanel,
  type ExecutiveDomain,
} from '@/components/executive-reports/DomainPanel';
import { ExecutiveFiltersBar } from '@/components/executive-reports/ExecutiveFiltersBar';
import { HistoryPanel } from '@/components/executive-reports/HistoryPanel';
import { OverviewPanel } from '@/components/executive-reports/OverviewPanel';
import { PendingPhasePanel } from '@/components/executive-reports/PendingPhasePanel';
import { RisksPanel } from '@/components/executive-reports/RisksPanel';
import { SchedulesPanel } from '@/components/executive-reports/SchedulesPanel';
import { StrategicPanel } from '@/components/executive-reports/StrategicPanel';
import type {
  ExecutiveFilters,
  ExecutiveTab,
  ExecutiveTabId,
} from '@/components/executive-reports/dashboardTypes';

const TAB_ICONS: Record<ExecutiveTabId, LucideIcon> = {
  overview: BarChart2,
  strategic: Gauge,
  hr: Users,
  training: GraduationCap,
  performance: Star,
  attendance: Clock,
  costs: Banknote,
  departments: Building2,
  projects: FolderKanban,
  risks: ShieldAlert,
  custom: Wand2,
  scheduled: CalendarClock,
  history: History,
};

// Separadores já implementados; os restantes mostram o marcador de fase.
const IMPLEMENTED: ExecutiveTabId[] = [
  'overview',
  'strategic',
  'departments',
  'risks',
  'hr',
  'training',
  'performance',
  'attendance',
  'projects',
  'costs',
  'custom',
  'scheduled',
  'history',
];

// Separadores por domínio → endpoint GET /executive-reports/:domain
const DOMAIN_TABS: [ExecutiveTabId, ExecutiveDomain][] = [
  ['hr', 'workforce'],
  ['training', 'training'],
  ['performance', 'performance'],
  ['attendance', 'attendance'],
  ['projects', 'projects'],
  ['costs', 'costs'],
];

const DEFAULT_FILTERS: ExecutiveFilters = {
  period: 'year',
  compareWith: 'previous',
};

export default function ExecutiveReportsPage() {
  const role = useCurrentRole();
  const [activeTab, setActiveTab] = useState<ExecutiveTabId>('overview');
  const [filters, setFilters] = useState<ExecutiveFilters>(DEFAULT_FILTERS);

  const tabsQ = useApiQuery<ExecutiveTab[]>(
    queryKeys.executiveReports.tabs(),
    '/executive-reports/tabs',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const tabs = tabsQ.data ?? [];
  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];
  const restrictedScope = role === 'GESTOR' || role === 'LIDER';
  // O histórico lista relatórios guardados — não depende dos filtros globais.
  const showFilters =
    !!active && active.id !== 'history' && active.id !== 'scheduled';

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/relatorios executivos.jpg"
          title="Relatórios Executivos"
          hint={active?.hint ?? 'Relatórios Executivos · INNOVA'}
        />
      </div>

      {tabsQ.isLoading && (
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Skeleton
            rows={1}
            wrapperClassName=""
            itemClassName="h-16 rounded-panel bg-surface-sunken"
          />
        </div>
      )}
      {tabsQ.error && (
        <div className="mx-auto max-w-7xl px-6 py-6">
          <QueryError error={tabsQ.error} onRetry={() => tabsQ.refetch()} />
        </div>
      )}

      {active && (
        <Tabs
          value={active.id}
          onValueChange={(v) => setActiveTab(v as ExecutiveTabId)}
        >
          {/* Barra de abas — mesma pílula do módulo scalability. */}
          <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
            <PillTabsList
              items={tabs.map((t) => ({
                id: t.id,
                label: t.label,
                hint: t.hint,
                icon: TAB_ICONS[t.id],
              }))}
            />
          </div>

          {/* Conteúdo */}
          <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
            {showFilters && (
              <ExecutiveFiltersBar
                filters={filters}
                onChange={setFilters}
                restrictedScope={restrictedScope}
              />
            )}

            <TabsContent value="overview">
              <OverviewPanel filters={filters} />
            </TabsContent>
            <TabsContent value="strategic">
              <StrategicPanel filters={filters} />
            </TabsContent>
            {DOMAIN_TABS.map(([tab, domain]) => (
              <TabsContent key={tab} value={tab}>
                <DomainPanel domain={domain} filters={filters} />
              </TabsContent>
            ))}
            <TabsContent value="departments">
              <DepartmentsPanel
                filters={filters}
                onFiltersChange={setFilters}
              />
            </TabsContent>
            <TabsContent value="risks">
              <div className="space-y-8">
                <AlertsPanel />
                <RisksPanel filters={filters} onFiltersChange={setFilters} />
              </div>
            </TabsContent>
            <TabsContent value="custom">
              <CustomReportsPanel filters={filters} />
            </TabsContent>
            <TabsContent value="scheduled">
              <SchedulesPanel />
            </TabsContent>
            <TabsContent value="history">
              <HistoryPanel />
            </TabsContent>
            {tabs
              .filter((t) => !IMPLEMENTED.includes(t.id))
              .map((t) => (
                <TabsContent key={t.id} value={t.id}>
                  <PendingPhasePanel label={t.label} />
                </TabsContent>
              ))}
          </div>
        </Tabs>
      )}
    </div>
  );
}
