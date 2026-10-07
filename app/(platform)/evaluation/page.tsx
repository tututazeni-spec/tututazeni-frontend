'use client';
// src/app/(dashboard)/evaluations/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/evaluation/ (mesmo padrão que components/engagement/page.tsx
// e components/payslips/page.tsx usam). Ver memory
// project_innova_component_separation_audit.

import {
  BarChart2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileBarChart,
  Layers,
  ListChecks,
  Settings,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsTab } from '@/components/evaluation/AnalyticsTab';
import { CalibrationTab } from '@/components/evaluation/CalibrationTab';
import { CompetenciesTab } from '@/components/evaluation/CompetenciesTab';
import { CriteriaTab } from '@/components/evaluation/CriteriaTab';
import { CyclesTab } from '@/components/evaluation/CyclesTab';
import { EvaluationsTab } from '@/components/evaluation/EvaluationsTab';
import { FormalEvaluationsTab } from '@/components/evaluation/FormalEvaluationsTab';
import { ModelsTab } from '@/components/evaluation/ModelsTab';
import { OverviewTab } from '@/components/evaluation/OverviewTab';
import { PendingTab } from '@/components/evaluation/PendingTab';
import { ReportsTab } from '@/components/evaluation/ReportsTab';
import { ResultsTab } from '@/components/evaluation/ResultsTab';
import { SettingsTab } from '@/components/evaluation/SettingsTab';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, MGMT_ROLES, filterByRole } from '@/lib/roles';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList } from '@/components/ui/PillTabs';

// Análises e Calibração espelham exactamente @Roles(ADMIN, RH) de
// GET /evaluations/analytics/dashboard e GET /evaluations/calibration/:cycleId
// (evaluation.controller.ts) — nem GESTOR/LIDER têm acesso a estes dois,
// só a Ciclos/Pendentes/Resultados. Sem esta restrição um COLABORADOR via
// o separador e o pedido rebentava sempre com 403.
//
// "Avaliações Formais" (quizzes/exames com múltipla escolha ou resposta
// aberta, por departamento ou gerais — backend src/assessments, type=EXAM)
// não tem @Roles() próprio no container: fica visível a todos os 8 papéis e
// o próprio FormalEvaluationsTab ramifica internamente entre gestão
// (EVAL_CREATOR_ROLES) e participação (COLABORADOR/AUDITOR), tal como o
// ResultsTab já faz para COLABORADOR.
// Ordem/nomenclatura segue docs/modulo_evaluation.md ponto 0.
// Parte 1 (0-3): Visão Geral, Avaliações, Ciclos de Avaliação.
// Parte 2 (4-7, esta): Modelos/Critérios — leitura MGMT_ROLES (espelha
// @Roles(...MGMT_ROLES) em GET /evaluations/templates|criteria no backend;
// criar/editar fica restrito a ADMIN_ROLES dentro do próprio separador,
// tal como CyclesTab/EvaluationsTab já fazem); Competências — sem @Roles()
// no backend (GET /competencies/my|user/:id/gap), visível a todos, o
// próprio CompetenciesTab ramifica MGMT (escolhe colaborador) vs
// COLABORADOR (só o próprio); "Pendentes" renomeado para "Avaliações
// Pendentes" (nome do doc) e passa a incluir também a fila do gestor
// (avaliações que tem de preencher) e, do lado do colaborador,
// "Avaliações concluídas"/"Feedback recebido" — ver PendingTab.tsx.
// Parte 3 (8-12): "Resultados" e "Calibração" já existiam antes do doc (não
// eram os pontos 8-9 originalmente) e foram agora enriquecidos com os campos
// em falta (objetivos/evolução/comentários por papel; filtro por
// departamento/justificação/histórico/comparação de equipas) em vez de
// duplicados — ver ResultsTab/CalibrationTab. "Conversa 1:1" (ponto 10) não
// é separador próprio: vive dentro de EvaluationDetailModal (ligada à
// EvaluationRequest da etapa ONE_ON_ONE), tal como "Objetivos" já vivia.
// "Relatórios" (11) e "Configurações" (12) são novos separadores —
// Relatórios espelha @Roles(ADMIN, RH) de GET /evaluations/reports/overview;
// Configurações é leitura MGMT_ROLES (mesmo nível de Escalas/Critérios/
// Modelos, que aqui são só agregados, não recriados).
const TABS = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Resumo das avaliações',
    icon: Star,
  },
  {
    id: 'evaluations',
    label: 'Avaliações',
    hint: 'Todas as avaliações',
    icon: ClipboardCheck,
    roles: MGMT_ROLES,
  },
  {
    id: 'cycles',
    label: 'Ciclos de Avaliação',
    hint: 'Períodos e campanhas',
    icon: Layers,
  },
  {
    id: 'templates',
    label: 'Modelos',
    hint: 'Formulários base',
    icon: Layers,
    roles: MGMT_ROLES,
  },
  {
    id: 'criteria',
    label: 'Critérios',
    hint: 'O que se avalia',
    icon: ListChecks,
    roles: MGMT_ROLES,
  },
  {
    id: 'competencies',
    label: 'Competências',
    hint: 'Níveis por pessoa',
    icon: Sparkles,
  },
  {
    id: 'formal',
    label: 'Avaliações Formais',
    hint: 'Processos oficiais',
    icon: ClipboardList,
  },
  {
    id: 'pending',
    label: 'Avaliações Pendentes',
    hint: 'Por preencher',
    icon: Clock,
  },
  {
    id: 'results',
    label: 'Resultados',
    hint: 'Notas e evolução',
    icon: BarChart2,
  },
  {
    id: 'analytics',
    label: 'Análises',
    hint: 'Tendências',
    icon: TrendingUp,
    roles: ADMIN_ROLES,
  },
  {
    id: 'calibration',
    label: 'Calibração',
    hint: 'Ajuste entre equipas',
    icon: Shield,
    roles: ADMIN_ROLES,
  },
  {
    id: 'reports',
    label: 'Relatórios',
    hint: 'Exportações',
    icon: FileBarChart,
    roles: ADMIN_ROLES,
  },
  {
    id: 'settings',
    label: 'Configurações',
    hint: 'Escalas e regras',
    icon: Settings,
    roles: MGMT_ROLES,
  },
];

