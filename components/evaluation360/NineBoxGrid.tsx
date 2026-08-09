// components/evaluation360/NineBoxGrid.tsx
// Matriz 3x3 performance x potencial. Extraído de
// app/(platform)/evaluation360/page.tsx.

'use client';

import type { NineBoxEntry } from './types';
import { COLORS } from './colors';

export interface NineBoxGridProps {
  entries: NineBoxEntry[];
}

export function NineBoxGrid({ entries }: NineBoxGridProps) {
  const boxConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    HIGH_HIGH: {
      label: 'Star / Alto Potencial',
      color: '#22c55e',
      bg: '#14532d22',
    },
    HIGH_MID: { label: 'Alto Performer', color: '#60a5fa', bg: '#1e3a5f22' },
    HIGH_LOW: { label: 'Especialista', color: '#818cf8', bg: '#312e8122' },
    MID_HIGH: { label: 'Talento Emergente', color: '#34d399', bg: '#064e3b22' },
    MID_MID: { label: 'Core Contributor', color: '#94a3b8', bg: '#1e2a3a22' },
    MID_LOW: {
      label: 'Necessita Orientação',
      color: '#f59e0b',
      bg: '#7c2d1222',
    },
    LOW_HIGH: { label: 'Diamante em Bruto', color: '#a78bfa', bg: '#4c1d9522' },
    LOW_MID: { label: 'Em Desenvolvimento', color: '#fb923c', bg: '#7c2d1222' },
    LOW_LOW: { label: 'Acção Imediata', color: '#ef4444', bg: '#7f1d1d22' },
  };

  const rows: ('HIGH' | 'MID' | 'LOW')[] = ['HIGH', 'MID', 'LOW'];
  const cols: ('LOW' | 'MID' | 'HIGH')[] = ['LOW', 'MID', 'HIGH'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div
          style={{
            fontSize: 12,
            color: COLORS.muted,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ↑ <span>Potencial</span>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          position: 'relative',
        }}
      >
        {rows.map((potential) =>
          cols.map((performance) => {
            const key = `${performance}_${potential}`;
            const cfg = boxConfig[key];
            const boxEntries = entries.filter(
              (e) => e.performance === performance && e.potential === potential,
            );
            return (
              <div
                key={key}
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.color}33`,
                  borderRadius: 8,
                  padding: '12px',
                  minHeight: 110,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: cfg.color,
                    letterSpacing: '0.04em',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  {cfg.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {boxEntries.map((e) => (
                    <div
                      key={e.participantId}
                      style={{
                        background: `${cfg.color}22`,
                        border: `1px solid ${cfg.color}44`,
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 11,
                        color: cfg.color,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                      title={`Score: ${e.score.toFixed(2)}`}
                    >
                      {e.name.split(' ')[0]}
                    </div>
                  ))}
                  {boxEntries.length === 0 && (
                    <span style={{ fontSize: 11, color: '#1e2a3a' }}>—</span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
      {/* Axis labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          padding: '0 4px',
        }}
      >
        {['Baixa Performance', 'Performance Média', 'Alta Performance'].map(
          (l) => (
            <span
              key={l}
              style={{
                fontSize: 10,
                color: COLORS.muted,
                textAlign: 'center',
                flex: 1,
              }}
            >
              {l}
            </span>
          ),
        )}
      </div>
      <div
        style={{
          textAlign: 'center',
          fontSize: 11,
          color: COLORS.muted,
          marginTop: 4,
        }}
      >
        → Performance
      </div>
    </div>
  );
}
