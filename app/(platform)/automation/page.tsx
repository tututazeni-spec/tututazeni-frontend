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
import { BuilderTab } from '@/components/automation/BuilderTab';
import { ExecutionsTab } from '@/components/automation/ExecutionsTab';
import { OverviewTab } from '@/components/automation/OverviewTab';
import { PendingPhaseTab } from '@/components/automation/PendingPhaseTab';
import { RulesTab } from '@/components/automation/RulesTab';
import { SchedulesTab } from '@/components/automation/SchedulesTab';
import { StatsTab } from '@/components/automation/StatsTab';
import type { Tab } from '@/components/automation/types';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';

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
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto max-w-7xl">
          <div className="mb-1 flex items-center gap-2">
            <h1 className="font-display text-xl font-bold text-ink">
              Automação
            </h1>
          </div>
          <p className="font-body text-sm text-ink-faint"></p>
        </div>
      </div>

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <div className="bg-surface px-6 py-5">
          <PillTabsList items={TABS} className="mx-auto max-w-7xl" />
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
            <PendingPhaseTab
              icon={ClipboardCheck}
              title="Aprovações e Tarefas"
              description="Acompanhamento das etapas que dependem de validação humana antes de prosseguir."
            />
          </TabsContent>
          <TabsContent value="reports">
            <StatsTab />
          </TabsContent>
          <TabsContent value="settings">
            <PendingPhaseTab
              icon={Settings}
              title="Configurações"
              description="Permissões, limites de execução, políticas de repetição, alertas e segurança."
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
