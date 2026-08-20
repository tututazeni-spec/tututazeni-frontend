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
import { COLORS, typeColor } from './colors';
import { RadarChart } from './RadarChart';
import { CompetencyHeatmap } from './CompetencyHeatmap';
import { NineBoxGrid } from './NineBoxGrid';
import { OverviewTab } from './OverviewTab';
import { FeedbackTab } from './FeedbackTab';
import { EvaluationFormTab } from './EvaluationFormTab';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: '◈' },
  { id: 'radar', label: 'Radar 360°', icon: '◎' },
  { id: 'competencies', label: 'Competências', icon: '▣' },
  { id: 'feedback', label: 'Feedback', icon: '◆' },
  { id: 'ninebox', label: 'Nine Box', icon: '⊞' },
  { id: 'cycles', label: 'Ciclos', icon: '⟲' },
  { id: 'form', label: 'Avaliar', icon: '✦' },
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
                Comparação entre autoavaliação, outros avaliadores e benchmark
                do cargo
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
                  Legenda de Gaps
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
                              : COLORS.muted,
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
                  = overestima-se vs. outros
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
                Heatmap de Competências
              </h2>
              <p className="m-0 mt-1 text-sm text-ink-muted">
                Score por fonte de avaliador, gap e benchmark do cargo
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
                  {type.replace('_', ' ')}
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
                  Gestão de campanhas de avaliação 360°
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
    <div
      style={{ backgroundColor: COLORS.bg }}
      className="min-h-screen font-sans text-ink"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: ${COLORS.surface}; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }`}</style>

      {/* Header */}
      <div className="border-b border-border px-8 py-4 flex items-center gap-4 bg-canvas sticky top-0 z-100">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black text-canvas"
          style={{
            background:
              'linear-gradient(135deg, rgb(79, 70, 229), rgb(124, 58, 237))',
          }}
        >
          I
        </div>
        <div>
          <div className="text-base font-bold text-ink tracking-tight">
            INNOVA
          </div>
          <div className="text-xs text-ink-muted font-medium uppercase tracking-wider">
            Avaliação 360°
          </div>
        </div>
        <div className="ml-auto text-sm text-ink-muted">
          Ciclo:{' '}
          <strong style={{ color: 'rgb(129, 140, 248)' }}>{cycle.name}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-8 flex gap-1 overflow-x-auto bg-canvas">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4.5 py-3.5 text-sm font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-primary text-primary-subtle font-bold'
                : 'border-transparent text-ink-muted'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-6xl mx-auto">{renderTab()}</div>
    </div>
  );
}
