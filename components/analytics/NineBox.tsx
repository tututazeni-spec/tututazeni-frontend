// components/analytics/NineBox.tsx
// Matriz 9-Box (desempenho × potencial) da equipa. Extraído de
// app/(platform)/analytics/page.tsx. Migrado para a fundação de
// design: as 9 células não são uma paleta categórica arbitrária —
// codificam uma escala ordinal de risco/potencial (canto superior
// direito = melhor talento, canto inferior esquerdo = maior risco de
// saída), por isso mapeiam logicamente para os tokens semânticos em
// vez de ficarem fora do escopo (ver nota "gráficos" do plano de
// rollout): success = alto potencial, danger = alto risco,
// warning = zonas de atenção, info = perfis sólidos mas não topo,
// surface-sunken = núcleo neutro. Os dois níveis de intensidade que a
// paleta anterior usava para diferenciar células dentro da mesma
// categoria (ex. duas tonalidades de verde) colapsam num único tom
// "subtle" por categoria — a fundação não tem variantes de
// intensidade por tom.

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
    '3-3': 'bg-success-subtle',
    '2-3': 'bg-success-subtle',
    '1-3': 'bg-warning-subtle',
    '3-2': 'bg-info-subtle',
    '2-2': 'bg-surface-sunken',
    '1-2': 'bg-warning-subtle',
    '3-1': 'bg-info-subtle',
    '2-1': 'bg-danger-subtle',
    '1-1': 'bg-danger-subtle',
  };

  return (
    <div>
      <div className="text-xs text-ink-faint text-center mb-1">
        Desempenho →
      </div>
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
                className={`${colors[key] ?? 'bg-surface-sunken'} rounded-control p-2 min-h-[70px]`}
              >
                <div className="text-xs font-medium text-ink-muted mb-1 leading-tight">
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
                    <div className="text-xs text-ink-faint">—</div>
                  )}
                </div>
              </div>
            );
          }),
        )}
      </div>
      <div className="text-xs text-ink-faint text-right mt-1">← Potencial</div>
    </div>
  );
}
