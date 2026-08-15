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
  Clock,
  Layers,
  Plus,
  Shield,
  Star,
  TrendingUp,
} from 'lucide-react';
import { AnalyticsTab } from '@/components/evaluation/AnalyticsTab';
import { CalibrationTab } from '@/components/evaluation/CalibrationTab';
import { CyclesTab } from '@/components/evaluation/CyclesTab';
import { OverviewTab } from '@/components/evaluation/OverviewTab';
import { PendingTab } from '@/components/evaluation/PendingTab';
import { ResultsTab } from '@/components/evaluation/ResultsTab';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Star },
  { id: 'cycles', label: 'Ciclos', icon: Layers },
  { id: 'pending', label: 'Pendentes', icon: Clock },
  { id: 'results', label: 'Resultados', icon: BarChart2 },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'calibration', label: 'Calibração', icon: Shield },
] as const;

export default function EvaluationsPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-primary-subtle p-1.5">
                <Star size={18} strokeWidth={1.75} className="text-primary" />
              </div>
              <h1 className="font-display text-xl font-bold text-ink">
                Avaliação 360°
              </h1>
            </div>
            <p className="font-body text-sm text-ink-faint">
              Ciclos · Formulários · Resultados · Calibração · Analytics
            </p>
          </div>
          <Button size="sm">
            <Plus size={14} strokeWidth={1.75} />
            Novo Ciclo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className="gap-2 whitespace-nowrap"
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
          <TabsContent value="pending">
            <PendingTab />
          </TabsContent>
          <TabsContent value="results">
            <ResultsTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
          <TabsContent value="calibration">
            <CalibrationTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
