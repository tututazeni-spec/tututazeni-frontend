// components/departments/DepartmentsPanel.tsx
// Cartão comum das abas do módulo Departamentos (departamentoslayout.jpeg):
// painel com imagem à esquerda (departamentoscard.jpeg) e o conteúdo da aba
// à direita. Sem lógica — cada aba decide o que mostra.

import type { ReactNode } from 'react';
import { Network, type LucideIcon } from 'lucide-react';

interface DepartmentsPanelProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Posição horizontal da foto (object-position), por omissão 12%. */
  imagePosition?: string;
  /** `false` esconde o painel da imagem e dá toda a largura ao conteúdo. */
  showImage?: boolean;
  children: ReactNode;
}

export function DepartmentsPanel({
  title = 'Departamentos',
  subtitle = 'Organização da sua empresa',
  icon: Icon = Network,
  imagePosition = '12%',
  showImage = true,
  children,
}: DepartmentsPanelProps) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_10px_40px_rgba(15,31,61,0.10)] md:flex">
      {showImage && (
        <aside className="relative h-48 flex-shrink-0 overflow-hidden bg-brand-deep md:h-auto md:w-[124px] lg:w-[140px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/departamentoscard.jpeg"
            alt=""
            decoding="async"
            className="absolute inset-x-0 top-0 h-[68%] w-full object-cover"
            style={{ objectPosition: `${imagePosition} center` }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-br from-[#0F3F8C] to-brand-deep"
            style={{ clipPath: 'ellipse(120% 100% at 30% 100%)' }}
          />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <Icon size={30} strokeWidth={1.75} className="mb-2" />
            <div className="text-base font-bold leading-tight">{title}</div>
            <div className="mt-1 text-xs leading-snug text-white/85">
              {subtitle}
            </div>
          </div>
        </aside>
      )}
      <div className="min-w-0 flex-1 p-2 md:p-3">{children}</div>
    </div>
  );
}
