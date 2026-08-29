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
  NineBoxEntry,
  ParticipantResult,
  TabId,
} from './types';
import { typeColor, typeLabel } from './colors';
import { RadarChart } from './RadarChart';
import { CompetencyHeatmap } from './CompetencyHeatmap';
import { NineBoxGrid } from './NineBoxGrid';
import { OverviewTab } from './OverviewTab';
import { FeedbackTab } from './FeedbackTab';
import { EvaluationFormTab } from './EvaluationFormTab';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  ClipboardCheck,
  Grid3x3,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Radar,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'radar', label: 'Radar 360°', icon: Radar },
  { id: 'competencies', label: 'Competências', icon: Grid3x3 },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'ninebox', label: 'Matriz 9 Box', icon: LayoutGrid },
  { id: 'cycles', label: 'Ciclos', icon: Layers },
  { id: 'form', label: 'Avaliar', icon: ClipboardCheck },
];

export interface Evaluation360ViewProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  result: ParticipantResult;
  cycle: CycleInfo;
  cycles: CycleInfo[];
  competencies: CompetencyScore[];
  nineBox: NineBoxEntry[];
  feedbacks: ContinuousFeedback[];
  formQuestions: EvaluationQuestion[];
}

export function Evaluation360View({
  activeTab,
  onTabChange,
  result,
  cycle,
  cycles,
  competencies,
  nineBox,
  feedbacks,
  formQuestions,
}: Evaluation360ViewProps) {
  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab result={result} cycle={cycle} />;
      case 'radar':
        return (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="m-0 text-lg font-bold text-ink">
                Radar de Competências 360°
              </h2>
              <p className="m-0 mt-1 text-sm text-ink-muted">
              </p>
            </div>
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
                {competencies.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border bg-surface px-3.5 py-2.5 flex justify-between items-center"
                  >
                    <span className="text-sm font-semibold text-ink">
                      {c.name}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{
                        color:
                          c.gap > 0.5
                            ? 'rgb(245, 158, 11)'
                            : c.gap < -0.5
                              ? 'rgb(34, 197, 94)'
                              : 'var(--color-ink-muted)',
                      }}
                    >
                      {c.gap > 0
                        ? `▲ +${c.gap.toFixed(1)}`
                        : `▼ ${c.gap.toFixed(1)}`}
                    </span>
                  </div>
                ))}
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
                Comparativa do Cargo
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
        return <FeedbackTab feedbacks={feedbacks} />;
      case 'ninebox':
        return (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="m-0 text-lg font-bold text-ink">
                Matriz Nine Box
              </h2>
              <p className="m-0 mt-1 text-sm text-ink-muted">
                Performance vs Potencial · {nineBox.length} colaboradores
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-6">
              <ErrorBoundary source="evaluation360.NineBoxGrid">
                <NineBoxGrid entries={nineBox} />
              </ErrorBoundary>
            </div>
          </div>
        );
      case 'cycles':
        return (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="m-0 text-lg font-bold text-ink">
                  Ciclos de Avaliação
                </h2>
                <p className="m-0 mt-1 text-sm text-ink-muted">
                </p>
              </div>
              <Button intent="primary" size="sm">
                + Novo Ciclo
              </Button>
            </div>
            {cycles.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {c.name}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {c.model} · {c.startDate} → {c.endDate}
                    </div>
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      background:
                        c.status === 'COMPLETED'
                          ? 'rgb(20, 83, 45)'
                          : 'rgb(30, 27, 75)',
                      color:
                        c.status === 'COMPLETED'
                          ? 'rgb(74, 222, 128)'
                          : 'rgb(129, 140, 248)',
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="bg-surface-sunken rounded h-1.5 mb-2 overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{
                      width: `${Math.round((c.completedCount / c.participantsCount) * 100)}%`,
                      background:
                        'linear-gradient(90deg, rgb(99, 102, 241), rgb(124, 58, 237))',
                    }}
                  />
                </div>
                <div className="text-xs text-ink-muted">
                  {c.completedCount}/{c.participantsCount} participantes
                  concluídos (
                  {Math.round((c.completedCount / c.participantsCount) * 100)}
                  %)
                </div>
              </div>
            ))}
          </div>
        );
      case 'form':
        return (
          <EvaluationFormTab
            questions={formQuestions}
            participantName={result.fullName}
          />
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
          <p className="mt-0.5 shrink-0 text-sm text-ink-muted">
            Ciclo: <strong className="text-ink">{cycle.name}</strong>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabId)}>
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl gap-0 overflow-x-auto">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={
                    i < TABS.length - 1
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
