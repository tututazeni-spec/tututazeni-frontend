// components/evaluation360/NineBoxGrid.tsx
// Matriz 3x3 performance x potencial. Extraído de
// app/(platform)/evaluation360/page.tsx.
//
// Cor = tier de Potencial (linha), sempre os 3 tokens semânticos de estado já
// usados no resto da app (--color-success/warning/danger, ver globals.css) —
// não uma paleta categórica de 9 cores inventada. Potencial é ordinal (baixo
// < médio < alto), por isso tem um único eixo de cor: vermelho→âmbar→verde.
// Performance continua visível (colunas + label descritivo por quadrante),
// mas como 2ª codificação — espessura da borda — nunca uma 2ª cor
// independente por cima da mesma célula (isso obrigaria a ler 9 combinações
// de hue em vez de 1 escala + 1 intensidade).
//
// Regra "ninguém vê o resultado de outro" (evaluation360.service.ts#
// getNineBox): cada quadrante mostra só uma contagem de pessoas, nunca
// nomes/scores individuais.

'use client';

import type { NineBoxEntry } from './types';

export interface NineBoxGridProps {
  entries: NineBoxEntry[];
}

type Tier = 'LOW' | 'MID' | 'HIGH';

const potentialStyle: Record<Tier, { bg: string; border: string; text: string; dot: string }> = {
  HIGH: {
    bg: 'var(--color-success-subtle)',
    border: 'var(--color-success)',
    text: 'var(--color-success-ink)',
    dot: 'Alto potencial',
  },
  MID: {
    bg: 'var(--color-warning-subtle)',
    border: 'var(--color-warning)',
    text: 'var(--color-warning-ink)',
    dot: 'Potencial médio',
  },
  LOW: {
    bg: 'var(--color-danger-subtle)',
    border: 'var(--color-danger)',
    text: 'var(--color-danger-ink)',
    dot: 'Potencial baixo',
  },
};

// Performance = espessura da borda (2ª codificação, não uma 2ª cor).
const performanceBorderWidth: Record<Tier, string> = {
  LOW: '1px',
  MID: '2px',
  HIGH: '4px',
};

const boxLabel: Record<string, string> = {
  HIGH_HIGH: 'Alto Potencial',
  HIGH_MID: 'Colaborador de Alto Desempenho',
  HIGH_LOW: 'Especialista',
  MID_HIGH: 'Talento Emergente',
  MID_MID: 'Contribuidor Essencial',
  MID_LOW: 'Necessita Orientação',
  LOW_HIGH: 'Diamante em Bruto',
  LOW_MID: 'Em Desenvolvimento',
  LOW_LOW: 'Acção Imediata',
};

export function NineBoxGrid({ entries }: NineBoxGridProps) {
  const rows: Tier[] = ['HIGH', 'MID', 'LOW'];
  const cols: Tier[] = ['LOW', 'MID', 'HIGH'];

  return (
    <div>
      {/* Legenda de cor — potencial é a única escala de cor da matriz */}
      <div className="flex flex-wrap gap-3 mb-3">
        {(['HIGH', 'MID', 'LOW'] as Tier[]).map(tier => (
          <div key={tier} className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: potentialStyle[tier].border }}
            />
            {potentialStyle[tier].dot}
          </div>
        ))}
        <div className="text-xs text-ink-faint">· borda mais grossa = performance mais alta</div>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="text-xs text-ink-muted flex items-center gap-1">
          ↑ <span>Potencial</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 relative">
        {rows.map(potential =>
          cols.map(performance => {
            const key = `${performance}_${potential}`;
            const style = potentialStyle[potential];
            const count = entries.find(e => e.performance === performance && e.potential === potential)?.count ?? 0;
            return (
              <div
                key={key}
                className="rounded-lg p-3 min-h-28 relative"
                style={{
                  backgroundColor: style.bg,
                  borderColor: style.border,
                  borderWidth: performanceBorderWidth[performance],
                  borderStyle: 'solid',
                }}
              >
                <div
                  className="text-xs font-bold uppercase tracking-wider mb-2"
                  style={{ color: style.text }}
                >
                  {boxLabel[key]}
                </div>
                <div className="text-2xl font-bold" style={{ color: style.text }}>
                  {count}
                </div>
                <div className="text-xs text-ink-faint">{count === 1 ? 'colaborador' : 'colaboradores'}</div>
              </div>
            );
          }),
        )}
      </div>
      {/* Axis labels */}
      <div className="flex justify-between mt-2 px-1">
        {['Baixa Performance', 'Performance Média', 'Alta Performance'].map(l => (
          <span key={l} className="text-xs text-ink-muted text-center flex-1">
            {l}
          </span>
        ))}
      </div>
      <div className="text-center text-xs text-ink-muted mt-1">→ Performance</div>
    </div>
  );
}
