// components/courses/CategoryCard.tsx
// Cartão da aba "Categorias" no desenho do "workshop de inovação"
// (public/images): cartão branco, pílulas de etiqueta/estado no topo, ícone
// redondo + título a azul-marinho, linhas de informação com ícone, painel
// recortado na diagonal à direita e rodapé com botões de acção. A categoria
// não tem foto — o painel usa o gradiente da paleta (por id) com o ícone.

import type { ReactNode } from 'react';
import { CalendarDays, Tag, type LucideIcon } from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';

export const CATEGORY_BTN_PRIMARY =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0F1F3D] px-3 text-sm font-semibold text-white hover:bg-[#1B2F57] disabled:opacity-50';
export const CATEGORY_BTN_GHOST =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#D5DCE8] bg-white px-3 text-sm font-semibold text-[#0F1F3D] hover:bg-[#F2F5FA] disabled:opacity-50';

interface InfoLineProps {
  icon: LucideIcon;
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
}

function InfoLine({
  icon: Icon,
  text,
  onClick,
  disabled,
  label,
}: InfoLineProps) {
  const body = (
    <>
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-[#4B5E80]" />
      <span className="text-sm font-medium text-[#0F1F3D]">{text}</span>
    </>
  );
  if (!onClick) return <div className="flex items-center gap-2">{body}</div>;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-2 rounded-md text-left enabled:hover:underline disabled:cursor-default"
    >
      {body}
    </button>
  );
}

interface CategoryCardProps {
  seed: number;
  title: string;
  subtitle?: string | null;
  active: boolean;
  onToggleActive: () => void;
  createdAt: string;
  courseCount: number;
  onViewCourses: () => void;
  /** Botões do rodapé (usar as classes CATEGORY_BTN_*). */
  actions: ReactNode;
}

export function CategoryCard({
  seed,
  title,
  subtitle,
  active,
  onToggleActive,
  createdAt,
  courseCount,
  onViewCourses,
  actions,
}: CategoryCardProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];

  return (
    <div className="relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-3xl border border-[#E4E9F2] bg-white p-4 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      {/* Painel recortado na diagonal (canto superior direito) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 hidden h-[60%] w-[30%] items-center justify-center sm:flex"
        style={{
          background: `linear-gradient(150deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
          clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 78%)',
        }}
      >
        <Tag size={36} strokeWidth={1.25} className="ml-5 text-white/80" />
      </div>

      <div className="relative flex items-center gap-3 sm:max-w-[68%]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0E6B4E] text-white">
          <Tag size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="break-words font-body text-xl font-extrabold leading-tight text-[#0F1F3D]">
            {title}
          </h3>
          {subtitle && (
            <p className="line-clamp-1 text-sm text-[#5B6B88]">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-2 sm:max-w-[68%]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6366F1] px-3 py-1 text-xs font-semibold text-white">
          <Tag size={12} strokeWidth={2} />
          Categoria
        </span>
        <button
          type="button"
          onClick={onToggleActive}
          title={active ? 'Desactivar categoria' : 'Activar categoria'}
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold hover:brightness-95 ${active ? 'bg-[#2B7FE8] text-white' : 'bg-[#E4E9F2] text-[#4B5E80]'}`}
        >
          {active ? 'Activa' : 'Inactiva'}
        </button>
        <InfoLine
          icon={Tag}
          text={`${courseCount} ${courseCount === 1 ? 'curso' : 'cursos'}`}
          label="Ver cursos da categoria"
          disabled={courseCount === 0}
          onClick={onViewCourses}
        />
        <InfoLine
          icon={CalendarDays}
          text={new Date(createdAt).toLocaleDateString('pt')}
        />
      </div>

      <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-[#E4E9F2] pt-3">
        {actions}
      </div>
    </div>
  );
}
