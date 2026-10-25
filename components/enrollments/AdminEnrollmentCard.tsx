// components/enrollments/EnrollmentCard.tsx
// Cartão de inscrição (separador "Inscrições") no desenho do "workshop de
// inovação" (public/images): cartão branco, pílulas no topo, ícone redondo +
// título a azul-marinho, linhas de informação com ícone, painel recortado na
// diagonal à direita e rodapé com botões. No lugar da imagem vai a foto do
// avatar do utilizador inscrito (ou as iniciais, sobre o gradiente da paleta).

import type { ReactNode } from 'react';
import { GraduationCap, type LucideIcon } from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { initials } from '@/components/courses/NavyCard';

export type AdminEnrollmentTone =
  'success' | 'danger' | 'warning' | 'info' | 'neutral';

const TONE_PILL: Record<AdminEnrollmentTone, string> = {
  success: 'bg-[#12A150] text-white',
  danger: 'bg-[#E5384F] text-white',
  warning: 'bg-[#F2B01E] text-[#3F2D00]',
  info: 'bg-[#2B7FE8] text-white',
  neutral: 'bg-brand-line text-[#4B5E80]',
};

export const ADMIN_ENROLLMENT_BTN_PRIMARY =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-control bg-brand px-4 text-sm font-semibold text-white hover:bg-[#1B2F57] disabled:opacity-50';
export const ADMIN_ENROLLMENT_BTN_GHOST =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-control border border-[#D5DCE8] bg-white px-3 text-sm font-semibold text-brand hover:bg-[#F2F5FA] disabled:opacity-50';

export interface AdminEnrollmentInfo {
  icon: LucideIcon;
  text: string;
  danger?: boolean;
}

interface AdminEnrollmentCardProps {
  seed: number;
  /** Título do curso. */
  title: string;
  /** Linha por baixo do título (nome do utilizador). */
  subtitle?: string;
  avatar: { name: string; url?: string | null };
  /** Elemento antes das pílulas (ex.: checkbox de selecção). */
  lead?: ReactNode;
  status: { label: string; tone: AdminEnrollmentTone };
  /** Pílulas extra (ex.: Obrigatório, origem). */
  tags?: string[];
  infos: AdminEnrollmentInfo[];
  /** Linha de rodapé à esquerda (ex.: departamento). */
  footerLabel?: string;
  /** Botões do rodapé (usar as classes ADMIN_ENROLLMENT_BTN_*). */
  actions?: ReactNode;
}

export function AdminEnrollmentCard({
  seed,
  title,
  subtitle,
  avatar,
  lead,
  status,
  tags = [],
  infos,
  footerLabel,
  actions,
}: AdminEnrollmentCardProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-panel border border-brand-line bg-white p-6 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      {/* Painel recortado na diagonal com a foto do avatar */}
      <div
        aria-hidden={avatar.url ? undefined : true}
        className="pointer-events-none absolute right-0 top-0 hidden h-[68%] w-[34%] items-center justify-center overflow-hidden sm:flex"
        style={{
          background: `linear-gradient(150deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
          clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 78%)',
        }}
      >
        {avatar.url ? (
          // Pode ser data URL (base64) — <img> nativo, como em ui/Avatar.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar.url}
            alt={`Foto de ${avatar.name}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="ml-8 text-5xl font-extrabold text-white/90">
            {initials(avatar.name)}
          </span>
        )}
      </div>

      <div className="relative flex flex-wrap items-center gap-2 sm:max-w-[62%]">
        {lead}
        <span
          className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold ${TONE_PILL[status.tone]}`}
        >
          {status.label}
        </span>
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full bg-[#6366F1] px-3.5 py-1.5 text-sm font-semibold text-white"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="relative mt-5 flex items-center gap-4 sm:max-w-[62%]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0E6B4E] text-white">
          <GraduationCap size={26} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="break-words font-body text-2xl font-extrabold leading-tight text-brand">
            {title}
          </h3>
          {subtitle && (
            <p className="line-clamp-2 pt-0.5 text-base text-[#5B6B88]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-6 flex flex-1 flex-col gap-3">
        {infos.map(({ icon: Icon, text, danger }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon
              size={20}
              strokeWidth={1.75}
              className={`shrink-0 ${danger ? 'text-[#E5384F]' : 'text-[#4B5E80]'}`}
            />
            <span
              className={`text-[15px] font-medium ${danger ? 'text-[#C42B40]' : 'text-brand'}`}
            >
              {text}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-brand-line pt-4">
        <span className="min-w-0 truncate text-sm text-[#5B6B88]">
          {footerLabel}
        </span>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}
