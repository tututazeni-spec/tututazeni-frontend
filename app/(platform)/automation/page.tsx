'use client';
// app/(platform)/automation/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados +
// apresentação de cada separador aos componentes auto-contidos em
// components/automation/ (mesmo padrão que components/engagement/page.tsx
// usa). Ver memory project_innova_component_separation_audit.

import { useState } from 'react';
import {
  Activity,
  BarChart2,
  CalendarClock,
  ClipboardCheck,
  LayoutDashboard,
  Settings,
  Workflow,
  Zap,
} from 'lucide-react';
import { ApprovalsTab } from '@/components/automation/ApprovalsTab';
import { BuilderTab } from '@/components/automation/BuilderTab';
import { ExecutionsTab } from '@/components/automation/ExecutionsTab';
import { OverviewTab } from '@/components/automation/OverviewTab';
import { RulesTab } from '@/components/automation/RulesTab';
import { SchedulesTab } from '@/components/automation/SchedulesTab';
import { SettingsTab } from '@/components/automation/SettingsTab';
import { StatsTab } from '@/components/automation/StatsTab';
import type { Tab } from '@/components/automation/types';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';

// Estrutura do spec (docs/modulo_automation.md §1).
const TABS: Array<PillTabItem & { id: Tab }> = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Resumo das regras',
    icon: LayoutDashboard,
  },
  {
    id: 'rules',
    label: 'Todas as Automações',
    hint: 'Regras configuradas',
    icon: Zap,
  },
  {
    id: 'builder',
    label: 'Construtor de Fluxos',
    hint: 'Criar e editar',
    icon: Workflow,
  },
  {
    id: 'schedules',
    label: 'Agendamentos',
    hint: 'Execuções planeadas',
    icon: CalendarClock,
  },
  {
    id: 'executions',
    label: 'Histórico de Execuções',
    hint: 'Resultados e erros',
    icon: Activity,
  },
  {
    id: 'approvals',
    label: 'Aprovações e Tarefas',
    hint: 'Validação humana',
    icon: ClipboardCheck,
  },
  {
    id: 'reports',
    label: 'Relatórios',
    hint: 'Métricas de execução',
    icon: BarChart2,
  },
  {
    id: 'settings',
    label: 'Configurações',
    hint: 'Limites e políticas',
    icon: Settings,
  },
];

export default function AutomationPage() {
  const [tab, setTab] = useState<Tab>('overview');
  // Filtro do histórico vindo de "Consultar histórico" / "Ver erros" na tabela.
  const [historyFilter, setHistoryFilter] = useState<{
    ruleId: number;
    failedOnly: boolean;
  } | null>(null);

  // Construtor de Fluxos: regra em edição ('new' = nova automação).
  const [builderTarget, setBuilderTarget] = useState<number | 'new' | null>(
    null,
  );
  const openBuilder = (target: number | 'new') => {
    setBuilderTarget(target);
    setTab('builder');
  };

  const openHistory = (ruleId: number, failedOnly = false) => {
    setHistoryFilter({ ruleId, failedOnly });
    setTab('executions');
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/automações.jpg"
          title="Automação"
          hint={TABS.find((t) => t.id === tab)?.hint}
        />
      </div>

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
          <PillTabsList items={TABS} />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="rules">
            <RulesTab
              onOpenHistory={openHistory}
              onEditRule={openBuilder}
              onNewRule={() => openBuilder('new')}
            />
          </TabsContent>
          <TabsContent value="builder">
            <BuilderTab editing={builderTarget} onEdit={setBuilderTarget} />
          </TabsContent>
          <TabsContent value="schedules">
            <SchedulesTab />
          </TabsContent>
          <TabsContent value="executions">
            <ExecutionsTab
              key={`${historyFilter?.ruleId ?? 'all'}-${historyFilter?.failedOnly ?? false}`}
              ruleId={historyFilter?.ruleId}
              initialStatus={historyFilter?.failedOnly ? 'FAILED' : ''}
              onClearRule={() => setHistoryFilter(null)}
            />
          </TabsContent>
          <TabsContent value="approvals">
            <ApprovalsTab />
          </TabsContent>
          <TabsContent value="reports">
            <StatsTab />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
