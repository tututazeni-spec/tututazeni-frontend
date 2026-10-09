// components/courses/NavyCard.tsx
// Cartão compacto "cabeçalho azul-marinho + corpo branco com grupos de
// informação" (docs/prompt_4_cards.md, Opção 2). Partilhado pelas listas do
// módulo Cursos (Categorias, Matrículas, Progresso).

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (parts[0][0] + last).toUpperCase();
}

/** Classes para botões/triggers sobre o cabeçalho escuro. */
export const NAVY_ACTION =
  'inline-flex h-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-[#C7D4E8] hover:bg-white/10 hover:text-white disabled:opacity-50';

export function NavyBadge({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  const cls =
    'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#263F67] px-2.5 py-1 text-[11px] text-white';
  if (onClick)
    return (
      <button
        type="button"
        className={`${cls} hover:bg-[#2f4d7c]`}
        onClick={onClick}
      >
        <span aria-hidden>●</span>
        {children}
      </button>
    );
  return (
    <span className={cls}>
      <span aria-hidden>●</span>
      {children}
    </span>
  );
}

export interface NavyInfo {
  icon: LucideIcon;
  value: string;
  label: string;
  danger?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

function Info({ icon: Icon, value, label, danger }: NavyInfo) {
  return (
    <div className="flex min-w-0 items-center gap-2 px-2 text-left sm:px-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[#0D6EFD]">
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div
          className={`text-xs font-semibold leading-tight ${danger ? 'text-red-600' : 'text-[#0F1F3D]'}`}
        >
          {value}
        </div>
        <div className="text-[11px] leading-tight text-[#71829B]">{label}</div>
      </div>
    </div>
  );
}

const COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
};

interface NavyCardProps {
  title: string;
  /** Elemento antes do título (ex.: checkbox de selecção). */
  lead?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  avatar?: { name: string; url?: string | null };
  subtitle?: string;
  subtitleIcon?: LucideIcon;
  infos: NavyInfo[];
  onClick?: () => void;
}

export function NavyCard({
  title,
  lead,
  badge,
  actions,
  avatar,
  subtitle,
  subtitleIcon: SubIcon,
  infos,
  onClick,
}: NavyCardProps) {
  return (
    <div
      onClick={onClick}
      className={`overflow-hidden rounded-2xl border border-[#DCE5F1] bg-white shadow-[0_8px_24px_rgba(15,31,61,0.08)] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="bg-gradient-to-br from-[#0F1F3D] to-[#132B52] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
            {lead}
            <h3 className="line-clamp-1 min-w-0 text-base font-semibold uppercase leading-tight text-white">
              {title}
            </h3>
          </div>
          <div
            className="flex shrink-0 items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {badge}
            {actions}
          </div>
        </div>
        {(avatar || subtitle) && (
          <div className="mt-2 flex min-w-0 items-center gap-3">
            {avatar &&
              (avatar.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar.url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D6EFD] text-xs font-bold text-white">
                  {initials(avatar.name)}
                </span>
              ))}
            <div className="min-w-0">
              {avatar && (
                <div className="truncate text-sm font-semibold leading-tight text-white">
                  {avatar.name}
                </div>
              )}
              {subtitle && (
                <div className="flex items-center gap-1 text-xs text-[#C7D4E8]">
                  {SubIcon && (
                    <SubIcon size={12} strokeWidth={1.75} className="shrink-0" />
                  )}
                  <span className="truncate">{subtitle}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={`grid grid-cols-2 gap-y-3 px-3 py-3 lg:gap-y-0 ${COLS[Math.min(infos.length, 4)]}`}
      >
        {infos.map((info, i) => (
          <div
            key={info.label + i}
            className={i > 0 ? 'lg:border-l lg:border-[#DCE5F1]' : ''}
          >
            {info.onClick ? (
              <button
                type="button"
                disabled={info.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  info.onClick?.();
                }}
                className="w-full rounded-lg enabled:cursor-pointer enabled:hover:bg-[#F3F7FD]"
              >
                <Info {...info} />
              </button>
            ) : (
              <Info {...info} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
