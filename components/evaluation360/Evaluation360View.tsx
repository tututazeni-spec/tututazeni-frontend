// components/evaluation360/Evaluation360View.tsx
// Vista apresentacional da página de Avaliação 360º: cabeçalho, navegação
// por separadores e o conteúdo de cada separador. Todos os dados chegam por
// props — quem os obtém é o hook hooks/useEvaluation360.ts, consumido pelo
// container em app/(platform)/evaluation360/page.tsx (mesmo padrão usado em
// components/payslips/PayslipDetailView.tsx).
//
// Extraído de page.tsx porque a página inteira (1868 linhas) estava toda
// numa única função — ver memory project_innova_component_separation_audit.

'use client';

import type {
  CompetencyScore,
  ContinuousFeedback,
  CycleInfo,
  EvaluationQuestion,
  ParticipantProfile,
  ParticipantResult,
  TabId,
} from './types';
import { typeColor, typeLabel } from './colors';
import { RadarChart } from './RadarChart';
import { CompetencyHeatmap } from './CompetencyHeatmap';
import { OverviewTab } from './OverviewTab';
import { OverviewAdminTab } from './OverviewAdminTab';
import { EvaluationCyclesTab } from './EvaluationCyclesTab';
import { FeedbackTab } from './FeedbackTab';
import { EvaluationFormTab } from './EvaluationFormTab';
import { EvaluateOthersTab } from './EvaluateOthersTab';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { EVAL_OVERVIEW_ROLES } from '@/lib/roles';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  BarChart3,
  ClipboardCheck,
  Grid3x3,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Radar,
  UserCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Legenda de Lacunas (separador Radar): mostra a lacuna real (auto vs.
// outros) quando ambas as fontes existem; quando só uma existe ainda (ex.:
// auto-avaliação submetida mas ninguém avaliou este colaborador nesta
// competência), mostra essa pontuação parcial em vez de "Sem dados" — é
// dado real na mesma, só não dá para calcular a lacuna comparativa. Nunca
// inventa um valor (era a bug de antes: gap null a colapsar para "▼ 0.0").
function competencyGapDisplay(c: CompetencyScore): { text: string; color: string } {
  if (c.gap !== null) {
    const color =
      c.gap > 0.5 ? 'rgb(245, 158, 11)' : c.gap < -0.5 ? 'rgb(34, 197, 94)' : 'var(--color-ink-muted)';
    const text = c.gap > 0 ? `▲ +${c.gap.toFixed(1)}` : `▼ ${c.gap.toFixed(1)}`;
    return { text, color };
  }
  if (c.selfRaw !== null) return { text: `Auto: ${c.selfRaw.toFixed(1)}`, color: 'var(--color-ink-muted)' };
  if (c.othersRaw !== null)
    return { text: `Outros: ${c.othersRaw.toFixed(1)}`, color: 'var(--color-ink-muted)' };
  return { text: 'Sem dados', color: 'var(--color-ink-faint)' };
}

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'adminOverview', label: 'Painel Geral', icon: BarChart3 },
  { id: 'radar', label: 'Radar 360°', icon: Radar },
  { id: 'competencies', label: 'Competências', icon: Grid3x3 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'cycles', label: 'Avaliações 360°', icon: Layers },
  { id: 'selfassessment', label: 'Auto-avaliação', icon: UserCheck },
  { id: 'form', label: 'Avaliar', icon: ClipboardCheck },
];

export interface Evaluation360ViewProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  result: ParticipantResult | null;
  participant?: ParticipantProfile;
  cycle: CycleInfo | null;
  competencies: CompetencyScore[];
  feedbacks: ContinuousFeedback[];
  selfFormQuestions: EvaluationQuestion[];
  myId?: string;
  cycleId?: string;
}

