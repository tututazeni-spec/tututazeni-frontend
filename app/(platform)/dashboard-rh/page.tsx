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
  BookOpen,
  Clock,
  RefreshCw,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UsersRound } from 'lucide-react';
import { IconButton } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { AttendancePanel } from '@/components/dashboard-rh/AttendancePanel';
import { CompliancePanel } from '@/components/dashboard-rh/CompliancePanel';
import { CorrelationsPanel } from '@/components/dashboard-rh/CorrelationsPanel';
import { EngagementPanel } from '@/components/dashboard-rh/EngagementPanel';
import { HeadcountPanel } from '@/components/dashboard-rh/HeadcountPanel';
import { OverviewPanel } from '@/components/dashboard-rh/OverviewPanel';
import { PayrollPanel } from '@/components/dashboard-rh/PayrollPanel';
import { PerformancePanel } from '@/components/dashboard-rh/PerformancePanel';
import { PredictionsPanel } from '@/components/dashboard-rh/PredictionsPanel';
import { SkillsPanel } from '@/components/dashboard-rh/SkillsPanel';
import { TalentPanel } from '@/components/dashboard-rh/TalentPanel';
import { TrainingPanel } from '@/components/dashboard-rh/TrainingPanel';
import { TurnoverPanel } from '@/components/dashboard-rh/TurnoverPanel';
import type { Panel } from '@/components/dashboard-rh/types';

const PANELS: { id: Panel; label: string; icon: LucideIcon | null }[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
  { id: 'headcount', label: 'Número de Colaboradores', icon: Users },
  { id: 'turnover', label: 'Rotatividade', icon: TrendingDown },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'engagement', label: 'Engagement', icon: Smile },
  { id: 'skills', label: 'Competências', icon: Wrench },
  { id: 'training', label: 'Formação', icon: BookOpen },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'attendance', label: 'Presenças', icon: Clock },
  { id: 'payroll', label: 'Folha Salarial', icon: Wallet },
  { id: 'talent', label: 'Talento', icon: Target },
  { id: 'predictions', label: 'Previsões', icon: Sparkles },
  { id: 'correlations', label: 'Análise de Pessoas', icon: UsersRound },
];

export default function DashboardRhPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Dashboard RH
            </h1>
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
          <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
            {PANELS.map((p, i) => {
              const Icon = p.icon;
              return (
                <TabsTrigger
                  key={p.id}
                  value={p.id}
                  className={
                    i < PANELS.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  {Icon && <Icon size={14} strokeWidth={1.75} />}
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
          <TabsContent value="turnover">
            <TurnoverPanel />
          </TabsContent>
          <TabsContent value="performance">
            <PerformancePanel />
          </TabsContent>
          <TabsContent value="engagement">
            <EngagementPanel />
          </TabsContent>
          <TabsContent value="skills">
            <SkillsPanel />
          </TabsContent>
          <TabsContent value="training">
            <TrainingPanel />
          </TabsContent>
          <TabsContent value="compliance">
            <CompliancePanel />
          </TabsContent>
          <TabsContent value="attendance">
            <AttendancePanel />
          </TabsContent>
          <TabsContent value="payroll">
            <PayrollPanel />
          </TabsContent>
          <TabsContent value="talent">
            <TalentPanel />
          </TabsContent>
          <TabsContent value="predictions">
            <PredictionsPanel />
          </TabsContent>
          <TabsContent value="correlations">
            <CorrelationsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
