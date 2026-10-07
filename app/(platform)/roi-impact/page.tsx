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
  Briefcase,
  ClipboardList,
  Coins,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  LineChart,
  Scale,
  Settings,
  Target,
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
import type { Tab } from '@/components/roi-impact/types';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList } from '@/components/ui/PillTabs';

// docs/roi-impact.md — "Visão Geral", "ROI da Formação", "Impacto no
// Negócio", "Modelos de Avaliação", "Custos & Investimento", "Indicadores
// & KPIs", "Correlações", "Cenários & Simulações", "Benchmarks",
// "Relatórios" e "Configurações" (§1-11) seguem a ordem/nome do spec.
const TABS: {
  id: Tab;
  label: string;
  hint?: string;
  icon: LucideIcon | null;
}[] = [
  {
    id: 'executive',
    label: 'Visão Geral',
    hint: 'Resumo executivo',
    icon: Briefcase,
  },
  {
    id: 'roi-analysis',
    label: 'ROI da Formação',
    hint: 'Retorno do investimento',
    icon: LineChart,
  },
  {
    id: 'impact',
    label: 'Impacto no Negócio',
    hint: 'Resultados reais',
    icon: Target,
  },
  {
    id: 'evaluation-models',
    label: 'Modelos de Avaliação',
    hint: 'Kirkpatrick e afins',
    icon: ClipboardList,
  },
  {
    id: 'costs',
    label: 'Custos & Investimento',
    hint: 'Orçamento e gastos',
    icon: Coins,
  },
  {
    id: 'kpis',
    label: 'Indicadores & KPIs',
    hint: 'Métricas-chave',
    icon: Gauge,
  },
  {
    id: 'correlations',
    label: 'Correlações',
    hint: 'Formação vs. resultados',
    icon: GitCompareArrows,
  },
  {
    id: 'scenarios',
    label: 'Cenários & Simulações',
    hint: 'E se…?',
    icon: FlaskConical,
  },
  {
    id: 'benchmarks',
    label: 'Indicadores de Referência',
    hint: 'Benchmarks',
    icon: Scale,
  },
  { id: 'reports', label: 'Relatórios', hint: 'Exportações', icon: BarChart3 },
  { id: 'config', label: 'Configurações', hint: 'Parâmetros', icon: Settings },
];

export default function RoiImpactPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink">
                ROI & Impacto
              </h1>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="executive">
        <div className="bg-surface px-6 py-5">
          <PillTabsList items={TABS} className="mx-auto max-w-7xl" />
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
        </div>
      </Tabs>
    </div>
  );
}
