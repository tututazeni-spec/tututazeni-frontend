// components/ui/SlantedCover.tsx
// Imagem à direita de um cartão claro, a toda a altura, com aresta esquerda
// inclinada e filete azul — desenho de public/images/card interno.jpeg.
// O pai tem de ser `relative overflow-hidden`; o conteúdo deve reservar a
// mesma largura à direita (ver `SLANTED_COVER_PAD`).

import type { ReactNode } from 'react';

interface SlantedCoverProps {
  /** URL da imagem; sem ela mostra-se `fallback` sobre o degradé. */
  src?: string | null;
  /** Ícone mostrado quando não há imagem. */
  fallback: ReactNode;
  /** Cores do degradé de reserva (ex.: PALETTE[i][0] e [2]). */
  from: string;
  to: string;
  /** Largura da imagem, em % do cartão (por omissão 43). */
  width?: number;
}

export function SlantedCover({
  src,
  fallback,
  from,
  to,
  width = 43,
}: SlantedCoverProps) {
  return (
    <div
      aria-hidden
      className="absolute inset-y-0 right-0 hidden bg-[#1F5FBF] sm:block"
      style={{
        width: `${width}%`,
        clipPath: 'polygon(23% 0, 100% 0, 100% 100%, 0 100%)',
      }}
    >
      <div
        className="flex h-full w-full items-center justify-center text-white/70"
        style={{
          clipPath: 'polygon(calc(23% + 6px) 0, 100% 0, 100% 100%, 6px 100%)',
          background: src
            ? undefined
            : `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            decoding="async"
            src={src}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          fallback
        )}
      </div>
    </div>
  );
}
