// components/analytics/NineBox.tsx
// Matriz 9-Box (desempenho × potencial) da equipa. Extraído de
// app/(platform)/analytics/page.tsx. Por pedido do cliente, as 9
// células usam fundo branco com contorno preto e texto preto — sem
// codificação de cor por quadrante; a posição na grelha (canto
// superior direito = melhor talento, canto inferior esquerdo = maior
// risco de saída) continua a comunicar a escala.

'use client';

import { Avatar } from '@/components/ui/Avatar';
import type { ManagerDashboard } from './types';

interface NineBoxProps {
  data: ManagerDashboard['nineBox'];
}

export function NineBox({ data }: NineBoxProps) {
  const labels: Record<string, string> = {
    '3-3': 'Alto Potencial',
    '2-3': 'Potencial Emergente',
    '1-3': 'Enigma',
    '3-2': 'Profissional',
    '2-2': 'Núcleo Sólido',
    '1-2': 'Inconsistente',
    '3-1': 'Especialista',
    '2-1': 'Eficiente Limitado',
    '1-1': 'Alto Risco',
  };
  const colors: Record<string, string> = {
    '3-3': 'bg-white border border-black',
    '2-3': 'bg-white border border-black',
    '1-3': 'bg-white border border-black',
    '3-2': 'bg-white border border-black',
    '2-2': 'bg-white border border-black',
    '1-2': 'bg-white border border-black',
    '3-1': 'bg-white border border-black',
    '2-1': 'bg-white border border-black',
    '1-1': 'bg-white border border-black',
  };

  return (
    <div>
      <div className="text-xs text-black text-center mb-1">Desempenho →</div>
      <div className="grid grid-cols-3 gap-1">
        {[3, 2, 1].map((pot) =>
          [1, 2, 3].map((perf) => {
            const key = `${perf}-${pot}`;
            const users = data.filter(
              (u) => u.performanceAxis === perf && u.potentialAxis === pot,
            );
            return (
              <div
                key={key}
                className={`${colors[key] ?? 'bg-white border border-black'} rounded-control p-2 min-h-[70px]`}
              >
                <div className="text-xs font-medium text-black mb-1 leading-tight">
                  {labels[key]}
                </div>
                <div className="flex flex-wrap gap-1">
                  {users.map((u) => (
                    <Avatar
                      key={u.userId}
                      name={u.fullName}
                      url={u.avatarUrl ?? undefined}
                      size="sm"
                    />
                  ))}
                  {users.length === 0 && (
                    <div className="text-xs text-black">—</div>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
      <div className="text-xs text-black text-right mt-1">← Potencial</div>
    </div>
  );
}
