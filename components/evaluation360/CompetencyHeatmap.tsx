// components/evaluation360/CompetencyHeatmap.tsx
// Tabela de competências por fonte de avaliador (auto/gestor/pares), gap e
// benchmark. Extraído de app/(platform)/evaluation360/page.tsx.

'use client';

import type { CompetencyScore } from './types';
import { COLORS, typeColor, scoreColor } from './colors';

export interface CompetencyHeatmapProps {
  competencies: CompetencyScore[];
}

export function CompetencyHeatmap({ competencies }: CompetencyHeatmapProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                fontSize: 11,
                color: COLORS.muted,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              Competência
            </th>
            {['Auto', 'Gestor', 'Pares', 'Média', 'Gap', 'Benchmark'].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'center',
                    padding: '10px 12px',
                    fontSize: 11,
                    color: COLORS.muted,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${COLORS.border}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {competencies.map((c, i) => {
            const gapColor =
              c.gap > 0.5 ? '#f59e0b' : c.gap < -0.5 ? '#22c55e' : COLORS.muted;
            return (
              <tr
                key={c.id}
                style={{ background: i % 2 === 0 ? '#0d1421' : 'transparent' }}
              >
                <td
                  style={{
                    padding: '10px 12px',
                    borderBottom: `1px solid #0f1c30`,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: typeColor[c.type] ?? '#6366f1',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: COLORS.text,
                        fontWeight: 600,
                      }}
                    >
                      {c.name}
                    </span>
                    <span style={{ fontSize: 10, color: COLORS.muted }}>
                      {c.category}
                    </span>
                  </div>
                </td>
                {[c.selfScore, c.managerScore, c.peerScore, c.othersScore].map(
                  (v, j) => (
                    <td
                      key={j}
                      style={{
                        textAlign: 'center',
                        padding: '10px 12px',
                        borderBottom: `1px solid #0f1c30`,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 6,
                          background: `${scoreColor(v)}22`,
                          color: scoreColor(v),
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {v.toFixed(1)}
                      </span>
                    </td>
                  ),
                )}
                <td
                  style={{
                    textAlign: 'center',
                    padding: '10px 12px',
                    borderBottom: `1px solid #0f1c30`,
                  }}
                >
                  <span
                    style={{ color: gapColor, fontSize: 13, fontWeight: 700 }}
                  >
                    {c.gap > 0 ? '+' : ''}
                    {c.gap.toFixed(1)}
                  </span>
                </td>
                <td
                  style={{
                    textAlign: 'center',
                    padding: '10px 12px',
                    borderBottom: `1px solid #0f1c30`,
                  }}
                >
                  <span style={{ color: COLORS.muted, fontSize: 13 }}>
                    {c.benchmark.toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
