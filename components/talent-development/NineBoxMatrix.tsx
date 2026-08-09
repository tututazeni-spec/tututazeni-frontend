// components/talent-development/NineBoxMatrix.tsx
// Matriz 9-Box (performance × competência). Extraído de
// app/(platform)/talent-development/page.tsx.

import type { NineBoxCell } from './types';

export interface NineBoxMatrixProps {
  matrix: NineBoxCell[];
}

export function NineBoxMatrix({ matrix }: NineBoxMatrixProps) {
  const BOX_COLORS: Record<string, string> = {
    '3_3': 'bg-emerald-50 border-emerald-200',
    '3_2': 'bg-teal-50 border-teal-200',
    '3_1': 'bg-sky-50 border-sky-200',
    '2_3': 'bg-violet-50 border-violet-200',
    '2_2': 'bg-slate-50 border-slate-200',
    '2_1': 'bg-amber-50 border-amber-200',
    '1_3': 'bg-blue-50 border-blue-200',
    '1_2': 'bg-orange-50 border-orange-200',
    '1_1': 'bg-red-50 border-red-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-700">Matriz 9-Box</h3>
        <span className="text-xs text-slate-400">
          Performance × Competência
        </span>
      </div>

      {/* Y label */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center justify-center w-6">
          <span className="text-[10px] text-slate-400 writing-mode-vertical -rotate-90 whitespace-nowrap">
            ← Performance →
          </span>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            {['3', '2', '1'].flatMap((y) =>
              ['1', '2', '3'].map((x) => {
                const key = `${y}_${x}`;
                const cell = matrix.find((m) => m.box === key);
                const labelShort = cell?.label.split(' — ')[0] ?? '';
                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-3 min-h-[80px] ${BOX_COLORS[key] ?? 'bg-slate-50'}`}
                  >
                    <p className="text-[10px] font-semibold text-slate-600 leading-tight">
                      {labelShort}
                    </p>
                    <p className="text-2xl font-bold text-slate-700 mt-1">
                      {cell?.count ?? 0}
                    </p>
                  </div>
                );
              }),
            )}
          </div>

          {/* X label */}
          <p className="text-center text-[10px] text-slate-400 mt-2">
            ← Competência →
          </p>
        </div>
      </div>
    </div>
  );
}
