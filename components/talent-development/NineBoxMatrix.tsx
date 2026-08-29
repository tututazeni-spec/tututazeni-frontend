// components/talent-development/NineBoxMatrix.tsx
// Matriz 9-Box (performance × competência). Extraído de
// app/(platform)/talent-development/page.tsx.
//
// BOX_COLORS: EXCEÇÃO DOCUMENTADA à migração de paleta crua (ver nota
// "módulos com visualização de dados" no plano de rollout, Task 0). Cada
// uma das 9 células da matriz é uma categoria distinta (performance ×
// potencial) — a cor aqui é codificação de categoria de dados, não estado
// decorativo, e forçar 9 categorias para os 6 tokens semânticos
// (primary/accent/success/warning/danger/info) colidiria pares diferentes
// na mesma cor, perdendo informação. Cores mantidas como valores hex inline,
// não como classes Tailwind de paleta crua.

import { Card, CardBody } from '@/components/ui/Card';
import type { NineBoxCell } from './types';

const BOX_COLORS: Record<string, { bg: string; border: string }> = {
  '3_3': { bg: '#f0fdfa', border: '#a7f3d0' },
  '3_2': { bg: '#f0fdf9', border: '#99f6e4' },
  '3_1': { bg: '#f0f9ff', border: '#bae6fd' },
  '2_3': { bg: '#faf5ff', border: '#ddd6fe' },
  '2_2': { bg: '#f8fafc', border: '#e2e8f0' },
  '2_1': { bg: '#fffbeb', border: '#fed7aa' },
  '1_3': { bg: '#eff6ff', border: '#bfdbfe' },
  '1_2': { bg: '#fff7ed', border: '#fed7aa' },
  '1_1': { bg: '#fef2f2', border: '#fecaca' },
};

export interface NineBoxMatrixProps {
  matrix: NineBoxCell[];
}

export function NineBoxMatrix({ matrix }: NineBoxMatrixProps) {
  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display font-semibold text-ink">Matriz 9-Box</h3>
          <span className="font-body text-xs text-ink-faint">
            Performance × Competência
          </span>
        </div>

        {/* Y label */}
        <div className="flex gap-3">
          <div className="flex w-6 flex-col items-center justify-center">
            <span className="writing-mode-vertical -rotate-90 whitespace-nowrap font-body text-[10px] text-ink-faint">
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
                  const colors = BOX_COLORS[key] ?? { bg: '#f8fafc', border: '#e2e8f0' };
                  return (
                    <div
                      key={key}
                      className="flex min-h-[80px] min-w-0 flex-col overflow-hidden rounded-control border p-3"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border,
                      }}
                    >
                      <p
                        lang="pt"
                        className="hyphens-auto break-words font-body text-[10px] font-semibold leading-tight text-ink-muted"
                      >
                        {labelShort}
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold text-ink">
                        {cell?.count ?? 0}
                      </p>
                    </div>
                  );
                }),
              )}
            </div>

            {/* X label */}
            <p className="mt-2 text-center font-body text-[10px] text-ink-faint">
              ← Competência →
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
