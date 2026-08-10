// components/analytics/NineBox.tsx
// Matriz 9-Box (desempenho × potencial) da equipa. Extraído de
// app/(platform)/analytics/page.tsx.

'use client';

import { Avatar } from './atoms';
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
    '3-3': 'bg-emerald-200',
    '2-3': 'bg-emerald-100',
    '1-3': 'bg-amber-100',
    '3-2': 'bg-blue-100',
    '2-2': 'bg-gray-100',
    '1-2': 'bg-amber-50',
    '3-1': 'bg-blue-50',
    '2-1': 'bg-red-50',
    '1-1': 'bg-red-100',
  };

  return (
    <div>
      <div className="text-xs text-gray-400 text-center mb-1">Desempenho →</div>
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
                className={`${colors[key] ?? 'bg-gray-100'} rounded-lg p-2 min-h-[70px]`}
              >
                <div className="text-xs font-medium text-gray-600 mb-1 leading-tight">
                  {labels[key]}
                </div>
                <div className="flex flex-wrap gap-1">
                  {users.map((u) => (
                    <Avatar
                      key={u.userId}
                      name={u.fullName}
                      avatarUrl={u.avatarUrl}
                      size="sm"
                    />
                  ))}
                  {users.length === 0 && (
                    <div className="text-xs text-gray-300">—</div>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
      <div className="text-xs text-gray-400 text-right mt-1">← Potencial</div>
    </div>
  );
}
