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
  CircleCheck,
  Clock,
  FileText,
  FolderKanban,
  GraduationCap,
  Gauge,
  History,
  RefreshCw,
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
import { IconButton } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
  const ActiveIcon = active ? TAB_ICONS[active.id] : FileText;
  const restrictedScope = role === 'GESTOR' || role === 'LIDER';
  // O histórico lista relatórios guardados — não depende dos filtros globais.
  const showFilters =
    !!active && active.id !== 'history' && active.id !== 'scheduled';

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ActiveIcon
                size={22}
                strokeWidth={1.8}
                className="transition-all duration-300"
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink">
                Relatórios Executivos
              </h1>
              <p className="mt-0.5 font-body text-xs text-ink-muted">
                {active?.hint ?? 'Relatórios Executivos · INNOVA'}
              </p>
            </div>
          </div>
          <IconButton
            icon={RefreshCw}
            label="Actualizar"
            intent="secondary"
            onClick={() => window.location.reload()}
          />
        </div>
      </div>

      {tabsQ.isLoading && (
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Skeleton
            rows={1}
            wrapperClassName="animate-pulse"
            itemClassName="h-16 rounded-3xl bg-surface-sunken"
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
          {/* Barra de abas — mesma "glassmorphism" do dashboard-rh. */}
          <div className="relative bg-surface px-6 py-5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-7xl rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 border-b-0 bg-transparent p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tabs.map((t) => {
                  const Icon = TAB_ICONS[t.id];
                  return (
                    <TabsTrigger
                      key={t.id}
                      value={t.id}
                      className="group flex h-auto w-full min-w-0 items-center gap-3 rounded-full border border-white/70 bg-white/60 py-2 pl-2 pr-4 text-left text-ink shadow-sm backdrop-blur transition-all
                               hover:bg-white/80
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                               data-[state=active]:border-transparent data-[state=active]:bg-[#0F1F3D] data-[state=active]:text-white data-[state=active]:shadow-lg"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                        <Icon size={16} strokeWidth={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                        <span className="w-full break-words text-sm font-semibold">{t.label}</span>
                        <span className="w-full break-words text-xs opacity-70 group-data-[state=active]:opacity-85">
                          {t.hint}
                        </span>
                      </span>
                      <CircleCheck
                        size={16}
                        strokeWidth={2}
                        className="hidden shrink-0 group-data-[state=active]:block"
                      />
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
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
