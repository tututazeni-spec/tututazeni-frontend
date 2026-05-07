// ============================================================
// INNOVA PLATFORM — AVALIAÇÃO 360º — FRONTEND PAGE
// src/pages/evaluation360/evaluation360.page.tsx
// ============================================================

'use client';

import { useState, useMemo } from 'react';

// ─── TYPES ───────────────────────────────────────────────────
type EvaluatorRole = 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE';
type AlertType = 'STRENGTH' | 'GAP' | 'INFO';
type TabId = 'overview' | 'radar' | 'competencies' | 'feedback' | 'ninebox' | 'cycles' | 'form';

interface CompetencyScore {
  id: string;
  name: string;
  category: string;
  type: 'HARD_SKILL' | 'SOFT_SKILL' | 'LEADERSHIP' | 'VITALITY';
  selfScore: number;
  othersScore: number; // média ponderada dos outros avaliadores
  managerScore: number;
  peerScore: number;
  gap: number; // selfScore - othersScore (positivo = overestima-se)
  benchmark: number; // média do cargo/nível
}

interface ParticipantResult {
  userId: string;
  fullName: string;
  position: string;
  department: string;
  overallScore: number;
  weightedScore: number;
  selfScore: number;
  managerScore: number;
  peerScore: number;
  competencies: CompetencyScore[];
  strengths: CompetencyScore[];
  gaps: CompetencyScore[];
  isEligiblePromotion: boolean;
  isEligibleBonus: boolean;
}

interface CycleInfo {
  id: string;
  name: string;
  model: string;
  status: string;
  startDate: string;
  endDate: string;
  participantsCount: number;
  completedCount: number;
}

interface NineBoxEntry {
  participantId: string;
  name: string;
  performance: 'LOW' | 'MID' | 'HIGH';
  potential: 'LOW' | 'MID' | 'HIGH';
  score: number;
}

