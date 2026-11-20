// components/evaluation/CycleCard.tsx
// Cartão de um ciclo de avaliação (separador "Ciclos de Avaliação") — desenho
// do cartão de template dos Planos de Integração (EvalTemplateCard): imagem do
// ciclo no topo, estado, métricas, linhas de informação e painel de progresso
// com as acções do ciclo. A informação é a que o ciclo já mostrava.

import type { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EvalTemplateCard, type ChipTone } from './EvalTemplateCard';

export interface CycleCardInfo {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface CycleCardProps {
  /** Escolhe a cor do cartão (id do ciclo). */
  seed: number;
  /** Selo por cima do título (modelo de avaliação). */
  kicker: string;
  kickerIcon: LucideIcon;
  title: string;
  /** Imagem do ciclo (data URL ou URL), opcional: sem ela, o ícone do modelo. */
  imageUrl?: string | null;
  /** Linha por baixo do título (datas). */
  subtitle?: string;
  status: { label: string; intent: BadgeProps['intent'] };
  /** As duas primeiras ficam como métricas; as restantes, em linhas. */
  infos: CycleCardInfo[];
  progress: { value: number; label: string };
  /** Botões de acção no painel inferior. */
  footer?: ReactNode;
  /** Clique no cartão (ex.: iniciar a avaliação). Sem valor, não é clicável. */
  onSelect?: () => void;
  /** Botões redondos sobre o canto superior direito (menu de 3 pontos). */
  actions?: ReactNode;
}

const TONES: ChipTone[] = ['success', 'neutral', 'warning', 'danger', 'info'];

export function CycleCard({
  seed,
  kicker,
  kickerIcon: KickerIcon,
  title,
  imageUrl,
  subtitle,
  status,
  infos,
  progress,
  footer,
  onSelect,
  actions,
}: CycleCardProps) {
  const metrics = infos.slice(0, 2);
  const rows = infos.slice(2);
  const tone = TONES.find((t) => t === status.intent) ?? 'neutral';

  return (
    <EvalTemplateCard
      seed={seed}
      imageUrl={imageUrl}
      imageAlt={`Imagem do ciclo ${title}`}
      fallback={<KickerIcon size={84} strokeWidth={1.25} />}
      chip={{ label: status.label, tone }}
      actions={actions}
      onSelect={onSelect}
      badges={<Badge intent="info">{kicker}</Badge>}
      metrics={metrics.map(({ icon, label, value }) => ({
        icon,
        text: `${label}: ${value}`,
      }))}
      lines={rows.map(({ icon, label, value }) => ({
        icon,
        text: `${label}: ${value}`,
      }))}
      panel={
        <>
          <div>
            <p className="pb-2 text-xs text-on-brand-muted">{progress.label}</p>
            <div className="flex items-center gap-3">
              <ProgressBar value={progress.value} className="flex-1" />
              <span className="text-xs tabular-nums text-on-brand-muted">
                {progress.value}%
              </span>
            </div>
          </div>
          {footer && (
            <div
              className="flex flex-wrap gap-2"
              onClick={(ev) => ev.stopPropagation()}
              onKeyDown={(ev) => ev.stopPropagation()}
            >
              {footer}
            </div>
          )}
        </>
      }
      title={title}
      subtitle={subtitle}
    />
  );
}
