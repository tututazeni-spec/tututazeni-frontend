// components/ui/DetailCardParts.tsx
// Peças da "ficha" em duas colunas (desenho formadores2.jpeg), partilhadas
// pelos modais de detalhe (Formador, Avaliação…): cabeçalho com avatar,
// linha de informação com ícone cheio e secção com ícone em círculo claro.
// Cor de marca: azul marinho #0F1F3D (--color-brand-ink).

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export const DETAIL_NAVY = 'var(--color-brand-ink)';
// Rótulos (Código, Família…): seguem o azul marinho, mas um cartão pode fixá-los
// com --detail-label mesmo quando recolore --color-brand-ink.
const DETAIL_TEXT = 'var(--detail-label, var(--color-ink))';
const DETAIL_LABEL = 'var(--detail-label, var(--color-brand-ink))';

export function detailTint(percent: number): string {
  return `color-mix(in srgb, ${DETAIL_NAVY} ${percent}%, white)`;
}

export function detailInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

interface DetailHeaderProps {
  name: string;
  avatarUrl?: string | null;
  /** Ícone no lugar das iniciais (quando não há foto). */
  icon?: LucideIcon;
  /** Linha por baixo do nome (ex.: cargo · departamento). */
  subtitle?: ReactNode;
  /** Etiquetas (pílulas) por baixo do nome. */
  children?: ReactNode;
}

/** Faixa de topo: avatar grande com anel, nome e etiquetas, e faixa decorativa à direita. */
export function DetailHeader({
  name,
  avatarUrl,
  icon: HeaderIcon,
  subtitle,
  children,
}: DetailHeaderProps) {
  return (
    <div
      className="relative -mx-6 -mt-6 overflow-hidden px-6 py-6"
      style={{
        background: `linear-gradient(110deg, #ffffff 55%, ${detailTint(12)} 100%)`,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-72 w-56 rotate-[28deg] rounded-[40%]"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${DETAIL_NAVY} 55%, white), ${DETAIL_NAVY})`,
          opacity: 0.9,
        }}
      />
      <div className="relative flex items-center gap-5 pr-14">
        <span
          className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full p-1.5"
          style={{ background: detailTint(25) }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center rounded-full text-3xl font-bold text-white"
              style={{ backgroundColor: DETAIL_NAVY }}
            >
              {HeaderIcon ? (
                <HeaderIcon size={44} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                detailInitials(name)
              )}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <h2
            className="break-words font-display text-3xl font-bold"
            style={{ color: DETAIL_LABEL }}
          >
            {name}
          </h2>
          {subtitle && (
            <div className="mt-1 text-sm text-ink-muted">{subtitle}</div>
          )}
          {children && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Linha da coluna esquerda: ícone cheio em azul marinho + rótulo + valor. */
export function DetailInfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: DETAIL_LABEL }}
      >
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-semibold" style={{ color: DETAIL_LABEL }}>
          {label}
        </div>
        <div className="break-words text-sm" style={{ color: DETAIL_TEXT }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Linha da coluna direita: ícone em círculo claro + título + conteúdo. */
export function DetailSectionRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor: `color-mix(in srgb, ${DETAIL_LABEL} 10%, white)`,
          color: DETAIL_LABEL,
        }}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold" style={{ color: DETAIL_LABEL }}>
          {label}
        </div>
        <div className="mt-0.5 text-sm" style={{ color: DETAIL_TEXT }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Divisória vertical entre as duas colunas (só em ecrãs largos). */
export function DetailDivider() {
  return (
    <div
      aria-hidden
      className="hidden w-px md:block"
      style={{ backgroundColor: detailTint(20) }}
    />
  );
}