interface ContinuousFeedback {
  id: string;
  fromName: string;
  type: 'RECOGNITION' | 'DEVELOPMENT' | 'CHECK_IN';
  message: string;
  competency?: string;
  createdAt: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────
const MOCK_COMPETENCIES: CompetencyScore[] = [
  { id: '1', name: 'Comunicação', category: 'Interpessoal', type: 'SOFT_SKILL', selfScore: 4.2, othersScore: 3.6, managerScore: 3.5, peerScore: 3.7, gap: 0.6, benchmark: 3.8 },
  { id: '2', name: 'Liderança', category: 'Gestão', type: 'LEADERSHIP', selfScore: 3.8, othersScore: 4.1, managerScore: 4.3, peerScore: 3.9, gap: -0.3, benchmark: 3.5 },
  { id: '3', name: 'Pensamento Estratégico', category: 'Cognitivo', type: 'HARD_SKILL', selfScore: 4.0, othersScore: 3.8, managerScore: 4.0, peerScore: 3.7, gap: 0.2, benchmark: 3.6 },
  { id: '4', name: 'Trabalho em Equipa', category: 'Interpessoal', type: 'SOFT_SKILL', selfScore: 3.5, othersScore: 4.3, managerScore: 4.5, peerScore: 4.2, gap: -0.8, benchmark: 4.0 },
  { id: '5', name: 'Resiliência', category: 'Comportamental', type: 'SOFT_SKILL', selfScore: 4.5, othersScore: 4.0, managerScore: 4.0, peerScore: 3.9, gap: 0.5, benchmark: 3.7 },
  { id: '6', name: 'Inovação', category: 'Cognitivo', type: 'HARD_SKILL', selfScore: 3.2, othersScore: 3.4, managerScore: 3.3, peerScore: 3.5, gap: -0.2, benchmark: 3.2 },
  { id: '7', name: 'Foco em Resultados', category: 'Execução', type: 'HARD_SKILL', selfScore: 4.3, othersScore: 4.4, managerScore: 4.6, peerScore: 4.3, gap: -0.1, benchmark: 4.1 },
  { id: '8', name: 'Bem-estar e Disciplina', category: 'Vitalidade', type: 'VITALITY', selfScore: 3.9, othersScore: 4.0, managerScore: 4.0, peerScore: 4.0, gap: -0.1, benchmark: 3.5 },
];

const MOCK_RESULT: ParticipantResult = {
  userId: 'u1',
  fullName: 'Maria João Santos',
  position: 'Coordenadora de Projectos',
  department: 'Operações',
  overallScore: 3.95,
  weightedScore: 4.02,
  selfScore: 3.93,
  managerScore: 4.15,
  peerScore: 3.88,
  competencies: MOCK_COMPETENCIES,
  strengths: [MOCK_COMPETENCIES[6], MOCK_COMPETENCIES[3], MOCK_COMPETENCIES[1]],
  gaps: [MOCK_COMPETENCIES[5], MOCK_COMPETENCIES[0], MOCK_COMPETENCIES[4]],
  isEligiblePromotion: true,
  isEligibleBonus: true,
};

const MOCK_CYCLE: CycleInfo = {
  id: 'c1', name: 'Avaliação Semestral 2025 — S1',
  model: 'DEG_360', status: 'COMPLETED',
  startDate: '2025-01-15', endDate: '2025-03-31',
  participantsCount: 84, completedCount: 79,
};

const MOCK_NINE_BOX: NineBoxEntry[] = [
  { participantId: 'u1', name: 'Maria João', performance: 'HIGH', potential: 'HIGH', score: 4.02 },
  { participantId: 'u2', name: 'Carlos Silva', performance: 'HIGH', potential: 'MID', score: 3.85 },
  { participantId: 'u3', name: 'Ana Pinto', performance: 'MID', potential: 'HIGH', score: 3.60 },
  { participantId: 'u4', name: 'João Ferreira', performance: 'MID', potential: 'MID', score: 3.40 },
  { participantId: 'u5', name: 'Sofia Lima', performance: 'LOW', potential: 'MID', score: 2.90 },
  { participantId: 'u6', name: 'Rui Costa', performance: 'HIGH', potential: 'LOW', score: 3.70 },
  { participantId: 'u7', name: 'Diana Martins', performance: 'MID', potential: 'LOW', score: 3.10 },
  { participantId: 'u8', name: 'Pedro Alves', performance: 'LOW', potential: 'LOW', score: 2.50 },
  { participantId: 'u9', name: 'Filipa Gomes', performance: 'LOW', potential: 'HIGH', score: 3.20 },
];

const MOCK_FEEDBACKS: ContinuousFeedback[] = [
  { id: 'f1', fromName: 'Carlos Silva', type: 'RECOGNITION', message: 'Excelente apresentação ao cliente ontem. Demonstrou clareza e confiança nas respostas.', competency: 'Comunicação', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'f2', fromName: 'Gestora Ana Rodrigues', type: 'DEVELOPMENT', message: 'Sugiro que te foque mais em delegar tarefas operacionais para te libertares para o estratégico.', competency: 'Liderança', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'f3', fromName: 'Sofia Lima', type: 'RECOGNITION', message: 'Sempre disponível para apoiar a equipa. Uma referência em trabalho colaborativo!', competency: 'Trabalho em Equipa', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
];

// ─── UTILITY ─────────────────────────────────────────────────
const COLORS = {
  self: '#818cf8',
  manager: '#34d399',
  peer: '#60a5fa',
  benchmark: '#f59e0b44',
  bg: '#080d19',
  surface: '#111827',
  border: '#1e2a3a',
  text: '#f1f5f9',
  muted: '#64748b',
  accent: '#6366f1',
};

const typeColor: Record<string, string> = {
  HARD_SKILL: '#3b82f6', SOFT_SKILL: '#8b5cf6',
  LEADERSHIP: '#f59e0b', VITALITY: '#22c55e',
};

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

function scoreColor(score: number): string {
  if (score >= 4.2) return '#22c55e';
  if (score >= 3.5) return '#60a5fa';
  if (score >= 2.5) return '#f59e0b';
  return '#ef4444';
}

// ─── RADAR CHART SVG ─────────────────────────────────────────
function RadarChart({ competencies }: { competencies: CompetencyScore[] }) {
  const cx = 220; const cy = 220; const r = 160;
  const n = competencies.length;
  const maxVal = 5;

  const angleStep = (2 * Math.PI) / n;
  const toXY = (idx: number, val: number) => {
    const angle = idx * angleStep - Math.PI / 2;
    const dist = (val / maxVal) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const labelXY = (idx: number) => {
    const angle = idx * angleStep - Math.PI / 2;
    const dist = r + 28;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const polyPath = (vals: number[], color: string, opacity = 1) => {
    const pts = vals.map((v, i) => toXY(i, v));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
    return { d, color, opacity };
  };

  // Grid circles
  const gridLevels = [1, 2, 3, 4, 5];

  // Axis lines
  const axes = competencies.map((_, i) => {
    const end = toXY(i, maxVal);
    return { x1: cx, y1: cy, x2: end.x, y2: end.y };
  });

  const selfPath = polyPath(competencies.map((c) => c.selfScore), COLORS.self, 0.15);
  const othersPath = polyPath(competencies.map((c) => c.othersScore), COLORS.manager, 0.15);
  const benchPath = polyPath(competencies.map((c) => c.benchmark), COLORS.benchmark, 0.1);

  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="0 0 440 440" width="100%" style={{ maxWidth: 460 }}>
        {/* Grid */}
        {gridLevels.map((level) => {
          const pts = competencies.map((_, i) => toXY(i, level));
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
          return <path key={level} d={d} fill="none" stroke="#1e2a3a" strokeWidth={level === 5 ? 1.5 : 0.8} strokeDasharray={level < 5 ? '4 4' : undefined} />;
        })}
        {/* Grid labels */}
        {[1, 2, 3, 4, 5].map((v) => (
          <text key={v} x={cx + 6} y={cy - (v / maxVal) * r + 4} fontSize={9} fill="#374151">{v}</text>
        ))}
        {/* Axis lines */}
        {axes.map((ax, i) => (
          <line key={i} x1={ax.x1} y1={ax.y1} x2={ax.x2} y2={ax.y2} stroke="#1e2a3a" strokeWidth={1} />
        ))}
        {/* Benchmark area */}
        <path d={benchPath.d} fill="#f59e0b" fillOpacity={0.06} stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 3" />
        {/* Others area */}
        <path d={othersPath.d} fill={COLORS.manager} fillOpacity={0.12} stroke={COLORS.manager} strokeWidth={2} />
        {/* Self area */}
        <path d={selfPath.d} fill={COLORS.self} fillOpacity={0.18} stroke={COLORS.self} strokeWidth={2} strokeDasharray="6 3" />
        {/* Data points — others */}
        {competencies.map((c, i) => {
          const pt = toXY(i, c.othersScore);
          return (
            <circle key={`o${i}`} cx={pt.x} cy={pt.y} r={hovered === i ? 7 : 5}
              fill={COLORS.manager} stroke="#0f1c30" strokeWidth={2}
              style={{ cursor: 'pointer', transition: 'r 0.15s' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Data points — self */}
        {competencies.map((c, i) => {
          const pt = toXY(i, c.selfScore);
          return (
            <circle key={`s${i}`} cx={pt.x} cy={pt.y} r={hovered === i ? 6 : 4}
              fill={COLORS.self} stroke="#0f1c30" strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Axis labels */}
        {competencies.map((c, i) => {
          const lp = labelXY(i);
          const isHovered = hovered === i;
          return (
            <text key={i} x={lp.x} y={lp.y}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={isHovered ? 12 : 10}
              fontWeight={isHovered ? 700 : 500}
              fill={isHovered ? '#a5b4fc' : '#94a3b8'}
              style={{ transition: 'all 0.15s', cursor: 'pointer' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            >
              {c.name.length > 12 ? c.name.slice(0, 11) + '…' : c.name}
            </text>
          );
        })}
        {/* Hover tooltip */}
        {hovered !== null && (() => {
          const c = competencies[hovered];
          const pt = toXY(hovered, (c.selfScore + c.othersScore) / 2);
          const tx = pt.x > cx ? pt.x - 90 : pt.x + 10;
          const ty = pt.y > cy ? pt.y - 70 : pt.y + 10;
          return (
            <g>
              <rect x={tx} y={ty} width={100} height={62} rx={6} fill="#0f172a" stroke="#312e81" strokeWidth={1} />
              <text x={tx + 8} y={ty + 16} fontSize={9} fill="#818cf8" fontWeight={700}>{c.name}</text>
              <text x={tx + 8} y={ty + 30} fontSize={9} fill={COLORS.self}>Auto: {c.selfScore.toFixed(1)}</text>
              <text x={tx + 8} y={ty + 43} fontSize={9} fill={COLORS.manager}>Outros: {c.othersScore.toFixed(1)}</text>
              <text x={tx + 8} y={ty + 56} fontSize={9} fill={c.gap > 0.3 ? '#f59e0b' : c.gap < -0.3 ? '#22c55e' : '#64748b'}>
                Gap: {c.gap > 0 ? '+' : ''}{c.gap.toFixed(1)}
              </text>
            </g>
          );
        })()}
      </svg>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        {[
          { color: COLORS.self, label: 'Autoavaliação', dash: true },
          { color: COLORS.manager, label: 'Outros avaliadores', dash: false },
          { color: '#f59e0b', label: 'Benchmark do cargo', dash: true },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={24} height={4}>
              {l.dash
                ? <line x1={0} y1={2} x2={24} y2={2} stroke={l.color} strokeWidth={2} strokeDasharray="5 3" />
                : <line x1={0} y1={2} x2={24} y2={2} stroke={l.color} strokeWidth={2} />
              }
            </svg>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COMPETENCY HEATMAP ───────────────────────────────────────
function CompetencyHeatmap({ competencies }: { competencies: CompetencyScore[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: COLORS.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.border}` }}>Competência</th>
            {['Auto', 'Gestor', 'Pares', 'Média', 'Gap', 'Benchmark'].map((h) => (
              <th key={h} style={{ textAlign: 'center', padding: '10px 12px', fontSize: 11, color: COLORS.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${COLORS.border}`, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {competencies.map((c, i) => {
            const gapColor = c.gap > 0.5 ? '#f59e0b' : c.gap < -0.5 ? '#22c55e' : COLORS.muted;
            return (
              <tr key={c.id} style={{ background: i % 2 === 0 ? '#0d1421' : 'transparent' }}>
                <td style={{ padding: '10px 12px', borderBottom: `1px solid #0f1c30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: typeColor[c.type] ?? '#6366f1',
                    }} />
                    <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: COLORS.muted }}>{c.category}</span>
                  </div>
                </td>
                {[c.selfScore, c.managerScore, c.peerScore, c.othersScore].map((v, j) => (
                  <td key={j} style={{ textAlign: 'center', padding: '10px 12px', borderBottom: `1px solid #0f1c30` }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 6,
                      background: `${scoreColor(v)}22`,
                      color: scoreColor(v), fontSize: 13, fontWeight: 700,
                    }}>{v.toFixed(1)}</span>
                  </td>
                ))}
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: `1px solid #0f1c30` }}>
                  <span style={{ color: gapColor, fontSize: 13, fontWeight: 700 }}>
                    {c.gap > 0 ? '+' : ''}{c.gap.toFixed(1)}
                  </span>
                </td>
                <td style={{ textAlign: 'center', padding: '10px 12px', borderBottom: `1px solid #0f1c30` }}>
                  <span style={{ color: COLORS.muted, fontSize: 13 }}>{c.benchmark.toFixed(1)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── NINE BOX ─────────────────────────────────────────────────
function NineBoxGrid({ entries }: { entries: NineBoxEntry[] }) {
  const boxConfig: Record<string, { label: string; color: string; bg: string }> = {
    HIGH_HIGH: { label: 'Star / Alto Potencial', color: '#22c55e', bg: '#14532d22' },
    HIGH_MID: { label: 'Alto Performer', color: '#60a5fa', bg: '#1e3a5f22' },
    HIGH_LOW: { label: 'Especialista', color: '#818cf8', bg: '#312e8122' },
    MID_HIGH: { label: 'Talento Emergente', color: '#34d399', bg: '#064e3b22' },
    MID_MID: { label: 'Core Contributor', color: '#94a3b8', bg: '#1e2a3a22' },
    MID_LOW: { label: 'Necessita Orientação', color: '#f59e0b', bg: '#7c2d1222' },
    LOW_HIGH: { label: 'Diamante em Bruto', color: '#a78bfa', bg: '#4c1d9522' },
    LOW_MID: { label: 'Em Desenvolvimento', color: '#fb923c', bg: '#7c2d1222' },
    LOW_LOW: { label: 'Acção Imediata', color: '#ef4444', bg: '#7f1d1d22' },
  };

  const rows: ('HIGH' | 'MID' | 'LOW')[] = ['HIGH', 'MID', 'LOW'];
  const cols: ('LOW' | 'MID' | 'HIGH')[] = ['LOW', 'MID', 'HIGH'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: COLORS.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          ↑ <span>Potencial</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, position: 'relative' }}>
        {rows.map((potential) =>
          cols.map((performance) => {
            const key = `${performance}_${potential}`;
            const cfg = boxConfig[key];
            const boxEntries = entries.filter((e) => e.performance === performance && e.potential === potential);
            return (
              <div key={key} style={{
                background: cfg.bg, border: `1px solid ${cfg.color}33`,
                borderRadius: 8, padding: '12px', minHeight: 110,
                position: 'relative',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: '0.04em', marginBottom: 8, textTransform: 'uppercase' }}>
                  {cfg.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {boxEntries.map((e) => (
                    <div key={e.participantId} style={{
                      background: `${cfg.color}22`, border: `1px solid ${cfg.color}44`,
                      borderRadius: 4, padding: '3px 8px',
                      fontSize: 11, color: cfg.color, fontWeight: 600, whiteSpace: 'nowrap',
                    }} title={`Score: ${e.score.toFixed(2)}`}>
                      {e.name.split(' ')[0]}
                    </div>
                  ))}
                  {boxEntries.length === 0 && (
                    <span style={{ fontSize: 11, color: '#1e2a3a' }}>—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 4px' }}>
        {['Baixa Performance', 'Performance Média', 'Alta Performance'].map((l) => (
          <span key={l} style={{ fontSize: 10, color: COLORS.muted, textAlign: 'center', flex: 1 }}>{l}</span>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: COLORS.muted, marginTop: 4 }}>→ Performance</div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────
function OverviewTab({ result, cycle }: { result: ParticipantResult; cycle: CycleInfo }) {
  const completionPct = Math.round((cycle.completedCount / cycle.participantsCount) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Participant header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a, #1a1048)',
        border: '1px solid #312e81', borderRadius: 12, padding: '24px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
          }}>{result.fullName.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.text, letterSpacing: '-0.01em' }}>{result.fullName}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{result.position} · {result.department}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {result.isEligiblePromotion && (
            <div style={{ background: '#14532d', border: '1px solid #22c55e44', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
              ✓ Elegível Promoção
            </div>
          )}
          {result.isEligibleBonus && (
            <div style={{ background: '#1c1917', border: '1px solid #f59e0b44', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>
              ✓ Elegível Bónus
            </div>
          )}
        </div>
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Score Ponderado', value: result.weightedScore, color: '#818cf8' },
          { label: 'Autoavaliação', value: result.selfScore, color: COLORS.self },
          { label: 'Gestor', value: result.managerScore, color: '#34d399' },
          { label: 'Pares', value: result.peerScore, color: COLORS.peer },
        ].map((s) => (
          <div key={s.label} style={{ background: COLORS.surface, border: '1px solid #1e2a3a', borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value.toFixed(1)}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>/ 5.0</div>
          </div>
        ))}
      </div>

      {/* Strengths & Gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: COLORS.surface, border: '1px solid #166534', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>◆ Pontos Fortes</div>
          {result.strengths.map((s) => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: 8 }}>{s.category}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>{s.othersScore.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: COLORS.surface, border: '1px solid #7f1d1d', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: '#f87171', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>▲ Oportunidades de Desenvolvimento</div>
          {result.gaps.map((g) => (
            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}>{g.name}</span>
                <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: 8 }}>{g.category}</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>{g.othersScore.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle progress */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '18px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{cycle.name}</div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>{cycle.startDate} → {cycle.endDate}</div>
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>{cycle.completedCount}/{cycle.participantsCount} concluídos</div>
        </div>
        <div style={{ background: '#1e2537', borderRadius: 4, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${completionPct}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 4 }} />
        </div>
        <div style={{ fontSize: 12, color: '#818cf8', marginTop: 6, fontWeight: 600 }}>{completionPct}% de participação</div>
      </div>
    </div>
  );
}

// ─── FEEDBACK TAB ──────────────────────────────────────────────
function FeedbackTab({ feedbacks }: { feedbacks: ContinuousFeedback[] }) {
  const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    RECOGNITION: { label: 'Reconhecimento', color: '#22c55e', icon: '★' },
    DEVELOPMENT: { label: 'Desenvolvimento', color: '#818cf8', icon: '◎' },
    CHECK_IN: { label: 'Check-in 1:1', color: '#60a5fa', icon: '◆' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Feedback Contínuo</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>Feedbacks recebidos fora dos ciclos formais</p>
        </div>
        <button style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          border: 'none', borderRadius: 8, padding: '9px 18px',
          fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}>+ Dar Feedback</button>
      </div>
      {feedbacks.map((fb) => {
        const cfg = typeConfig[fb.type];
        return (
          <div key={fb.id} style={{
            background: COLORS.surface,
            borderLeft: `3px solid ${cfg.color}`,
            border: `1px solid ${COLORS.border}`,
            borderLeftColor: cfg.color,
            borderRadius: '0 10px 10px 0', padding: '16px 20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cfg.label}</span>
                  {fb.competency && (
                    <span style={{ fontSize: 11, color: COLORS.muted, background: '#1e2a3a', padding: '2px 8px', borderRadius: 10 }}>{fb.competency}</span>
                  )}
                  <span style={{ fontSize: 11, color: '#374151' }}>· {timeAgo(fb.createdAt)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>{fb.message}</p>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: COLORS.muted }}>por <strong style={{ color: '#94a3b8' }}>{fb.fromName}</strong></div>
          </div>
        );
      })}
    </div>
  );
}

// ─── EVALUATION FORM ──────────────────────────────────────────
function EvaluationFormTab() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const questions = [
    { id: 'q1', text: 'Com que frequência demonstra iniciativa para resolver problemas sem esperar instruções?', type: 'FREQUENCY', competency: 'Proactividade' },
    { id: 'q2', text: 'Como avalia a capacidade de comunicação clara e assertiva deste colaborador?', type: 'LIKERT', competency: 'Comunicação' },
    { id: 'q3', text: 'Em que medida este colaborador colabora eficazmente com outros membros da equipa?', type: 'LIKERT', competency: 'Trabalho em Equipa' },
    { id: 'q4', text: 'Com que frequência entrega resultados dentro dos prazos definidos?', type: 'FREQUENCY', competency: 'Foco em Resultados' },
    { id: 'q5', text: 'Como avalia a capacidade de adaptação a mudanças e situações de pressão?', type: 'LIKERT', competency: 'Resiliência' },
  ];
  const freqLabels = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'];
  const likertLabels = ['Insuficiente', 'Abaixo do esperado', 'Dentro do esperado', 'Acima do esperado', 'Excecional'];

  const completion = Math.round((Object.keys(answers).length / questions.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Formulário de Avaliação</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>Avaliação de <strong style={{ color: '#e2e8f0' }}>Maria João Santos</strong> · Role: Par</p>
      </div>

      {/* Progress */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: COLORS.muted }}>Progresso</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{Object.keys(answers).length}/{questions.length} respostas</span>
        </div>
        <div style={{ background: '#1e2537', borderRadius: 4, height: 6 }}>
          <div style={{ width: `${completion}%`, height: '100%', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const labels = q.type === 'FREQUENCY' ? freqLabels : likertLabels;
        const val = answers[q.id];
        return (
          <div key={q.id} style={{
            background: COLORS.surface, border: `1px solid ${val !== undefined ? '#4f46e555' : COLORS.border}`,
            borderRadius: 10, padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{
                minWidth: 24, height: 24, borderRadius: '50%',
                background: val !== undefined ? '#4f46e5' : '#1e2537',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: val !== undefined ? '#fff' : '#374151',
              }}>{qi + 1}</div>
              <div>
                <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, marginBottom: 6 }}>{q.competency}</div>
                <p style={{ margin: 0, fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{q.text}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {labels.map((label, i) => {
                const v = i + 1;
                const isSelected = val === v;
                return (
                  <button key={v} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: v }))} style={{
                    flex: 1, minWidth: 80, padding: '10px 6px',
                    background: isSelected ? '#4f46e5' : '#1e2537',
                    border: `1px solid ${isSelected ? '#6366f1' : '#1e2a3a'}`,
                    borderRadius: 8, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: isSelected ? '#fff' : '#6b7280' }}>{v}</span>
                    <span style={{ fontSize: 10, color: isSelected ? '#c7d2fe' : '#475569', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Open question */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '20px 24px' }}>
        <p style={{ margin: '0 0 12px', fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>
          Que feedback adicional gostaria de partilhar sobre este colaborador? (opcional)
        </p>
        <textarea style={{
          width: '100%', minHeight: 100, background: '#0f172a',
          border: '1px solid #1e2a3a', borderRadius: 8, padding: '12px',
          fontSize: 13, color: '#e2e8f0', resize: 'vertical', outline: 'none',
          fontFamily: 'inherit',
        }} placeholder="Partilhe exemplos concretos e construtivos..." />
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{
          background: '#1e2537', border: `1px solid ${COLORS.border}`, borderRadius: 8,
          padding: '12px 24px', fontSize: 14, fontWeight: 600, color: COLORS.muted, cursor: 'pointer',
        }}>Guardar Rascunho</button>
        <button style={{
          background: completion === 100 ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#1e2537',
          border: `1px solid ${completion === 100 ? '#6366f1' : '#374151'}`,
          borderRadius: 8, padding: '12px 32px',
          fontSize: 14, fontWeight: 700, color: completion === 100 ? '#fff' : '#4b5563',
          cursor: completion === 100 ? 'pointer' : 'not-allowed',
        }} disabled={completion < 100}>
          {completion < 100 ? `Responda todas as questões (${completion}%)` : 'Submeter Avaliação'}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Visão Geral', icon: '◈' },
  { id: 'radar', label: 'Radar 360°', icon: '◎' },
  { id: 'competencies', label: 'Competências', icon: '▣' },
  { id: 'feedback', label: 'Feedback', icon: '◆' },
  { id: 'ninebox', label: 'Nine Box', icon: '⊞' },
  { id: 'cycles', label: 'Ciclos', icon: '⟲' },
  { id: 'form', label: 'Avaliar', icon: '✦' },
];

export default function Evaluation360Page() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab result={MOCK_RESULT} cycle={MOCK_CYCLE} />;
      case 'radar': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Radar de Competências 360°</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>Comparação entre autoavaliação, outros avaliadores e benchmark do cargo</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '24px', display: 'flex', justifyContent: 'center' }}>
              <RadarChart competencies={MOCK_COMPETENCIES} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Legenda de Gaps</div>
              {MOCK_COMPETENCIES.map((c) => (
                <div key={c.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{c.name}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 800,
                    color: c.gap > 0.5 ? '#f59e0b' : c.gap < -0.5 ? '#22c55e' : COLORS.muted,
                  }}>{c.gap > 0 ? `▲ +${c.gap.toFixed(1)}` : `▼ ${c.gap.toFixed(1)}`}</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8, lineHeight: 1.5 }}>
                <span style={{ color: '#f59e0b' }}>▲ positivo</span> = overestima-se vs. outros<br />
                <span style={{ color: '#22c55e' }}>▼ negativo</span> = subestima-se (ponto forte!)
              </div>
            </div>
          </div>
        </div>
      );
      case 'competencies': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Heatmap de Competências</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>Score por fonte de avaliador, gap e benchmark do cargo</p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {Object.entries(typeColor).map(([type, color]) => (
              <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.muted }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {type.replace('_', ' ')}
              </span>
            ))}
          </div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <CompetencyHeatmap competencies={MOCK_COMPETENCIES} />
          </div>
        </div>
      );
      case 'feedback': return <FeedbackTab feedbacks={MOCK_FEEDBACKS} />;
      case 'ninebox': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Matriz Nine Box</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>Performance vs Potencial · {MOCK_NINE_BOX.length} colaboradores</p>
          </div>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <NineBoxGrid entries={MOCK_NINE_BOX} />
          </div>
        </div>
      );
      case 'cycles': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.text }}>Ciclos de Avaliação</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: COLORS.muted }}>Gestão de campanhas de avaliação 360°</p>
            </div>
            <button style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              border: 'none', borderRadius: 8, padding: '9px 18px',
              fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
            }}>+ Novo Ciclo</button>
          </div>
          {[MOCK_CYCLE, { ...MOCK_CYCLE, id: 'c2', name: 'Avaliação Anual 2024', status: 'COMPLETED', startDate: '2024-01-01', endDate: '2024-12-31', participantsCount: 76, completedCount: 72 }].map((cycle) => (
            <div key={cycle.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '18px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{cycle.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{cycle.model} · {cycle.startDate} → {cycle.endDate}</div>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20,
                  background: cycle.status === 'COMPLETED' ? '#14532d' : '#1e1b4b',
                  color: cycle.status === 'COMPLETED' ? '#4ade80' : '#818cf8',
                }}>{cycle.status}</span>
              </div>
              <div style={{ background: '#1e2537', borderRadius: 4, height: 6, marginBottom: 8 }}>
                <div style={{ width: `${Math.round(cycle.completedCount / cycle.participantsCount * 100)}%`, height: '100%', background: '#4f46e5', borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted }}>{cycle.completedCount}/{cycle.participantsCount} participantes concluídos ({Math.round(cycle.completedCount / cycle.participantsCount * 100)}%)</div>
            </div>
          ))}
        </div>
      );
      case 'form': return <EvaluationFormTab />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", color: COLORS.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #111827; } ::-webkit-scrollbar-thumb { background: #1e2a3a; border-radius: 3px; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #0f1c30', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16, background: '#08101f', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>I</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, letterSpacing: '-0.01em' }}>INNOVA</div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Avaliação 360°</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: COLORS.muted }}>Ciclo: <strong style={{ color: '#818cf8' }}>{MOCK_CYCLE.name}</strong></div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #0f1c30', padding: '0 32px', display: 'flex', gap: 4, overflowX: 'auto', background: '#08101f' }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: 'none', border: 'none',
            padding: '14px 18px', fontSize: 13,
            fontWeight: activeTab === tab.id ? 700 : 500,
            color: activeTab === tab.id ? '#a5b4fc' : '#475569',
            cursor: 'pointer',
            borderBottom: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`,
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 12 }}>{tab.icon}</span>{tab.label}
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