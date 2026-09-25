'use client';
// src/app/(dashboard)/roi-impact/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/roi-impact/ (mesmo padrão que components/content-library/
// page.tsx usa para as suas tabs). Ver memory
// project_innova_component_separation_audit.

import {
  BarChart3,
  BookOpen,
  Briefcase,
  Calculator,
  ClipboardList,
  Coins,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  GraduationCap,
  LineChart,
  Scale,
  Settings,
  Star,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ExecutiveTab } from '@/components/roi-impact/ExecutiveTab';
import { RoiAnalysisTab } from '@/components/roi-impact/RoiAnalysisTab';
import { ImpactTab } from '@/components/roi-impact/ImpactTab';
import { EvaluationModelsTab } from '@/components/roi-impact/EvaluationModelsTab';
import { CostsTab } from '@/components/roi-impact/CostsTab';
import { KpisTab } from '@/components/roi-impact/KpisTab';
import { CorrelationsTab } from '@/components/roi-impact/CorrelationsTab';
import { ScenariosTab } from '@/components/roi-impact/ScenariosTab';
import { BenchmarksTab } from '@/components/roi-impact/BenchmarksTab';
import { ReportsTab } from '@/components/roi-impact/ReportsTab';
import { ConfigTab } from '@/components/roi-impact/ConfigTab';
import { LearningTab } from '@/components/roi-impact/LearningTab';
import { PerformanceTab } from '@/components/roi-impact/PerformanceTab';
import { ProgramsTab } from '@/components/roi-impact/ProgramsTab';
import { RetentionTab } from '@/components/roi-impact/RetentionTab';
import { SimulatorTab } from '@/components/roi-impact/SimulatorTab';
import type { Tab } from '@/components/roi-impact/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// docs/roi-impact.md — "Visão Geral", "ROI da Formação", "Impacto no
// Negócio", "Modelos de Avaliação", "Custos & Investimento", "Indicadores
// & KPIs", "Correlações", "Cenários & Simulações", "Benchmarks",
// "Relatórios" e "Configurações" (§1-11) já seguem a ordem/nome do spec; as
// restantes abas (Aprendizagem/Retenção/Performance/Simulador/Programas) são
// as fases seguintes do remodel e mantêm-se por agora com os nomes/dados
// legados — "Simulador" é o what-if de taxa de conclusão pré-existente,
// distinto de "Cenários & Simulações" (§8), que projecta o ROI de uma
// iniciativa futura ainda não executada.
const TABS: { id: Tab; label: string; icon: LucideIcon | null }[] = [
  { id: 'executive', label: 'Visão Geral', icon: Briefcase },
  { id: 'roi-analysis', label: 'ROI da Formação', icon: LineChart },
  { id: 'impact', label: 'Impacto no Negócio', icon: Target },
  { id: 'evaluation-models', label: 'Modelos de Avaliação', icon: ClipboardList },
  { id: 'costs', label: 'Custos & Investimento', icon: Coins },
  { id: 'kpis', label: 'Indicadores & KPIs', icon: Gauge },
  { id: 'correlations', label: 'Correlações', icon: GitCompareArrows },
  { id: 'scenarios', label: 'Cenários & Simulações', icon: FlaskConical },
  { id: 'benchmarks', label: 'Benchmarks', icon: Scale },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  { id: 'config', label: 'Configurações', icon: Settings },
  { id: 'learning', label: 'Aprendizagem', icon: BookOpen },
  { id: 'retention', label: 'Retenção', icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'simulator', label: 'Simulador', icon: Calculator },
  { id: 'programs', label: 'Programas', icon: GraduationCap },
];

export default function RoiImpactPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink">ROI & Impacto</h1>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="executive">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={
                    i < TABS.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  {Icon && <Icon size={15} strokeWidth={1.75} />}
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="executive">
            <ExecutiveTab />
          </TabsContent>
          <TabsContent value="roi-analysis">
            <RoiAnalysisTab />
          </TabsContent>
          <TabsContent value="impact">
            <ImpactTab />
          </TabsContent>
          <TabsContent value="evaluation-models">
            <EvaluationModelsTab />
          </TabsContent>
          <TabsContent value="costs">
            <CostsTab />
          </TabsContent>
          <TabsContent value="kpis">
            <KpisTab />
          </TabsContent>
          <TabsContent value="correlations">
            <CorrelationsTab />
          </TabsContent>
          <TabsContent value="scenarios">
            <ScenariosTab />
          </TabsContent>
          <TabsContent value="benchmarks">
            <BenchmarksTab />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>
          <TabsContent value="config">
            <ConfigTab />
          </TabsContent>
          <TabsContent value="learning">
            <LearningTab />
          </TabsContent>
          <TabsContent value="retention">
            <RetentionTab />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>
          <TabsContent value="simulator">
            <SimulatorTab />
          </TabsContent>
          <TabsContent value="programs">
            <ProgramsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
