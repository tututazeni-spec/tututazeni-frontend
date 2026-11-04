// components/live-classes/RowCard.tsx
// Cartão em linha (public: Pictures/innova/card2.jpeg) das listas do módulo
// Aulas ao vivo — Participantes, Presenças, Formadores e Salas/Links: faixa
// azul-marinho em seta à esquerda com avatar + nome, título e estado ao centro,
// informações separadas por filetes azuis e botões em pílula à direita. Só o
// desenho: cada vista continua a passar os seus dados e acções.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { getInitials } from '@/lib/format';

/** Botão principal (azul cheio) do cartão em linha. */
export const ROW_BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[#0F1F3D] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1E3A5F] disabled:opacity-50';

/** Botão secundário (contorno azul) do cartão em linha. */
export const ROW_BTN_OUTLINE =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#0F1F3D]/60 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-[#0F1F3D] hover:bg-white disabled:opacity-50';

/** Botão redondo só com ícone (ex.: remover). */
export const ROW_BTN_ICON =
  'inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#0F1F3D]/30 bg-white/70 text-[#0F1F3D] hover:bg-white disabled:opacity-50';

export interface RowCardInfo {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface RowCardProps {
  /** Nome na faixa da esquerda. */
  name: string;
  /** Foto do avatar; sem ela mostra as iniciais (ou `icon`). */
  avatarUrl?: string | null;
  /** Ícone no círculo em vez das iniciais (ex.: salas). */
  icon?: LucideIcon;
  title: string;
  subtitle?: string | null;
  /** Estado (ex.: NavyBadge). */
  badge?: ReactNode;
  infos?: RowCardInfo[];
  /** Botões à direita. */
  actions?: ReactNode;
  onClick?: () => void;
  /** Azul marinho da marca (#0F1F3D) em vez do azul original. */
  navy?: boolean;
}

export function RowCard({
  name,
  avatarUrl,
  icon: Icon,
  title,
  subtitle,
  badge,
  infos = [],
  actions,
  onClick,
  navy = false,
}: RowCardProps) {
  const ink = navy ? 'text-[#0F1F3D]' : 'text-[#0A2A6B]';
  const inkSoft = navy ? 'text-[#0F1F3D]/70' : 'text-[#0A2A6B]/70';
  return (
    <div
      onClick={onClick}
      className={`flex flex-col overflow-hidden rounded-[1.25rem] border border-[#D6E2F7] bg-gradient-to-r from-[#F6F9FF] via-[#EAF1FD] to-[#F6F9FF] shadow-[0_4px_14px_rgba(15,70,184,0.10)] lg:flex-row lg:items-stretch ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Faixa azul-marinho com a ponta em seta */}
      <div
        className={`flex shrink-0 items-center gap-2.5 bg-gradient-to-r ${navy ? 'from-[#0F1F3D] to-[#1E3A5F]' : 'from-[#0A2A6B] to-[#1450C8]'} px-4 py-1.5 text-white lg:w-52 lg:py-1.5 lg:pr-10 lg:[clip-path:polygon(0_0,calc(100%-2rem)_0,100%_50%,calc(100%-2rem)_100%,0_100%)]`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${navy ? 'bg-[#1E3A5F]' : 'bg-[#2F7BEA]'} text-xs font-bold`}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              loading="lazy"
              decoding="async"
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : Icon ? (
            <Icon size={16} strokeWidth={1.75} />
          ) : (
            getInitials(name, '?')
          )}
        </span>
        <span className="line-clamp-2 break-words text-xs font-medium leading-tight">
          {name}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 px-3 py-1.5 lg:flex-row lg:items-center lg:gap-3">
        {/* Título + estado */}
        <div className="min-w-0 border-[#0A2A6B]/25 lg:basis-[30%] lg:border-l lg:pl-3">
          <h3
            className={`break-words font-body text-sm font-extrabold uppercase leading-tight tracking-wide ${ink}`}
          >
            {title}
          </h3>
          {(subtitle || badge) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {subtitle && (
                <span className={`break-words text-xs ${inkSoft}`}>
                  {subtitle}
                </span>
              )}
              {badge && (
                <span
                  className="inline-flex scale-90 origin-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {badge}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Informações separadas por filetes azuis */}
        {infos.length > 0 && (
          <div className="flex flex-[2] flex-wrap items-stretch gap-y-1 rounded-xl bg-white/50 px-1 py-1">
            {infos.map((info, i) => (
              <div
                key={info.label + i}
                className={`flex min-w-[6rem] flex-auto items-center justify-center gap-2 px-2 ${i > 0 ? 'sm:border-l-2 sm:border-[#2F7BEA]/40' : ''}`}
              >
                <info.icon
                  size={16}
                  strokeWidth={1.75}
                  className={`shrink-0 ${ink}`}
                />
                <div className="min-w-0">
                  <div
                    className={`break-words text-xs font-bold leading-tight ${ink}`}
                  >
                    {info.value}
                  </div>
                  <div
                    className={`break-words text-[10px] leading-tight ${inkSoft}`}
                  >
                    {info.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {actions && (
          <div
            className="flex shrink-0 flex-wrap items-center gap-2 border-[#0A2A6B]/25 lg:border-l lg:pl-3"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
