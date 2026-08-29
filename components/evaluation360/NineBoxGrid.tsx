// components/evaluation360/NineBoxGrid.tsx
// Matriz 3x3 performance x potencial. Extraído de
// app/(platform)/evaluation360/page.tsx.
//
// NOTA: Os 9 boxes usam cores categóricas (não ordinais) para codificar
// combinações de performance/potential. Estas cores são uma data-viz exception
// e ficam como raw hex/rgb — não são mapeadas para tokens semânticos.

'use client';

import type { NineBoxEntry } from './types';

export interface NineBoxGridProps {
  entries: NineBoxEntry[];
}

export function NineBoxGrid({ entries }: NineBoxGridProps) {
  const boxConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    HIGH_HIGH: {
      label: 'Alto Potencial',
      color: 'rgb(34, 197, 94)',
      bg: 'rgba(34, 197, 94, 0.13)',
    },
    HIGH_MID: {
      label: 'Colaborador de Alto Desempenho',
      color: 'rgb(96, 165, 250)',
      bg: 'rgba(96, 165, 250, 0.13)',
    },
    HIGH_LOW: {
      label: 'Especialista',
      color: 'rgb(129, 140, 248)',
      bg: 'rgba(129, 140, 248, 0.13)',
    },
    MID_HIGH: {
      label: 'Talento Emergente',
      color: 'rgb(52, 211, 153)',
      bg: 'rgba(52, 211, 153, 0.13)',
    },
    MID_MID: {
      label: 'Contribuidor Essencial',
      color: 'rgb(148, 163, 184)',
      bg: 'rgba(148, 163, 184, 0.13)',
    },
    MID_LOW: {
      label: 'Necessita Orientação',
      color: 'rgb(245, 158, 11)',
      bg: 'rgba(245, 158, 11, 0.13)',
    },
    LOW_HIGH: {
      label: 'Diamante em Bruto',
      color: 'rgb(167, 139, 250)',
      bg: 'rgba(167, 139, 250, 0.13)',
    },
    LOW_MID: {
      label: 'Em Desenvolvimento',
      color: 'rgb(251, 146, 60)',
      bg: 'rgba(251, 146, 60, 0.13)',
    },
    LOW_LOW: {
      label: 'Acção Imediata',
      color: 'rgb(239, 68, 68)',
      bg: 'rgba(239, 68, 68, 0.13)',
    },
  };

  const rows: ('HIGH' | 'MID' | 'LOW')[] = ['HIGH', 'MID', 'LOW'];
  const cols: ('LOW' | 'MID' | 'HIGH')[] = ['LOW', 'MID', 'HIGH'];

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="text-xs text-ink-muted flex items-center gap-1">
          ↑ <span>Potencial</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 relative">
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
                className="rounded-lg p-3 min-h-28 relative border"
                style={{
                  background: cfg.bg,
                  borderColor: `${cfg.color}55`,
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </div>
                <div className="flex flex-wrap gap-1">
                  {boxEntries.map((e) => (
                    <div
                      key={e.participantId}
                      className="rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
                      style={{
                        background: `${cfg.color}22`,
                        borderColor: `${cfg.color}44`,
                        color: cfg.color,
                        border: '1px solid',
                      }}
                      title={`Score: ${e.score.toFixed(2)}`}
                    >
                      {e.name.split(' ')[0]}
                    </div>
                  ))}
                  {boxEntries.length === 0 && (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
      {/* Axis labels */}
      <div className="flex justify-between mt-2 px-1">
        {['Baixa Performance', 'Performance Média', 'Alta Performance'].map(
          (l) => (
            <span key={l} className="text-xs text-ink-muted text-center flex-1">
              {l}
            </span>
          ),
        )}
      </div>
      <div className="text-center text-xs text-ink-muted mt-1">
        → Performance
      </div>
    </div>
  );
}
