// components/evaluation360/OverviewTab.tsx
// Cabeçalho do participante, scores, pontos fortes/gaps e progresso do
// ciclo. Extraído de app/(platform)/evaluation360/page.tsx.

'use client';

import type { CycleInfo, ParticipantResult } from './types';
import { COLORS } from './colors';

export interface OverviewTabProps {
  result: ParticipantResult;
  cycle: CycleInfo;
}

export function OverviewTab({ result, cycle }: OverviewTabProps) {
  const completionPct = Math.round(
    (cycle.completedCount / cycle.participantsCount) * 100,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Participant header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a, #1a1048)',
          border: '1px solid #312e81',
          borderRadius: 12,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {result.fullName.charAt(0)}
          </div>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: COLORS.text,
                letterSpacing: '-0.01em',
              }}
            >
              {result.fullName}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
              {result.position} · {result.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {result.isEligiblePromotion && (
            <div
              style={{
                background: '#14532d',
                border: '1px solid #22c55e44',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: '#4ade80',
              }}
            >
              ✓ Elegível Promoção
            </div>
          )}
          {result.isEligibleBonus && (
            <div
              style={{
                background: '#1c1917',
                border: '1px solid #f59e0b44',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: '#fbbf24',
              }}
            >
              ✓ Elegível Bónus
            </div>
          )}
        </div>
      </div>

      {/* Score cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
        }}
      >
        {[
          {
            label: 'Score Ponderado',
            value: result.weightedScore,
            color: '#818cf8',
          },
          {
            label: 'Autoavaliação',
            value: result.selfScore,
            color: COLORS.self,
          },
          { label: 'Gestor', value: result.managerScore, color: '#34d399' },
          { label: 'Pares', value: result.peerScore, color: COLORS.peer },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: COLORS.surface,
              border: '1px solid #1e2a3a',
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: COLORS.muted,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: s.color,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {s.value.toFixed(1)}
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>
              / 5.0
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div
          style={{
            background: COLORS.surface,
            border: '1px solid #166534',
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#4ade80',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            ◆ Pontos Fortes
          </div>
          {result.strengths.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div>
                <span
                  style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}
                >
                  {s.name}
                </span>
                <span
                  style={{ fontSize: 11, color: COLORS.muted, marginLeft: 8 }}
                >
                  {s.category}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>
                {s.othersScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            background: COLORS.surface,
            border: '1px solid #7f1d1d',
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: '#f87171',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 14,
            }}
          >
            ▲ Oportunidades de Desenvolvimento
          </div>
          {result.gaps.map((g) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div>
                <span
                  style={{ fontSize: 13, color: COLORS.text, fontWeight: 600 }}
                >
                  {g.name}
                </span>
                <span
                  style={{ fontSize: 11, color: COLORS.muted, marginLeft: 8 }}
                >
                  {g.category}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>
                {g.othersScore.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle progress */}
      <div
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
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>
              {cycle.name}
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted }}>
              {cycle.startDate} → {cycle.endDate}
            </div>
          </div>
          <div style={{ fontSize: 13, color: COLORS.muted }}>
            {cycle.completedCount}/{cycle.participantsCount} concluídos
          </div>
        </div>
        <div
          style={{
            background: '#1e2537',
            borderRadius: 4,
            height: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${completionPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
              borderRadius: 4,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#818cf8',
            marginTop: 6,
            fontWeight: 600,
          }}
        >
          {completionPct}% de participação
        </div>
      </div>
    </div>
  );
}