export default function EvaluationsPage() {
  const role = useCurrentRole();
  const visibleTabs = filterByRole(TABS, role);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Avaliações
            </h1>
          </div>
          {/* "Novo Ciclo" (criar) vive dentro da própria CyclesTab
              (components/evaluation/CreateCycleModal.tsx → POST
              /evaluations/cycles). Distinto de evaluation360's próprio
              "Novo Ciclo" (components/evaluation360/CreateCycleModal.tsx),
              que fala com o módulo evaluation360 à parte
              (/evaluation360/cycles) — não confundir os dois. */}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <div className="bg-surface px-6 py-5">
          <PillTabsList items={visibleTabs} className="mx-auto max-w-7xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          {visibleTabs.some((t) => t.id === 'evaluations') && (
            <TabsContent value="evaluations">
              <EvaluationsTab />
            </TabsContent>
          )}
          <TabsContent value="cycles">
            <CyclesTab />
          </TabsContent>
          {visibleTabs.some((t) => t.id === 'templates') && (
            <TabsContent value="templates">
              <ModelsTab />
            </TabsContent>
          )}
          {visibleTabs.some((t) => t.id === 'criteria') && (
            <TabsContent value="criteria">
              <CriteriaTab />
            </TabsContent>
          )}
          <TabsContent value="competencies">
            <CompetenciesTab />
          </TabsContent>
          <TabsContent value="formal">
            <FormalEvaluationsTab />
          </TabsContent>
          <TabsContent value="pending">
            <PendingTab />
          </TabsContent>
          <TabsContent value="results">
            <ResultsTab />
          </TabsContent>
          {/* Análises/Calibração: nem montadas para quem não tem @Roles(ADMIN, RH)
              no backend — não só escondidas da TabsList — ver nota acima. */}
          {visibleTabs.some((t) => t.id === 'analytics') && (
            <TabsContent value="analytics">
              <AnalyticsTab />
            </TabsContent>
          )}
          {visibleTabs.some((t) => t.id === 'calibration') && (
            <TabsContent value="calibration">
              <CalibrationTab />
            </TabsContent>
          )}
          {visibleTabs.some((t) => t.id === 'reports') && (
            <TabsContent value="reports">
              <ReportsTab />
            </TabsContent>
          )}
          {visibleTabs.some((t) => t.id === 'settings') && (
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
