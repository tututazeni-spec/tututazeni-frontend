// components/courses/CourseContentCard.tsx
// Cartão "Conteúdo do curso" do detalhe do curso, no desenho do cartão de
// Categorias: cartão branco de cantos largos, ícone redondo + título a
// azul-marinho e pílula com o total. Cada módulo é um bloco recolhível lá
// dentro, com as suas lições; o ícone do módulo usa a cor da paleta (por id).

import type { ReactNode } from 'react';
import { ChevronDown, ClipboardList, Package } from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';

interface CourseContentCardProps {
  title: string;
  /** Texto da pílula ao lado do título, p.ex. "3 módulos". */
  aside?: string;
  className?: string;
  /** Altura máxima do corpo, com scroll (barra lateral da vista de aprendizagem). */
  scrollClassName?: string;
  children: ReactNode;
}

export function CourseContentCard({
  title,
  aside,
  className,
  scrollClassName,
  children,
}: CourseContentCardProps) {
  return (
    <section
      className={`flex flex-col gap-3 overflow-hidden rounded-3xl border border-[#E4E9F2] bg-white p-4 shadow-[0_8px_24px_rgba(15,31,61,0.08)] ${className ?? ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0E6B4E] text-white">
          <ClipboardList size={20} strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 flex-1 break-words font-body text-xl font-extrabold leading-tight text-[#0F1F3D]">
          {title}
        </h3>
        {aside && (
          <span className="shrink-0 rounded-full bg-[#6366F1] px-3 py-1 text-xs font-semibold text-white">
            {aside}
          </span>
        )}
      </div>
      <div className={`flex flex-col gap-2 ${scrollClassName ?? ''}`}>
        {children}
      </div>
    </section>
  );
}

interface ContentModuleProps {
  id: number;
  title: string;
  /** Pílula à direita do título, p.ex. "2/5 aulas" ou "5 aulas". */
  meta: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function ContentModule({
  id,
  title,
  meta,
  defaultOpen = false,
  children,
}: ContentModuleProps) {
  const palette = PALETTE[Math.abs(id) % PALETTE.length];
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-[#E4E9F2] bg-[#F7F9FC]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 hover:bg-[#F2F5FA] [&::-webkit-details-marker]:hidden">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: palette[3] }}
        >
          <Package size={16} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1 break-words text-sm font-bold text-[#0F1F3D]">
          {title}
        </span>
        <span className="shrink-0 rounded-full bg-[#E4E9F2] px-2.5 py-0.5 text-xs font-semibold text-[#4B5E80]">
          {meta}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className="shrink-0 text-[#4B5E80] transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-1 border-t border-[#E4E9F2] bg-white p-2">
        {children}
      </div>
    </details>
  );
}
