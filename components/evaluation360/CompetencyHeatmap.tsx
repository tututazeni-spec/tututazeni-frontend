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
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth: 600 }}>
        <thead>
          <tr>
            <th className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-700">
              Competência
            </th>
            {['Auto', 'Gestor', 'Pares', 'Média', 'Gap', 'Benchmark'].map(
              (h) => (
                <th
                  key={h}
                  className="text-center px-3 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-700 whitespace-nowrap"
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
              c.gap > 0.5
                ? 'rgb(245, 158, 11)'
                : c.gap < -0.5
                  ? 'rgb(34, 197, 94)'
                  : COLORS.muted;
            return (
              <tr
                key={c.id}
                style={{
                  background: i % 2 === 0 ? 'rgb(13, 20, 33)' : 'transparent',
                }}
              >
                <td className="px-3 py-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{
                        background: typeColor[c.type] ?? 'rgb(99, 102, 241)',
                      }}
                    />
                    <span className="text-sm font-semibold text-slate-100">
                      {c.name}
                    </span>
                    <span className="text-xs text-slate-500">{c.category}</span>
                  </div>
                </td>
                {[c.selfScore, c.managerScore, c.peerScore, c.othersScore].map(
                  (v, j) => (
                    <td
                      key={j}
                      className="text-center px-3 py-2.5 border-b border-slate-800"
                    >
                      <span
                        className="inline-block px-2.5 py-0.75 rounded text-sm font-bold"
                        style={{
                          background: `${scoreColor(v)}22`,
                          color: scoreColor(v),
                        }}
                      >
                        {v.toFixed(1)}
                      </span>
                    </td>
                  ),
                )}
                <td className="text-center px-3 py-2.5 border-b border-slate-800">
                  <span
                    className="text-sm font-bold"
                    style={{ color: gapColor }}
                  >
                    {c.gap > 0 ? '+' : ''}
                    {c.gap.toFixed(1)}
                  </span>
                </td>
                <td className="text-center px-3 py-2.5 border-b border-slate-800">
                  <span className="text-sm text-slate-500">
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
