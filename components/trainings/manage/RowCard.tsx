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
  /** Metade da altura: uma só linha, sem círculo grande. */
  compact?: boolean;
}

export function RowCard({
  icon: Icon,
  leading,
  title,
  badges,
  meta = [],
  actions,
  className = '',
  compact = false,
}: RowCardProps) {
  return (
    <div
      className={`flex flex-wrap items-center rounded-2xl border bg-[#F3F7FE] ${compact ? 'border-[#0F1F3D]/50' : 'border-[#0F1F3D]'} ${compact ? 'gap-3 px-3 py-1' : 'gap-4 px-4 py-3'} ${className}`}
    >
      {leading ?? (
        <div
          className={`flex shrink-0 items-center justify-center rounded-full bg-[#0F1F3D] text-white ${compact ? 'h-8 w-8' : 'h-14 w-14'}`}
        >
          {Icon && <Icon size={compact ? 16 : 26} strokeWidth={1.75} />}
        </div>
      )}
      <div
        className={`hidden w-px bg-[#0F1F3D]/40 sm:block ${compact ? 'h-8' : 'h-14'}`}
      />
      <div
        className={`min-w-0 flex-1 ${compact ? 'flex flex-wrap items-center gap-x-3' : 'space-y-2'}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`min-w-0 truncate font-bold text-[#0F1F3D] ${compact ? 'text-sm' : 'text-lg'}`}
          >
            {title}
          </span>
          {badges}
        </div>
        {meta.length > 0 && (
          <div
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[#0F1F3D] ${compact ? 'text-xs' : 'text-sm'}`}
          >
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
          <div
            className={`hidden w-px bg-[#0F1F3D]/40 sm:block ${compact ? 'h-8' : 'h-14'}`}
          />
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
