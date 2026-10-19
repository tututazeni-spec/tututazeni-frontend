// components/trainings/plans/NavyPanel.tsx
// Painel claro no mesmo desenho do cartão principal do detalhe do plano
// (workshop de inovação.jpeg): fundo branco, cantos redondos, borda e sombra
// suaves, título azul-marinho com a barra na cor do plano (por `seed`).

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
    <section className="overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white p-6 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-6 w-1 shrink-0 rounded-full"
          style={{ background: palette[0] }}
        />
        <h3 className="font-display text-lg font-bold text-[#0F1F3D]">
          {title}
        </h3>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
