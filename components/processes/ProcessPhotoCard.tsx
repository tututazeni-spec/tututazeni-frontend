// components/processes/ProcessPhotoCard.tsx
// Card de modelo de processo da aba «Modelos de Processos», no mesmo desenho do
// cartão de formação do catálogo (TrainingCard → PhotoCard compacto): cor
// própria por id, etiquetas, métricas em linha e linhas de informação.

'use client';

import {
  Building2,
  FileStack,
  ListChecks,
  PlayCircle,
  Tag,
} from 'lucide-react';
import { NavyBadge, type NavyTone } from '@/components/courses/NavyCard';
import { PhotoCard } from '@/components/courses/PhotoCard';
import { PROCESS_STATUS_MAP, RISK_LEVEL_MAP } from './constants';
import type { Process, ProcessStatus, RiskLevel } from './types';

const STATUS_TONE: Record<ProcessStatus, NavyTone> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  ACTIVE: 'success',
  ARCHIVED: 'neutral',
};

const RISK_TONE: Record<RiskLevel, NavyTone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

interface ProcessPhotoCardProps {
  process: Process;
  onClick: () => void;
}

export function ProcessPhotoCard({
  process: p,
  onClick,
}: ProcessPhotoCardProps) {
  return (
    <PhotoCard
      compact
      seed={p.id}
      onSelect={onClick}
      kicker={p.department?.name ?? 'Processo'}
      kickerIcon={Building2}
      title={p.title}
      subtitle={`${p.code} · v${p.version}`}
      fallback={<FileStack size={64} strokeWidth={1.25} />}
      badges={
        <>
          <NavyBadge tone={STATUS_TONE[p.status]}>
            {PROCESS_STATUS_MAP[p.status].label}
          </NavyBadge>
          <NavyBadge tone={RISK_TONE[p.riskLevel]}>
            Risco {RISK_LEVEL_MAP[p.riskLevel].label.toLowerCase()}
          </NavyBadge>
        </>
      }
      metrics={[
        { icon: ListChecks, text: `${p.steps?.length ?? 0} etapas` },
        { icon: PlayCircle, text: `${p._count?.instances ?? 0} instâncias` },
        ...(p.tags?.length > 0
          ? [{ icon: Tag, text: p.tags.slice(0, 3).join(', ') }]
          : []),
      ]}
    />
  );
}
