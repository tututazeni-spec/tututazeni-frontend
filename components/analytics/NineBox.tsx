// components/analytics/NineBox.tsx
// Matriz 9-Box (desempenho × potencial) da equipa. Extraído de
// app/(platform)/analytics/page.tsx. Cada quadrante tem uma cor própria
// (barra no topo + tinta subtil de fundo + rótulo colorido), no mesmo
// padrão visual do TopBarCard usado no resto do dashboard — a posição
// na grelha (canto superior direito = melhor talento, canto inferior
// esquerdo = maior risco de saída) e a cor reforçam-se mutuamente.

'use client';

import { Avatar } from '@/components/ui/Avatar';
import type { ManagerDashboard } from './types';

interface NineBoxProps {
  data: ManagerDashboard['nineBox'];
}

const LABELS: Record<string, string> = {
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

const STYLES: Record<string, { bar: string; text: string; bg: string }> = {
  '3-3': { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]', bg: 'bg-[#C9A227]/5' }, // dourado — alto potencial
  '2-3': { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]', bg: 'bg-[#2E8B3E]/5' }, // verde — potencial emergente
  '1-3': { bar: 'bg-[#7C3AED]', text: 'text-[#7C3AED]', bg: 'bg-[#7C3AED]/5' }, // roxo — enigma
  '3-2': { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]', bg: 'bg-[#2B6CC4]/5' }, // azul — profissional
  '2-2': { bar: 'bg-[#0E9394]', text: 'text-[#0E9394]', bg: 'bg-[#0E9394]/5' }, // teal — núcleo sólido
  '1-2': { bar: 'bg-[#DB2777]', text: 'text-[#DB2777]', bg: 'bg-[#DB2777]/5' }, // rosa — inconsistente
  '3-1': { bar: 'bg-[#0D9488]', text: 'text-[#0D9488]', bg: 'bg-[#0D9488]/5' }, // verde-azulado — especialista
  '2-1': { bar: 'bg-[#D97706]', text: 'text-[#D97706]', bg: 'bg-[#D97706]/5' }, // laranja — eficiente limitado
  '1-1': { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]', bg: 'bg-[#C0453F]/5' }, // vermelho — alto risco
};

export function NineBox({ data }: NineBoxProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-resting">
      <div className="mb-2 text-center font-body text-xs text-ink-faint">
        Desempenho →
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[3, 2, 1].map((pot) =>
          [1, 2, 3].map((perf) => {
            const key = `${perf}-${pot}`;
            const s = STYLES[key];
            const users = data.filter(
              (u) => u.performanceAxis === perf && u.potentialAxis === pot,
            );
            return (
              <div
                key={key}
                className={`overflow-hidden rounded-xl border border-border ${s.bg} transition-shadow hover:shadow-md`}
              >
                <div className={`h-1 w-full ${s.bar}`} />
                <div className="min-h-[76px] p-3">
                  <div className={`mb-1 font-body text-xs font-semibold leading-tight ${s.text}`}>
                    {LABELS[key]}
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
                      <div className="font-body text-xs text-ink-faint">—</div>
                    )}
                  </div>
                </div>
              </div>
            );
          }),
        )}
      </div>
      <div className="mt-2 text-right font-body text-xs text-ink-faint">
        ← Potencial
      </div>
    </div>
  );
}