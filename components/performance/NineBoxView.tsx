// components/performance/NineBoxView.tsx
// Separador "9-Box Matrix" — grelha desempenho × potencial. Dados
// próprios + apresentação. Extraído de
// app/(platform)/performance/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import { BOX_LABELS } from './constants';
import type { NineBoxGrid } from './types';

export function NineBoxView() {
  const { data, isLoading: loading } = useApiQuery<NineBoxGrid>(
    queryKeys.performance.nineBox(),
    '/performance/9box',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  return (
    <div>
      <div className="text-sm text-gray-500 mb-5">
        Matriz de desempenho × potencial. Eixo X = Performance (1-3), Eixo Y =
        Potencial (1-3).
      </div>

      {/* Eixo Y label */}
      <div className="flex gap-2">
        <div className="flex flex-col justify-between items-center w-6 py-2">
          {['Alto', 'Médio', 'Baixo'].map((l) => (
            <div
              key={l}
              className="text-xs text-gray-400"
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
              }}
            >
              {l} Potencial
            </div>
          ))}
        </div>

        <div className="flex-1">
          {/* Grid 3×3 — Y (potencial) decrescente, X (performance) crescente */}
          {[3, 2, 1].map((pot) => (
            <div key={pot} className="flex gap-2 mb-2">
              {[1, 2, 3].map((perf) => {
                const key = `${perf}-${pot}`;
                const box = BOX_LABELS[key];
                const items = data.grid[key] ?? [];
                return (
                  <div
                    key={key}
                    className={`flex-1 min-h-[140px] border rounded-xl p-3 ${box?.cls ?? 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="text-xs font-semibold text-gray-700 mb-1">
                      {box?.label}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {box?.desc}
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div
                          key={item.user.id}
                          className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1 shadow-sm"
                        >
                          <Avatar
                            name={item.user.fullName}
                            avatarUrl={item.user.avatarUrl}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {item.user.fullName}
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {item.user.position?.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-300 mt-2">
                      {items.length} pessoas
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Eixo X labels */}
          <div className="flex gap-2 mt-1">
            {['Baixo', 'Médio', 'Alto'].map((l) => (
              <div key={l} className="flex-1 text-center text-xs text-gray-400">
                {l} Desempenho
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
