'use client';
// src/app/(dashboard)/evaluations/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/evaluation/ (mesmo padrão que components/engagement/page.tsx
// e components/payslips/page.tsx usam). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import {
  BarChart2,
  ClipboardList,
  Clock,
  Layers,
  Plus,
  Shield,
  Star,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsTab } from '@/components/evaluation/AnalyticsTab';
import { CalibrationTab } from '@/components/evaluation/CalibrationTab';
import { CreateCycleModal } from '@/components/evaluation/CreateCycleModal';
import { CyclesTab } from '@/components/evaluation/CyclesTab';
import { FormalEvaluationsTab } from '@/components/evaluation/FormalEvaluationsTab';
import { OverviewTab } from '@/components/evaluation/OverviewTab';
import { PendingTab } from '@/components/evaluation/PendingTab';
import { ResultsTab } from '@/components/evaluation/ResultsTab';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, filterByRole } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
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
const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Star },
  { id: 'cycles', label: 'Ciclos', icon: Layers },
  { id: 'formal', label: 'Avaliações Formais', icon: ClipboardList },
  { id: 'pending', label: 'Pendentes', icon: Clock },
  { id: 'results', label: 'Resultados', icon: BarChart2 },
  { id: 'analytics', label: 'Análises', icon: TrendingUp, roles: ADMIN_ROLES },
  { id: 'calibration', label: 'Calibração', icon: Shield, roles: ADMIN_ROLES },
];

export default function EvaluationsPage() {
  const role = useCurrentRole();
  // Enquanto a role ainda não chegou (arranque pós-login/reload) tratamos
  // como não-admin — o botão aparece assim que /auth/me resolve. Espelha o
  // @Roles(ADMIN, RH) de POST /evaluations/cycles.
  const canCreateCycle = !!role && ADMIN_ROLES.includes(role);
  const visibleTabs = filterByRole(TABS, role);
  const [showCreate, setShowCreate] = useState(false);

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
          {canCreateCycle && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} strokeWidth={1.75} />
              Novo Ciclo
            </Button>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateCycleModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => setShowCreate(false)}
        />
      )}

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
