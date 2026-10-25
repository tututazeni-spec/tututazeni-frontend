'use client';

import { useState } from 'react';
import Image from 'next/image';

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
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  Users,
  UsersRound,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList } from '@/components/ui/PillTabs';
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

// `hint` = subtítulo mostrado por baixo do título em cada aba.
const PANELS: {
  id: Panel;
  label: string;
  hint: string;
  icon: LucideIcon | null;
}[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    hint: 'Resumo geral',
    icon: BarChart2,
  },
  {
    id: 'headcount',
    label: 'Número de Colaboradores',
    hint: 'Efectivo actual',
    icon: Users,
  },
  {
    id: 'turnover',
    label: 'Rotatividade',
    hint: 'Saídas e retenção',
    icon: TrendingDown,
  },
  { id: 'performance', label: 'Performance', hint: 'Avaliações', icon: Star },
  {
    id: 'engagement',
    label: 'Engajamento',
    hint: 'Clima e satisfação',
    icon: Smile,
  },
  {
    id: 'skills',
    label: 'Competências',
    hint: 'Níveis e lacunas',
    icon: Wrench,
  },
  { id: 'training', label: 'Formação', hint: 'Planos e horas', icon: BookOpen },
  {
    id: 'compliance',
    label: 'Compliance',
    hint: 'Obrigações legais',
    icon: ShieldCheck,
  },
  { id: 'attendance', label: 'Presenças', hint: 'Assiduidade', icon: Clock },
  {
    id: 'payroll',
    label: 'Folha Salarial',
    hint: 'Custos e encargos',
    icon: Wallet,
  },
  {
    id: 'talent',
    label: 'Talento',
    hint: 'Potencial e sucessão',
    icon: Target,
  },
  {
    id: 'predictions',
    label: 'Previsões',
    hint: 'Tendências futuras',
    icon: Sparkles,
  },
  {
    id: 'correlations',
    label: 'Análise de Pessoas',
    hint: 'Cruzamento de dados',
    icon: UsersRound,
  },
];

export default function DashboardRhPage() {
  const [activePanel, setActivePanel] = useState<Panel>('overview');

  const activePanelConfig =
    PANELS.find((panel) => panel.id === activePanel) ?? PANELS[0];

  const ActiveIcon = activePanelConfig.icon;

  return (
    <div className="min-h-screen bg-surface">
      {/* Banner: mesmo desenho de app/(platform)/courses/page.tsx — a foto
          ocupa a largura toda, o gradiente azul-escuro #0F1F3D só cobre a metade
          inferior (o ecrã com os gráficos, à esquerda, fica intacto) e dá
          contraste ao título/botão; as abas sobem 2rem para cima da foto. */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <header className="relative h-44 overflow-hidden rounded-panel shadow-[0_8px_32px_rgba(15,31,61,0.18)] sm:h-56">
          <Image
            src="/images/dashboard-rh.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/35 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-10 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-panel bg-white/20 text-white">
                {ActiveIcon && (
                  <ActiveIcon
                    size={22}
                    strokeWidth={1.8}
                    className="transition-all duration-300"
                  />
                )}
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  Dashboard RH
                </h1>
                <p className="mt-0.5 font-body text-xs text-white/90">
                  {activePanelConfig.hint}
                </p>
              </div>
            </div>
          </div>
        </header>
      </div>

      <Tabs
        value={activePanel}
        onValueChange={(value) => setActivePanel(value as Panel)}
      >
        <div className="relative z-10 -mt-8 px-6 pb-5">
          <PillTabsList items={PANELS} className="mx-auto max-w-7xl" />
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
