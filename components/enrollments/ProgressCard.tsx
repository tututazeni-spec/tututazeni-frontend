// components/enrollments/ProgressCard.tsx
// Cartão da aba "Progresso" (equipa e departamentos/unidades) no desenho do
// "workshop de inovação" (public/images): cartão branco, pílula no topo, ícone
// redondo + título a azul-marinho, linhas de informação com ícone, painel
// recortado na diagonal à direita e barra de progresso no rodapé. O painel
// leva a foto do avatar (membros) ou, sem avatar, a taxa de conclusão.

import type { LucideIcon } from 'lucide-react';
import { Building2 } from 'lucide-react';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getInitialsFirstLast } from '@/lib/format';

export interface ProgressInfo {
  icon: LucideIcon;
  text: string;
  danger?: boolean;
}

interface ProgressCardProps {
  seed: number;
  title: string;
  subtitle?: string;
  /** Etiqueta da pílula do topo (ex.: "Departamento", "Equipa"). */
  tag: string;
  /** Ícone do círculo ao lado do título. */
  icon?: LucideIcon;
  /** Com avatar, o painel mostra a foto (ou as iniciais); sem, a percentagem. */
  avatar?: { name: string; url?: string | null };
  infos: ProgressInfo[];
  /** Barra de progresso no rodapé, 0–100. */
  progress: { value: number; label: string };
}

export function ProgressCard({
  seed,
  title,
  subtitle,
  tag,
  icon: Icon = Building2,
  avatar,
  infos,
  progress,
}: ProgressCardProps) {
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-panel border border-brand-line bg-surface p-6 shadow-[0_8px_24px_rgba(15,31,61,0.08)]">
      <div
        aria-hidden={avatar?.url ? undefined : true}
        className="pointer-events-none absolute right-0 top-0 hidden h-[68%] w-[34%] items-center justify-center overflow-hidden sm:flex"
        style={{
          background: `linear-gradient(150deg, ${palette[0]} 0%, ${palette[1]} 55%, ${palette[2]} 100%)`,
          clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 78%)',
        }}
      >
        {avatar?.url ? (
          // Pode ser data URL (base64) — <img> nativo, como em ui/Avatar.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            decoding="async"
            src={avatar.url}
            alt={`Foto de ${avatar.name}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="ml-8 text-5xl font-extrabold text-white/90">
            {avatar
              ? getInitialsFirstLast(avatar.name)
              : `${Math.round(progress.value)}%`}
          </span>
        )}
      </div>

      <div className="relative flex flex-wrap items-center gap-2 sm:max-w-[62%]">
        <span className="inline-flex items-center rounded-full bg-[#6366F1] px-3.5 py-1.5 text-sm font-semibold text-white">
          {tag}
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-4 sm:max-w-[62%]">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-success text-white">
          <Icon size={26} strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="break-words font-body text-2xl font-extrabold leading-tight text-brand">
            {title}
          </h3>
          {subtitle && (
            <p className="line-clamp-2 pt-0.5 text-base text-brand-muted">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="relative mt-6 flex flex-1 flex-col gap-3">
        {infos.map(({ icon: InfoIcon, text, danger }) => (
          <div key={text} className="flex items-center gap-3">
            <InfoIcon
              size={20}
              strokeWidth={1.75}
              className={`shrink-0 ${danger ? 'text-[#E5384F]' : 'text-brand-muted'}`}
            />
            <span
              className={`text-[15px] font-medium ${danger ? 'text-danger-ink' : 'text-brand'}`}
            >
              {text}
            </span>
          </div>
        ))}
      </div>

      <div className="relative mt-5 border-t border-brand-line pt-4">
        <p className="pb-2 text-sm text-brand-muted">{progress.label}</p>
        <div className="flex items-center gap-3">
          <ProgressBar
            value={progress.value}
            color={palette[3]}
            className="flex-1"
          />
          <span className="text-sm font-semibold tabular-nums text-brand">
            {Math.round(progress.value)}%
          </span>
        </div>
      </div>
    </div>
  );
}
