'use client';
// src/app/(dashboard)/dashboard-rh/page.tsx
//
// Container: gere o painel activo (via Tabs do Radix); delega dados+
// apresentação de cada painel aos componentes auto-contidos em
// components/dashboard-rh/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit e
// app/(platform)/dashboard/page.tsx (mesmo esqueleto header+Tabs, já
// migrado).

import {
  BarChart2,
  Brain,
  BookOpen,
  RefreshCw,
  Star,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { CorrelationsPanel } from '@/components/dashboard-rh/CorrelationsPanel';
import { HeadcountPanel } from '@/components/dashboard-rh/HeadcountPanel';
import { OverviewPanel } from '@/components/dashboard-rh/OverviewPanel';
import { PerformancePanel } from '@/components/dashboard-rh/PerformancePanel';
import { TalentPanel } from '@/components/dashboard-rh/TalentPanel';
import { TrainingPanel } from '@/components/dashboard-rh/TrainingPanel';
import type { Panel } from '@/components/dashboard-rh/types';

const PANELS: { id: Panel; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
  { id: 'headcount', label: 'Headcount', icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'training', label: 'Formação', icon: BookOpen },
  { id: 'talent', label: 'Talento', icon: Target },
  { id: 'correlations', label: 'People Analytics', icon: Brain },
];

export default function DashboardRhPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="rounded-control bg-primary-subtle p-1.5">
                <Users size={18} strokeWidth={1.75} className="text-primary" />
              </div>
              <h1 className="font-display text-xl font-bold text-ink">
                Dashboard RH
              </h1>
              <Badge intent="info">People Analytics</Badge>
            </div>
            <p className="font-body text-sm text-ink-faint">
              Centro de comando · Headcount · Performance · Talento · Formação
            </p>
          </div>
          <IconButton
            icon={RefreshCw}
            label="Actualizar"
            intent="secondary"
            onClick={() => window.location.reload()}
          />
        </div>
      </div>

      <Tabs defaultValue="overview">
        {/* Tabs */}
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto">
            {PANELS.map((p) => {
              const Icon = p.icon;
              return (
                <TabsTrigger
                  key={p.id}
                  value={p.id}
                  className="gap-2 whitespace-nowrap"
                >
                  <Icon size={14} strokeWidth={1.75} />
                  {p.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="overview">
            <OverviewPanel />
          </TabsContent>
          <TabsContent value="headcount">
            <HeadcountPanel />
          </TabsContent>
          <TabsContent value="performance">
            <PerformancePanel />
          </TabsContent>
          <TabsContent value="training">
            <TrainingPanel />
          </TabsContent>
          <TabsContent value="talent">
            <TalentPanel />
          </TabsContent>
          <TabsContent value="correlations">
            <CorrelationsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
