// src/app/(dashboard)/analytics/page.tsx
'use client';

// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/analytics/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.
//
// Migrado para a fundação de design: pills de separador manuais passam
// a components/ui/Tabs (Radix) — TabsContent só monta a vista activa,
// mesmo comportamento que a renderização condicional anterior.
//
// NAV é filtrada por role antes de renderizar: cada separador só aparece a
// quem o endpoint principal por trás dele (em
// src/analytics/analytics.controller.ts) realmente deixa passar — evita
// mostrar um separador que só vai devolver 403 (ver constants.ts).

import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CircleCheck } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { NAV, TITLES } from '@/components/analytics/constants';
import { CompetencyGapsView } from '@/components/analytics/CompetencyGapsView';
import { CoursesPerformanceView } from '@/components/analytics/CoursesPerformanceView';
import { EngagementView } from '@/components/analytics/EngagementView';
import { HRDashboardView } from '@/components/analytics/HRDashboardView';
import { LearningAnalyticsView } from '@/components/analytics/LearningAnalyticsView';
import { ManagerView } from '@/components/analytics/ManagerView';
import { MyDashboardView } from '@/components/analytics/MyDashboardView';
import { OverviewView } from '@/components/analytics/OverviewView';
import { PDIAnalyticsView } from '@/components/analytics/PDIAnalyticsView';
import { PeopleAnalyticsView } from '@/components/analytics/PeopleAnalyticsView';
import { RisksView } from '@/components/analytics/RisksView';
import { ROIView } from '@/components/analytics/ROIView';
import { SnapshotsView } from '@/components/analytics/SnapshotsView';
import type { View } from '@/components/analytics/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// Subtítulo mostrado por baixo do título de cada aba, indexado pelo `id`
// definido em NAV (components/analytics/constants). Se algum id não estiver
// aqui, a aba mostra só o título.
const NAV_HINTS: Record<string, string> = {
  overview: 'Resumo geral',
  my: 'Os meus indicadores',
  manager: 'Visão da equipa',
  hr: 'Indicadores de RH',
  learning: 'Aprendizagem',
  courses: 'Desempenho dos cursos',
  pdi: 'Planos de desenvolvimento',
  competencies: 'Lacunas de competências',
  people: 'Análise de pessoas',
  engagement: 'Clima e satisfação',
  roi: 'Retorno do investimento',
  risks: 'Alertas e riscos',
  snapshots: 'Histórico de dados',
};
export default function AnalyticsPage() {
  const [view, setView] = useState<View>('overview');
  const role = useCurrentRole();

  const nav = useMemo(
    () => NAV.filter((n) => !n.roles || (role && n.roles.includes(role))),
    [role],
  );
const activeNav = nav.find((item) => item.id === view) ?? nav[0];
const ActiveIcon = activeNav?.icon as LucideIcon | undefined;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
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
      <h1 className="font-display text-xl font-semibold text-ink">
  Indicadores de Desempenho
</h1>
      {activeNav?.label && activeNav.label !== TITLES[view] && (
        <p className="mt-0.5 font-body text-xs text-ink-muted">
          {activeNav.label}
        </p>
      )}
    </div>
  </div>
</div>

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
               {/* Abas em "glassmorphism": contentor translúcido com desfoque
            (backdrop-blur) e botões em forma de pílula com ícone, título e
            subtítulo. A aba activa (data-[state=active] do Radix) ganha
            gradiente azul, sombra e um visto à direita. As manchas
            desfocadas atrás existem só para o efeito de vidro ser visível
            sobre o fundo claro. */}
        <div className="relative mb-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
          >
            <div className="absolute -left-16 top-0 h-40 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -right-10 bottom-0 h-40 w-72 rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div className="relative rounded-3xl border border-white/60 bg-white/50 p-3 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-xl">
            <TabsList className="flex h-auto w-full flex-wrap items-center justify-center gap-2 bg-transparent p-0">
              {nav.map((n) => {
                const Icon = n.icon;
                const hint = NAV_HINTS[n.id];
                return (
                  <TabsTrigger
                    key={n.id}
                    value={n.id}
                    className="group flex h-auto items-center gap-3 whitespace-nowrap rounded-full border border-white/70 bg-white/60 py-2 pl-2 pr-4 text-left text-ink shadow-sm backdrop-blur transition-all
                               hover:bg-white/80
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
                               data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/70 data-[state=active]:text-white data-[state=active]:shadow-lg"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-ink/70 group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                      <Icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-sm font-semibold">{n.label}</span>
                      {hint && (
                        <span className="text-xs opacity-70 group-data-[state=active]:opacity-85">
                          {hint}
                        </span>
                      )}
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

        <TabsContent value="overview">
          <OverviewView />
        </TabsContent>
        <TabsContent value="my">
          <MyDashboardView />
        </TabsContent>
        <TabsContent value="manager">
          <ManagerView />
        </TabsContent>
        <TabsContent value="hr">
          <HRDashboardView />
        </TabsContent>
        <TabsContent value="learning">
          <LearningAnalyticsView />
        </TabsContent>
        <TabsContent value="courses">
          <CoursesPerformanceView />
        </TabsContent>
        <TabsContent value="pdi">
          <PDIAnalyticsView />
        </TabsContent>
        <TabsContent value="competencies">
          <CompetencyGapsView />
        </TabsContent>
        <TabsContent value="people">
          <PeopleAnalyticsView />
        </TabsContent>
        <TabsContent value="engagement">
          <EngagementView />
        </TabsContent>
        <TabsContent value="roi">
          <ROIView />
        </TabsContent>
        <TabsContent value="risks">
          <RisksView />
        </TabsContent>
        <TabsContent value="snapshots">
          <SnapshotsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}