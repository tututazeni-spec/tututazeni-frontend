'use client';
// src/app/(dashboard)/roi-impact/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/roi-impact/ (mesmo padrão que components/content-library/
// page.tsx usa para as suas tabs). Ver memory
// project_innova_component_separation_audit.

import {
  BarChart2,
  BookOpen,
  Brain,
  DollarSign,
  Star,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ExecutiveTab } from '@/components/roi-impact/ExecutiveTab';
import { LearningTab } from '@/components/roi-impact/LearningTab';
import { PerformanceTab } from '@/components/roi-impact/PerformanceTab';
import { ProgramsTab } from '@/components/roi-impact/ProgramsTab';
import { RetentionTab } from '@/components/roi-impact/RetentionTab';
import { SimulatorTab } from '@/components/roi-impact/SimulatorTab';
import type { Tab } from '@/components/roi-impact/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'executive', label: 'Executivo', icon: DollarSign },
  { id: 'learning', label: 'Aprendizagem', icon: BookOpen },
  { id: 'retention', label: 'Retenção', icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'simulator', label: 'Simulador', icon: Brain },
  { id: 'programs', label: 'Programas', icon: BarChart2 },
];

export default function RoiImpactPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-success-subtle p-1.5">
                <DollarSign size={18} strokeWidth={1.75} className="text-success-ink" />
              </div>
              <h1 className="font-display text-xl font-bold text-ink">ROI & Impact</h1>
            </div>
            <p className="font-body text-sm text-ink-faint">
              Impacto financeiro · Kirkpatrick L1-L5 · Simulações · Programas
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="executive">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger key={t.id} value={t.id} className="gap-2 whitespace-nowrap">
                  <Icon size={15} strokeWidth={1.75} />
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
