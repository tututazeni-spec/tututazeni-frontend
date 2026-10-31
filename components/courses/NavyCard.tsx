// components/courses/NavyCard.tsx
// Cartão "inscrições" do módulo Cursos (public/images/inscrições.jpeg): fundo
// escuro em gradiente na cor da paleta (ou foto, se vier), linha de topo com
// ícone + etiqueta e menu, título grande em maiúsculas, badges em pílula e um
// painel de vidro com as informações. Partilhado pelas listas do módulo Cursos
// (Categorias, Inscrições, Progresso, Turmas).

import type { ReactNode } from 'react';
import { GraduationCap, type LucideIcon } from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { getInitials } from '@/lib/format';

/** Classes para botões/triggers sobre o cartão escuro. */
export const NAVY_ACTION =
  'inline-flex h-8 items-center justify-center rounded-full bg-brand/70 px-2 text-xs font-medium text-white/80 hover:bg-white/20 hover:text-white disabled:opacity-50';

/** Botão de acção principal sobre o cartão escuro. */
export const NAVY_BTN =
  'inline-flex h-9 items-center justify-center rounded-full bg-white/90 px-4 text-sm font-semibold text-brand hover:bg-surface disabled:opacity-50';

export type NavyTone =
  'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'light';

const TONE: Record<NavyTone, { pill: string; dot: string }> = {
  success: { pill: 'bg-success-subtle text-success-ink', dot: 'bg-[#22A15A]' },
  danger: { pill: 'bg-danger-subtle text-danger-ink', dot: 'bg-[#E5384F]' },
  warning: { pill: 'bg-warning-subtle text-warning-ink', dot: 'bg-[#F2B01E]' },
  info: { pill: 'bg-brand-soft text-brand-ink', dot: 'bg-[#2F7BEA]' },
  neutral: { pill: 'bg-white/85 text-brand', dot: 'bg-[#6B7A90]' },
  // Pílula branca com ponto azul (cartão "turmas abertas").
  light: { pill: 'bg-white text-brand', dot: 'bg-[#2F7BEA]' },
};

export interface NavyBadgeProps {
  children: ReactNode;
  onClick?: () => void;
  tone?: NavyTone;
  /** Pílula maior (variante `photo` do cartão). */
  large?: boolean;
}

