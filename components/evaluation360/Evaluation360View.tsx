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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: COLORS.text,
                }}
              >
                Radar de Competências 360°
              </h2>
              <p
                style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}
              >
                Comparação entre autoavaliação, outros avaliadores e benchmark
                do cargo
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gap: 24,
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  padding: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <RadarChart competencies={competencies} />
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: COLORS.muted,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 4,
                  }}
                >
                  Legenda de Gaps
                </div>
                {competencies.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: '#e2e8f0',
                        fontWeight: 600,
                      }}
                    >
                      {c.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color:
                          c.gap > 0.5
                            ? '#f59e0b'
                            : c.gap < -0.5
                              ? '#22c55e'
                              : COLORS.muted,
                      }}
                    >
                      {c.gap > 0
                        ? `▲ +${c.gap.toFixed(1)}`
                        : `▼ ${c.gap.toFixed(1)}`}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: '#f59e0b' }}>▲ positivo</span> =
                  overestima-se vs. outros
                  <br />
                  <span style={{ color: '#22c55e' }}>▼ negativo</span> =
                  subestima-se (ponto forte!)
                </div>
              </div>
            </div>
          </div>
        );
      case 'competencies':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: COLORS.text,
                }}
              >
                Heatmap de Competências
              </h2>
              <p
                style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}
              >
                Score por fonte de avaliador, gap e benchmark do cargo
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              {Object.entries(typeColor).map(([type, color]) => (
                <span
                  key={type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: COLORS.muted,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      display: 'inline-block',
                    }}
                  />
                  {type.replace('_', ' ')}
                </span>
              ))}
            </div>
            <div
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <CompetencyHeatmap competencies={competencies} />
            </div>
          </div>
        );
      case 'feedback':
        return <FeedbackTab feedbacks={feedbacks} />;
      case 'ninebox':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: COLORS.text,
                }}
              >
                Matriz Nine Box
              </h2>
              <p
                style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}
              >
                Performance vs Potencial · {nineBox.length} colaboradores
              </p>
            </div>
            <div
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: 24,
              }}
            >
              <NineBoxGrid entries={nineBox} />
            </div>
          </div>
        );
      case 'cycles':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 800,
                    color: COLORS.text,
                  }}
                >
                  Ciclos de Avaliação
                </h2>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: COLORS.muted,
                  }}
                >
                  Gestão de campanhas de avaliação 360°
                </p>
              </div>
              <button
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                + Novo Ciclo
              </button>
            </div>
            {cycles.map((c) => (
              <div
                key={c.id}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: '18px 24px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: COLORS.text,
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        marginTop: 2,
                      }}
                    >
                      {c.model} · {c.startDate} → {c.endDate}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 20,
                      background:
                        c.status === 'COMPLETED' ? '#14532d' : '#1e1b4b',
                      color: c.status === 'COMPLETED' ? '#4ade80' : '#818cf8',
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <div
                  style={{
                    background: '#1e2537',
                    borderRadius: 4,
                    height: 6,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((c.completedCount / c.participantsCount) * 100)}%`,
                      height: '100%',
                      background: '#4f46e5',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>
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
      style={{
        minHeight: '100vh',
        background: COLORS.bg,
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        color: COLORS.text,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #111827; } ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 3px; }`}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #0f1c30',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#08101f',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 900,
            color: '#fff',
          }}
        >
          I
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: COLORS.text,
              letterSpacing: '-0.01em',
            }}
          >
            INNOVA
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#475569',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Avaliação 360°
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: COLORS.muted }}>
          Ciclo: <strong style={{ color: '#818cf8' }}>{cycle.name}</strong>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          borderBottom: '1px solid #0f1c30',
          padding: '0 32px',
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          background: '#08101f',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '14px 18px',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#a5b4fc' : '#475569',
              cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '32px', maxWidth: 1280, margin: '0 auto' }}>
        {renderTab()}
      </div>
    </div>
  );
}
