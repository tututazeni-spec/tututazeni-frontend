// components/ui/ModuleBanner.tsx
//
// Banner de topo dos módulos: foto a toda a largura com gradiente #0F1F3D só na
// metade inferior (para o título/botão terem contraste sem escurecer o resto da
// foto) e título + subtítulo em branco. A barra de abas sobe `BANNER_TABS_CLASS`
// para cima da foto, para banner e navegação lerem-se como um só bloco.
// Mesmo desenho de app/(platform)/courses/page.tsx.

import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Classe da barra de abas colocada logo a seguir ao banner. */
export const BANNER_TABS_CLASS = 'relative z-10 -mt-8 mb-6 px-3 sm:px-6';

export interface ModuleBannerProps {
  /** Caminho em /public, p.ex. "/images/biblioteca.jpg". */
  src: string;
  title: string;
  hint?: string;
  icon?: LucideIcon | null;
  /** Botão principal à direita; sobre o gradiente fica branco e inverte ao pairar. */
  action?: ReactNode;
  /** object-position da foto (as fotos 16:9 são recortadas em faixa). */
  position?: string;
  className?: string;
}

export function ModuleBanner({
  src,
  title,
  hint,
  icon: Icon,
  action,
  position = 'center 40%',
  className,
}: ModuleBannerProps) {
  return (
    <header
      className={cn(
        'relative h-44 overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(15,31,61,0.18)] sm:h-56',
        className,
      )}
    >
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="(min-width: 1280px) 1216px, 100vw"
        className="object-cover"
        style={{ objectPosition: position }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-[#0F1F3D]/90 via-[#0F1F3D]/35 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-10 sm:px-7">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white">
              <Icon size={22} strokeWidth={1.8} />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {title}
            </h1>
            {hint && (
              <p className="mt-0.5 font-body text-xs text-white/90">{hint}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="[&_a]:border [&_a]:border-white [&_a]:!bg-white [&_a]:!text-[#0F1F3D] [&_a]:transition-colors [&_a:hover]:!bg-[#0F1F3D] [&_a:hover]:!text-white [&_button]:border [&_button]:border-white [&_button]:!bg-white [&_button]:!text-[#0F1F3D] [&_button]:transition-colors [&_button:hover]:!bg-[#0F1F3D] [&_button:hover]:!text-white">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
