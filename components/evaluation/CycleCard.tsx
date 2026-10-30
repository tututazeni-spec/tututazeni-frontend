// components/evaluation/CycleCard.tsx
// Cartão de um ciclo de avaliação (separador "Ciclos de Avaliação") — mesmo
// desenho do cartão de curso (components/courses/CourseListCard.tsx): gradiente
// na cor própria de cada ciclo, título em maiúsculas, painel recortado no canto,
// badge de estado, métricas empilhadas, linhas com seta e painel de progresso
// com as acções do ciclo. A informação é a que o ciclo já mostrava.

import { Fragment, type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  InfoRow,
  Metric,
  titleLines,
} from '@/components/courses/CourseListCard';
import { PALETTE } from '@/components/onboarding/TemplateCard';

export interface CycleCardInfo {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface CycleCardProps {
  /** Escolhe a cor do cartão (id do ciclo). */
  seed: number;
  /** Linha por cima do título (modelo de avaliação). */
  kicker: string;
  kickerIcon: LucideIcon;
  title: string;
  /** Linha por baixo do título (datas). */
  subtitle?: string;
  status: { label: string; intent: BadgeProps['intent'] };
  /** As duas primeiras ficam como métricas; as restantes, em linhas com seta. */
  infos: CycleCardInfo[];
  progress: { value: number; label: string };
  /** Botões de acção no painel inferior. */
  footer?: ReactNode;
}

export function CycleCard({
  seed,
  kicker,
  kickerIcon: KickerIcon,
  title,
  subtitle,
  status,
  infos,
  progress,
  footer,
}: CycleCardProps) {
  // Cada ciclo mantém a sua cor própria, escolhida pelo id.
  const palette = PALETTE[Math.abs(seed) % PALETTE.length];
  const metrics = infos.slice(0, 2);
  const rows = infos.slice(2);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] motion-reduce:hover:scale-100"
      style={{
        background: `linear-gradient(165deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      <div className="relative min-h-[240px] shrink-0">
        <div
          aria-hidden
          className="absolute -right-6 -top-4 h-[231px] w-[62%] rotate-6 rounded-[48px] opacity-80"
          style={{ background: palette[0] }}
        />
        <div
          aria-hidden
          className="absolute right-0 top-0 flex h-[220px] w-[57%] items-center justify-center overflow-hidden rounded-bl-[56px] rounded-tl-[48px] bg-white/10"
        >
          <KickerIcon size={84} strokeWidth={1.25} className="text-white/60" />
        </div>
        <div className="relative z-10 w-[56%] px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <KickerIcon size={20} strokeWidth={1.75} />
            </span>
            <span className="line-clamp-2 text-sm font-medium leading-tight">
              {kicker}
            </span>
          </div>
          <div className="pt-5">
            <h3 className="font-body text-2xl font-extrabold uppercase leading-tight tracking-wide">
              {titleLines(title).map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className="block whitespace-nowrap">{line}</span>
                </Fragment>
              ))}
            </h3>
            {subtitle && (
              <p className="line-clamp-3 pt-2 text-sm text-on-brand-muted">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
        <Badge intent={status.intent}>{status.label}</Badge>
      </div>

      <div className="space-y-3 px-5 pt-4">
        {metrics.map(({ icon, label, value }) => (
          <Metric key={label} icon={icon}>
            {label}: {value}
          </Metric>
        ))}
      </div>

      <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
        {rows.map(({ icon, label, value }) => (
          <InfoRow key={label} icon={icon}>
            <span className="line-clamp-1">
              {label}: {value}
            </span>
          </InfoRow>
        ))}
      </div>

      <div className="m-4 mt-2 space-y-3 rounded-panel bg-white/10 px-4 py-3">
        <div>
          <p className="pb-2 text-xs text-on-brand-muted">{progress.label}</p>
          <div className="flex items-center gap-3">
            <ProgressBar
              value={progress.value}
              color={palette[3]}
              className="flex-1"
            />
            <span className="text-xs tabular-nums text-on-brand-muted">
              {progress.value}%
            </span>
          </div>
        </div>
        {footer && <div className="flex flex-wrap gap-2">{footer}</div>}
      </div>
    </div>
  );
}
