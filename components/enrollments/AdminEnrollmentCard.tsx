// components/enrollments/EnrollmentCard.tsx
// Cartão de inscrição (separador "Inscrições") no desenho do "workshop de
// inovação" (public/images): cartão branco, pílulas no topo, ícone redondo +
// título a azul-marinho, linhas de informação com ícone, painel recortado na
// diagonal à direita e rodapé com botões. No lugar da imagem vai a foto do
// avatar do utilizador inscrito (ou as iniciais, sobre o gradiente da paleta).

import type { ReactNode } from 'react';
import { GraduationCap, type LucideIcon } from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { getInitials } from '@/lib/format';

export type AdminEnrollmentTone =
  'success' | 'danger' | 'warning' | 'info' | 'neutral';

const TONE_PILL: Record<AdminEnrollmentTone, string> = {
  success: 'bg-[#12A150] text-white',
  danger: 'bg-[#E5384F] text-white',
  warning: 'bg-[#F2B01E] text-warning-ink',
  info: 'bg-[#2B7FE8] text-white',
  neutral: 'bg-brand-line text-brand-muted',
};

export const ADMIN_ENROLLMENT_BTN_PRIMARY =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-control bg-brand px-3.5 text-sm font-semibold text-white hover:bg-[#1B2F57] disabled:opacity-50';
export const ADMIN_ENROLLMENT_BTN_GHOST =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-control border border-brand-line bg-surface px-3 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-50';

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
    <div className="relative flex h-full flex-col overflow-hidden rounded-panel border border-brand-line bg-surface p-4 shadow-[0_6px_18px_rgba(15,31,61,0.08)]">
      {/* Painel recortado na diagonal com a foto do avatar */}
      <div
        aria-hidden={avatar.url ? undefined : true}
        className="pointer-events-none absolute right-0 top-0 hidden h-[78%] w-[30%] items-center justify-center overflow-hidden sm:flex"
        style={{
          background: `linear-gradient(150deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
          clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 78%)',
        }}
      >
        {avatar.url ? (
          // Pode ser data URL (base64) — <img> nativo, como em ui/Avatar.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            decoding="async"
            src={avatar.url}
            alt={`Foto de ${avatar.name}`}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <span className="ml-6 text-3xl font-extrabold text-white/90">
            {getInitials(avatar.name, '?')}
          </span>
        )}
      </div>

      {/* Linha 1: estado, etiquetas e departamento/unidade (antes no rodapé) */}
      <div className="relative flex flex-wrap items-center gap-x-2 gap-y-1 sm:max-w-[68%]">
        {lead}
        <span
          className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${TONE_PILL[status.tone]}`}
        >
          {status.label}
        </span>
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full bg-[#6366F1] px-3 py-0.5 text-xs font-semibold text-white"
          >
            {t}
          </span>
        ))}
        {footerLabel && (
          <span className="min-w-0 truncate text-xs text-brand-muted">
            {footerLabel}
          </span>
        )}
      </div>

      {/* Linha 2: ícone redondo + curso + utilizador */}
      <div className="relative mt-2 flex items-center gap-3 sm:max-w-[68%]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <GraduationCap size={20} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-body text-lg font-extrabold leading-tight text-brand">
            {title}
          </h3>
          {subtitle && (
            <p className="truncate text-sm leading-tight text-brand-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Linha 3: informações em linha corrida + botões à direita */}
      <div className="relative mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-brand-line pt-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1">
          {infos.map(({ icon: Icon, text, danger }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon
                size={15}
                strokeWidth={1.75}
                className={`shrink-0 ${danger ? 'text-[#E5384F]' : 'text-brand-muted'}`}
              />
              <span
                className={`text-[13px] font-medium ${danger ? 'text-danger-ink' : 'text-brand'}`}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}
