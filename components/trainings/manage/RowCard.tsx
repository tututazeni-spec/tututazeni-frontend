// components/trainings/manage/RowCard.tsx
// Cartão em linha partilhado pelos separadores de gestão (Sessões,
// Participantes, Formadores, Operação): círculo navy com ícone/avatar,
// separador vertical, bloco de texto (título, etiquetas, métricas) e acções.

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface RowCardMeta {
  icon?: LucideIcon;
  value: ReactNode;
  label?: string;
}

interface RowCardProps {
  /** Ícone no círculo navy. Ignorado se `leading` for passado. */
  icon?: LucideIcon;
  /** Conteúdo próprio no lugar do círculo (ex.: Avatar). */
  leading?: ReactNode;
  title: ReactNode;
  /** Etiquetas/pílulas ao lado do título. */
  badges?: ReactNode;
  meta?: RowCardMeta[];
  actions?: ReactNode;
  className?: string;
}

export function RowCard({
  icon: Icon,
  leading,
  title,
  badges,
  meta = [],
  actions,
  className = '',
}: RowCardProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-2xl border border-[#0F1F3D] bg-[#F3F7FE] px-4 py-3 ${className}`}
    >
      {leading ?? (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white">
          {Icon && <Icon size={26} strokeWidth={1.75} />}
        </div>
      )}
      <div className="hidden h-14 w-px bg-[#0F1F3D]/40 sm:block" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate text-lg font-bold text-[#0F1F3D]">
            {title}
          </span>
          {badges}
        </div>
        {meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#0F1F3D]">
            {meta.map((m, i) => (
              <span key={i} className="inline-flex items-center gap-3">
                {i > 0 && <span className="h-4 w-px bg-[#0F1F3D]/40" />}
                <span className="inline-flex items-center gap-1.5">
                  {m.icon && <m.icon size={16} strokeWidth={1.75} />}
                  <b>{m.value}</b>
                  {m.label && <span className="text-[#4B5873]">{m.label}</span>}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
      {actions && (
        <>
          <div className="hidden h-14 w-px bg-[#0F1F3D]/40 sm:block" />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        </>
      )}
    </div>
  );
}

/** Botão redondo navy das acções do cartão. */
export function RowCardIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-[#0F1F3D] text-white transition disabled:opacity-50 ${
        danger ? 'hover:bg-red-500' : 'hover:bg-[#1E3A5F]'
      }`}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={18} strokeWidth={1.75} />
    </button>
  );
}
