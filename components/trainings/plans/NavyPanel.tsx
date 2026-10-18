// components/trainings/plans/NavyPanel.tsx
// Painel escuro no mesmo gradiente do NavyCard (mesma cor por `seed`), para os
// blocos do detalhe do plano ficarem a condizer com o cartão do topo.

import type { ReactNode } from 'react';
import { PALETTE } from '@/components/onboarding/TemplateCard';

interface NavyPanelProps {
  seed: number;
  title: string;
  children: ReactNode;
}

export function NavyPanel({ seed, title, children }: NavyPanelProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];
  return (
    <section
      className="relative overflow-hidden rounded-panel p-5 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]"
      style={{
        background: `linear-gradient(135deg, ${palette[1]} 0%, ${palette[2]} 65%, ${palette[2]} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 92% 8%, ${palette[0]}99 0%, transparent 45%)`,
        }}
      />
      <div className="relative">
        <h3 className="font-body text-base font-extrabold uppercase tracking-wide text-white">
          {title}
        </h3>
        <div className="mt-3 rounded-card bg-white/10 px-4 py-3 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </section>
  );
}