export function NavyBadge({
  children,
  onClick,
  tone = 'success',
  large,
}: NavyBadgeProps) {
  const t = TONE[tone];
  const size = large ? 'px-4 py-1.5 text-sm font-bold' : 'px-3 py-1 text-xs';
  const cls = `inline-flex shrink-0 items-center gap-1.5 rounded-full font-semibold ${size} ${t.pill}`;
  const dot = <span aria-hidden className={`h-2 w-2 rounded-full ${t.dot}`} />;
  if (onClick)
    return (
      <button
        type="button"
        className={`${cls} hover:brightness-95`}
        onClick={onClick}
      >
        {dot}
        {children}
      </button>
    );
  return (
    <span className={cls}>
      {dot}
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

/** Impede que um intervalo "09:30-14:34" se parta ao meio quando o valor muda de linha. */
function keepTimesTogether(value: string): ReactNode {
  return value.split(/(\d{1,2}:\d{2}-\d{1,2}:\d{2})/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function Info({
  icon: Icon,
  value,
  label,
  danger,
  flush,
  compact,
  large,
}: NavyInfo & { flush?: boolean; compact?: boolean; large?: boolean }) {
  return (
    <div
      className={`flex min-w-0 items-center text-left ${large ? 'gap-3 px-1 @2xl:gap-1.5 @2xl:px-0.5' : `px-2 ${compact ? 'gap-2' : 'gap-3'} ${flush ? 'pl-0 sm:pl-0 sm:pr-4' : 'sm:px-4'}`}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-white/90 text-brand ${compact ? 'h-7 w-7' : large ? 'h-10 w-10 @2xl:h-8 @2xl:w-8' : 'h-9 w-9'}`}
      >
        <Icon size={compact ? 14 : large ? 16 : 18} strokeWidth={1.75} />
      </span>
      <div className={`min-w-0 ${large ? '@2xl:max-w-[7rem]' : ''}`}>
        <div
          className={`font-semibold leading-tight ${large ? 'text-base font-bold @2xl:text-sm' : 'text-sm'} ${danger ? 'text-red-300' : 'text-white'}`}
        >
          {large ? keepTimesTogether(value) : value}
        </div>
        <div className="text-xs leading-tight text-white/70">{label}</div>
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

/** Cores da variante photo: canto claro, tom base, tom fundo e círculo do ícone. */
export interface PhotoAccent {
  light: string;
  base: string;
  deep: string;
  circle: string;
}

/** Azul padrão do cartão "turmas abertas". */
export const PHOTO_ACCENT_DEFAULT: PhotoAccent = {
  light: '#0F46B8',
  base: '#0A2A6B',
  deep: '#071C4A',
  circle: '#1D56E0',
};

/**
 * Células do painel da variante photo: 2×2 em cartões estreitos e 4 numa só
 * linha quando o cartão tem largura (container query), com separadores certos
 * para cada disposição.
 */
function photoCellClass(i: number) {
  const row2 =
    i >= 2 ? 'border-t border-white/15 pt-3 @2xl:border-t-0 @2xl:pt-0' : '';
  const col =
    i % 2 === 1
      ? 'border-l border-white/30 pl-4 @2xl:pl-3'
      : i > 0
        ? '@2xl:border-l @2xl:border-white/30 @2xl:pl-3'
        : '';
  return `${row2} ${col}`;
}

function seedFrom(title: string) {
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

interface NavyCardProps {
  title: string;
  /** Segunda linha do título, por baixo da primeira (ex.: a turma, sob o nome do curso). */
  titleBelow?: string;
  /** Elemento antes do título (ex.: checkbox de selecção). */
  lead?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  avatar?: { name: string; url?: string | null };
  subtitle?: string;
  subtitleIcon?: LucideIcon;
  /** Etiqueta da linha de topo, ao lado do ícone (ex.: nome do departamento). */
  kicker?: string;
  /** Ícone da linha de topo — por omissão, o capelo de formação. */
  kickerIcon?: LucideIcon;
  /** Identificador que escolhe a cor própria do cartão; sem ele usa o título. */
  seed?: number;
  /** Foto de fundo (opcional) — fica sob uma película escura. */
  image?: string | null;
  /**
   * `photo`: desenho do cartão "turmas abertas" (public/images/turmas abertas.jpeg) —
   * azul profundo, foto na metade direita que se esbate para o azul, topo e
   * painel de informações maiores. Pede `image`; os outros cartões usam `default`.
   */
  variant?: 'default' | 'photo';
  /** Cores da variante `photo` (por omissão, o azul padrão). */
  accent?: PhotoAccent;
  infos: NavyInfo[];
  /** Encosta o ícone da 1.ª informação à esquerda do painel de vidro. */
  flushFirstInfo?: boolean;
  /** Versão baixa (~metade da altura): margens e título menores, sem subtítulo. */
  compact?: boolean;
  /** Painel de progresso no fundo, 0–100. */
  progress?: { value: number; label?: string };
  /** Zona de botões de acção por baixo do painel (ex.: Publicar, Avaliar). */
  footer?: ReactNode;
  onClick?: () => void;
}

export function NavyCard({
  title,
  titleBelow,
  lead,
  badge,
  actions,
  avatar,
  subtitle,
  subtitleIcon: SubIcon,
  kicker,
  kickerIcon: KickerIcon = GraduationCap,
  seed,
  image,
  variant = 'default',
  accent = PHOTO_ACCENT_DEFAULT,
  infos,
  flushFirstInfo,
  compact,
  progress,
  footer,
  onClick,
}: NavyCardProps) {
  const palette = PALETTE[Math.abs(seed ?? seedFrom(title)) % PALETTE.length];
  const hasTop = lead || avatar || kicker || actions;
  const photo = variant === 'photo' && !compact;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-panel text-white ${compact ? 'p-2' : photo ? '@container flex min-h-[300px] flex-col p-5 sm:p-6' : 'p-5'} shadow-[0_8px_24px_rgba(15,31,61,0.25)] ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: photo
          ? `linear-gradient(115deg, ${accent.light} 0%, ${accent.base} 42%, ${accent.deep} 100%)`
          : `linear-gradient(135deg, ${palette[1]} 0%, ${palette[2]} 65%, ${palette[2]} 100%)`,
      }}
    >
      {image && photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          decoding="async"
          src={image}
          alt=""
          className="absolute inset-y-0 right-0 h-full w-[56%] object-cover object-center"
        />
      )}
      {image && !photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          decoding="async"
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: photo
            ? // Azul sólido à esquerda (onde está o texto) que se esbate sobre a foto.
              `linear-gradient(90deg, ${accent.base} 0%, ${accent.base} 44%, ${accent.base}D9 52%, ${accent.base}66 64%, ${accent.base}14 82%, transparent 100%)`
            : image
              ? `linear-gradient(90deg, ${palette[2]}F2 0%, ${palette[2]}B3 55%, ${palette[2]}66 100%)`
              : `radial-gradient(circle at 92% 8%, ${palette[0]}99 0%, transparent 45%)`,
        }}
      />

      {compact ? (
        <div className="relative space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {kicker && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                <KickerIcon size={14} strokeWidth={1.75} />
              </span>
            )}
            <h3 className="break-words font-body text-base font-extrabold uppercase leading-tight tracking-wide">
              {title}
            </h3>
            {badge && (
              <div
                className="flex flex-wrap items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {badge}
              </div>
            )}
            {actions && (
              <div
                className="ml-auto flex shrink-0 items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {actions}
              </div>
            )}
          </div>
          {infos.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-card bg-white/10 px-3 py-1.5 text-xs">
              {infos.map((info, i) => (
                <span
                  key={info.label + i}
                  className="inline-flex min-w-0 items-center gap-1.5"
                >
                  <info.icon
                    size={14}
                    strokeWidth={1.75}
                    className="shrink-0"
                  />
                  <span
                    className={`font-semibold ${info.danger ? 'text-red-300' : 'text-white'}`}
                  >
                    {info.value}
                  </span>
                  <span className="text-white/70">{info.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={photo ? 'relative flex flex-1 flex-col' : 'relative'}>
          {hasTop && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {lead}
                {avatar ? (
                  avatar.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      loading="lazy"
                      decoding="async"
                      src={avatar.url}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      {getInitials(avatar.name, '?')}
                    </span>
                  )
                ) : (
                  kicker && (
                    <span
                      className={`flex shrink-0 items-center justify-center rounded-full ${photo ? 'h-12 w-12' : `bg-white/15 ${compact ? 'h-7 w-7' : 'h-9 w-9'}`}`}
                      style={
                        photo ? { backgroundColor: accent.circle } : undefined
                      }
                    >
                      <KickerIcon
                        size={compact ? 16 : photo ? 24 : 20}
                        strokeWidth={1.75}
                      />
                    </span>
                  )
                )}
                {(avatar || kicker) && (
                  <span
                    className={`truncate font-medium ${photo ? 'text-base font-semibold' : 'text-sm'}`}
                  >
                    {avatar?.name ?? kicker}
                  </span>
                )}
              </div>
              {actions && (
                <div
                  className="flex shrink-0 items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actions}
                </div>
              )}
            </div>
          )}

          <h3
            className={`break-words font-body font-extrabold uppercase leading-tight tracking-wide ${compact ? 'mt-1.5 text-lg' : photo ? 'mt-auto max-w-[68%] pt-5 text-[1.15rem] tracking-normal' : 'mt-4 text-2xl'}`}
          >
            {title}
            {titleBelow && <span className="mt-1 block">{titleBelow}</span>}
          </h3>
          {subtitle && !compact && (
            <div
              className={`mt-1 flex items-center gap-1.5 text-white/80 ${photo ? 'text-lg' : 'text-sm'}`}
            >
              {SubIcon && (
                <SubIcon size={14} strokeWidth={1.75} className="shrink-0" />
              )}
              <span className="truncate">{subtitle}</span>
            </div>
          )}
          {badge && (
            <div
              className={`flex flex-wrap items-center gap-2 ${compact ? 'mt-2' : 'mt-3'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {badge}
            </div>
          )}

          {infos.length > 0 && (
            <div
              className={
                photo
                  ? 'mt-5 grid grid-cols-2 gap-y-3 rounded-[1.5rem] px-3 py-3.5 @2xl:grid-cols-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] backdrop-blur-md'
                  : `grid grid-cols-2 gap-y-2 rounded-card bg-white/10 px-3 backdrop-blur-sm lg:gap-y-0 ${compact ? 'mt-2 py-1.5' : 'mt-4 gap-y-3 py-3'} ${COLS[Math.min(infos.length, 4)]}`
              }
              style={
                photo ? { backgroundColor: `${accent.base}CC` } : undefined
              }
            >
              {infos.map((info, i) => (
                <div
                  key={info.label + i}
                  className={
                    photo
                      ? `min-w-0 ${photoCellClass(i)}`
                      : i > 0
                        ? 'lg:border-l lg:border-white/15'
                        : ''
                  }
                >
                  {info.onClick ? (
                    <button
                      type="button"
                      disabled={info.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        info.onClick?.();
                      }}
                      className="w-full rounded-control enabled:cursor-pointer enabled:hover:bg-white/10"
                    >
                      <Info
                        {...info}
                        flush={flushFirstInfo && i === 0}
                        compact={compact}
                        large={photo}
                      />
                    </button>
                  ) : (
                    <Info
                      {...info}
                      flush={flushFirstInfo && i === 0}
                      compact={compact}
                      large={photo}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {progress && (
            <div className="mt-3 rounded-card bg-white/10 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span>{progress.label ?? 'Progresso'}</span>
                <span className="tabular-nums">{progress.value}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress.value}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, progress.value))}%`,
                    background: palette[3],
                  }}
                />
              </div>
            </div>
          )}

          {footer && (
            <div
              className="mt-4 flex flex-wrap items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
