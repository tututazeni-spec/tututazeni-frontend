// components/courses-modulos/ModuleStatTile.tsx
// Quadrado de totais do topo de "Módulos & Lições" (Módulos, Lições e um por
// tipo de conteúdo), no desenho do cartão de Categorias: cartão branco de
// cantos largos, ícone redondo na cor da paleta, número grande a azul-marinho e legenda por baixo.

import type { LucideIcon } from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';

interface ModuleStatTileProps {
  icon: LucideIcon;
  value: number;
  label: string;
  /** Escolhe o gradiente da paleta (estável entre renders). */
  seed: number;
}

export function ModuleStatTile({
  icon: Icon,
  value,
  label,
  seed,
}: ModuleStatTileProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];
  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-3xl border border-[#E4E9F2] bg-white p-4 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: palette[3] }}
      >
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="m-0 font-body text-2xl font-extrabold leading-none text-[#0F1F3D]">
          {value}
        </p>
        <p className="m-0 mt-1 break-words text-sm font-medium text-[#5B6B88]">
          {label}
        </p>
      </div>
    </div>
  );
}
