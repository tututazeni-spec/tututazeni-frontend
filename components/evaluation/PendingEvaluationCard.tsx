// components/evaluation/PendingEvaluationCard.tsx
// Cartão de avaliação pendente — mesmo desenho dos restantes cartões do módulo
// (EvalTemplateCard). Os dados é que mudam: avaliado, prazo, ciclo.

'use client';

import type { ReactNode } from 'react';
import { ClipboardList, type LucideIcon } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Avatar } from '@/components/ui/Avatar';
import { EvalTemplateCard } from './EvalTemplateCard';

/** Foto do cartão (public/images/avaliações.jpg). */
const CARD_PHOTO = '/images/avalia%C3%A7%C3%B5es.jpg';

export interface PendingEvaluationCardProps {
  /** Escolhe a cor do cartão (como o id do curso). */
  seed: number;
  title: string;
  /** Etiqueta de estado no topo (ex.: tipo de avaliação). */
  kicker?: string;
  subtitle?: string;
  /** Selos por baixo da zona de topo. */
  badges?: ReactNode;
  metrics: Array<{
    icon: LucideIcon;
    text: string;
    danger?: boolean;
  }>;
  /** Pessoa avaliada — linha com avatar. */
  evaluated: { name: string; avatarUrl?: string | null; role?: string };
  /** Linhas de informação (ciclo, departamento…). Vazias mostram "—". */
  rows: Array<{ icon: LucideIcon; text?: string | null }>;
  progress?: number;
  /** Botões de acção no fundo do cartão. */
  footer?: ReactNode;
}

export function PendingEvaluationCard({
  seed,
  title,
  kicker,
  subtitle,
  badges,
  metrics,
  evaluated,
  rows,
  progress,
  footer,
}: PendingEvaluationCardProps) {
  return (
    <EvalTemplateCard
      seed={seed}
      imageUrl={CARD_PHOTO}
      fallback={<ClipboardList size={84} strokeWidth={1.25} />}
      chip={{ label: kicker || 'Avaliação', tone: 'warning' }}
      badges={badges}
      metrics={metrics}
      lines={[
        {
          leading: (
            <Avatar
              name={evaluated.name}
              url={evaluated.avatarUrl ?? undefined}
              size="sm"
            />
          ),
          text: evaluated.name,
        },
        ...rows.map((r) => ({ icon: r.icon, text: r.text || '—' })),
      ]}
      panel={
        progress !== undefined || footer ? (
          <>
            {progress !== undefined && (
              <div className="flex items-center gap-3">
                <ProgressBar value={progress} className="flex-1" />
                <span className="text-xs tabular-nums text-on-brand-muted">
                  {progress}%
                </span>
              </div>
            )}
            {footer && <div className="flex flex-wrap gap-2">{footer}</div>}
          </>
        ) : undefined
      }
      title={title}
      subtitle={subtitle}
    />
  );
}