export function Evaluation360View({
  activeTab,
  onTabChange,
  result,
  participant,
  cycle,
  competencies,
  feedbacks,
  selfFormQuestions,
  myId,
  cycleId,
}: Evaluation360ViewProps) {
  const role = useCurrentRole();
  // Espelha o @Roles de GET /evaluation360/overview — só quem gere o módulo
  // vê o painel agregado; o separador pessoal "Visão Geral" fica aberto a
  // todos (ver EVAL_OVERVIEW_ROLES em lib/roles.ts).
  const canSeeOverview = !!role && EVAL_OVERVIEW_ROLES.includes(role);
  const visibleTabs = TABS.filter((t) => t.id !== 'adminOverview' || canSeeOverview);
  const feedbackTargetId = result?.userId ?? myId;

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab result={result} participant={participant} cycle={cycle} />;
      case 'adminOverview':
        return canSeeOverview ? <OverviewAdminTab /> : null;
      case 'radar':
        return (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="m-0 text-lg font-bold text-ink">
                Radar de Competências 360°
              </h2>
            </div>
            {competencies.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface p-6 text-sm text-ink-muted">
                Ainda sem competências pontuadas para ti.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                <div className="rounded-xl border border-border bg-surface p-6 flex justify-center">
                  <ErrorBoundary source="evaluation360.RadarChart">
                    <RadarChart competencies={competencies} />
                  </ErrorBoundary>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-1">
                    Legenda de Lacunas
                  </div>
                  {competencies.map((c) => {
                    const { text, color } = competencyGapDisplay(c);
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border bg-surface px-3.5 py-2.5 flex justify-between items-center"
                      >
                        <span className="text-sm font-semibold text-ink">
                          {c.name}
                        </span>
                        <span className="text-sm font-bold" style={{ color }}>
                          {text}
                        </span>
                      </div>
                    );
                  })}
                  <div className="text-xs text-ink-muted mt-2 leading-relaxed">
                    <span style={{ color: 'rgb(245, 158, 11)' }}>▲ positivo</span>{' '}
                    = sobreestima-se vs. outros
                    <br />
                    <span style={{ color: 'rgb(34, 197, 94)' }}>
                      ▼ negativo
                    </span>{' '}
                    = subestima-se (ponto forte!)
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'competencies':
        return (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="m-0 text-lg font-bold text-ink">
                Mapa de Competências
              </h2>
              <p className="m-0 mt-1 text-sm text-ink-muted">
                Pontuação por fonte de avaliador, Lacuna e Referência
                Comparativa (média deste ciclo)
              </p>
            </div>
            <div className="flex gap-2 mb-1">
              {Object.entries(typeColor).map(([type, color]) => (
                <span
                  key={type}
                  className="flex items-center gap-1 text-xs text-ink-muted"
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  {typeLabel[type] ?? type}
                </span>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <ErrorBoundary source="evaluation360.CompetencyHeatmap">
                <CompetencyHeatmap competencies={competencies} />
              </ErrorBoundary>
            </div>
          </div>
        );
      case 'feedback':
        return feedbackTargetId ? <FeedbackTab feedbacks={feedbacks} /> : null;
      case 'cycles':
        return <EvaluationCyclesTab />;
      case 'selfassessment':
        return cycleId && myId ? (
          <EvaluationFormTab
            questions={selfFormQuestions}
            participantName="Eu"
            evaluatorRole="SELF"
            cycleId={cycleId}
            evaluateeId={myId}
          />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
            Ainda não existe nenhum ciclo de avaliação 360º activo.
          </div>
        );
      case 'form':
        return cycleId ? (
          <EvaluateOthersTab cycleId={cycleId} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-5 text-sm text-ink-muted">
            Ainda não existe nenhum ciclo de avaliação 360º activo.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body text-ink">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-ink">
            Avaliação 360°
          </h1>
          {cycle && (
            <p className="mt-0.5 shrink-0 text-sm text-ink-muted">
              Ciclo: <strong className="text-ink">{cycle.name}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabId)}>
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl gap-0 overflow-x-auto">
            {visibleTabs.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={
                    i < visibleTabs.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-6">{renderTab()}</div>
      </Tabs>
    </div>
  );
}
