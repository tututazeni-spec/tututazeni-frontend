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
  Layers,
  Shield,
  Star,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsTab } from '@/components/evaluation/AnalyticsTab';
import { CalibrationTab } from '@/components/evaluation/CalibrationTab';
import { CyclesTab } from '@/components/evaluation/CyclesTab';
import { EvaluationsTab } from '@/components/evaluation/EvaluationsTab';
import { FormalEvaluationsTab } from '@/components/evaluation/FormalEvaluationsTab';
import { OverviewTab } from '@/components/evaluation/OverviewTab';
import { PendingTab } from '@/components/evaluation/PendingTab';
import { ResultsTab } from '@/components/evaluation/ResultsTab';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, MGMT_ROLES, filterByRole } from '@/lib/roles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

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
// Ordem/nomenclatura segue docs/modulo_evaluation.md ponto 0 para as abas
// já construídas (0-3): Visão Geral, Avaliações, Ciclos de Avaliação. As
// restantes abas do doc (Modelos/Critérios/Competências/Objetivos&Metas/
// Autoavaliações/Relatórios/Configurações) ficam para próximas partes —
// não criadas aqui como stubs vazios. "Avaliações Formais" (quizzes/exames,
// backend src/assessments) e "Análises" já existiam antes deste doc e não
// fazem parte da IA dele; mantidas tal como estavam.
const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Star },
  { id: 'evaluations', label: 'Avaliações', icon: ClipboardCheck, roles: MGMT_ROLES },
  { id: 'cycles', label: 'Ciclos de Avaliação', icon: Layers },
  { id: 'formal', label: 'Avaliações Formais', icon: ClipboardList },
  { id: 'pending', label: 'Pendentes', icon: Clock },
  { id: 'results', label: 'Resultados', icon: BarChart2 },
  { id: 'analytics', label: 'Análises', icon: TrendingUp, roles: ADMIN_ROLES },
  { id: 'calibration', label: 'Calibração', icon: Shield, roles: ADMIN_ROLES },
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

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
            {visibleTabs.map((t, i) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={
                    i < visibleTabs.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
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
        </div>
      </Tabs>
    </div>
  );
}
