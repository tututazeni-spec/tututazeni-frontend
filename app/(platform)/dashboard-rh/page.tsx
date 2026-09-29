'use client';

import { useState } from 'react';

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
  CircleCheck,
  Clock,
  RefreshCw,
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
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {ActiveIcon && (
                <ActiveIcon
                  size={22}
                  strokeWidth={1.8}
                  className="transition-all duration-300"
                />
              )}
            </div>

            <div>
              <h1 className="font-display text-xl font-bold text-ink">
                Dashboard RH
              </h1>
              <p className="mt-0.5 font-body text-xs text-ink-muted">
                {activePanelConfig.hint}
              </p>
            </div>
          </div>
          <IconButton
            icon={RefreshCw}
            label="Actualizar"
            intent="secondary"
            onClick={() => window.location.reload()}
          />
        </div>
      </div>

      <Tabs
        value={activePanel}
        onValueChange={(value) => setActivePanel(value as Panel)}
      >
        {/* Tabs — barra flutuante em "glassmorphism": contentor translúcido
            com desfoque (backdrop-blur) e botões em forma de pílula com
            ícone, título e subtítulo. A aba activa (data-[state=active]
            do Radix) ganha gradiente azul, sombra e um visto à direita.
            As manchas desfocadas atrás existem só para o efeito de vidro
            ser visível sobre o fundo claro. */}
        <div className="relative bg-surface px-6 py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
            <TabsList className="flex h-auto w-full flex-wrap items-center justify-center gap-2 bg-transparent p-0">
              {PANELS.map((p) => {
                const Icon = p.icon;
                return (
                  <TabsTrigger
                    key={p.id}
                    value={p.id}
                    className="group flex h-auto items-center gap-3 whitespace-nowrap rounded-full border border-white/70 bg-white/60 py-2 pl-2 pr-4 text-left text-ink shadow-sm backdrop-blur transition-all
                               hover:bg-white/80
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                               data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/70 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    {Icon && (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                        <Icon size={16} strokeWidth={1.75} />
                      </span>
                    )}
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold">{p.label}</span>
                      <span className="text-xs opacity-70 group-data-[state=active]:opacity-85">
                        {p.hint}
                      </span>
                    </span>
                    <CircleCheck
                      size={16}
                      strokeWidth={2}
                      className="hidden shrink-0 group-data-[state=active]:block"
                    />
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
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
