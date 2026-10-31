// components/trainings/TrainingCard.tsx
// Cartão de treinamento no catálogo, no desenho de "card para cursos criados"
// (o mesmo do Plano de Formação, via PhotoCard). A cor vem do id da formação:
// cada formação tem a sua e coincide com a do cartão na Gestão.

'use client';

import {
  CalendarDays,
  Clock,
  GraduationCap,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NavyBadge } from '@/components/courses/NavyCard';
import { PhotoCard } from '@/components/courses/PhotoCard';
import { Avatar } from '@/components/ui/Avatar';
import { LEVEL_CFG, STATUS_CFG, TYPE_CFG } from './constants';
import { LEVEL_TONE, STATUS_TONE } from './trainingTones';
import { fmtDate, fmtHours } from './utils';
import type { TrainingCardData } from './types';

interface TrainingCardProps {
  training: TrainingCardData;
  onClick: () => void;
  /** Gestão: mostra o estado da formação e permite acções/rodapé. */
  showStatus?: boolean;
  /** Botões redondos sobre a imagem (editar, arquivar, eliminar…). */
  actions?: ReactNode;
  /** Botões principais por baixo das linhas (gerir, publicar, concluir…). */
  footer?: ReactNode;
  /** "Os meus treinamentos": estado, data da sessão e nota do próprio utilizador. */
  mine?: {
    badge: ReactNode;
    sessionDate?: string | null;
    finalScore?: number | null;
  };
}

export function TrainingCard({
  training,
  onClick,
  showStatus = false,
  actions,
  footer,
  mine,
}: TrainingCardProps) {
  const typeCfg = TYPE_CFG[training.type];

  return (
    <PhotoCard
      compact
      seed={training.colorIndex ?? training.id}
      onSelect={onClick}
      kicker={training.category ?? typeCfg?.label ?? ''}
      kickerIcon={GraduationCap}
      title={training.title}
      subtitle={training.shortDescription}
      image={training.thumbnailUrl}
      fallback={<GraduationCap size={64} strokeWidth={1.25} />}
      actions={actions}
      footer={footer}
      badges={
        <>
          {mine?.badge}
          {showStatus && training.status && (
            <NavyBadge tone={STATUS_TONE[training.status]}>
              {STATUS_CFG[training.status].label}
            </NavyBadge>
          )}
          {training.level && (
            <NavyBadge tone={LEVEL_TONE[training.level]}>
              {LEVEL_CFG[training.level].label}
            </NavyBadge>
          )}
          {typeCfg && <NavyBadge tone="neutral">{typeCfg.label}</NavyBadge>}
          {training.mandatory && (
            <NavyBadge tone="danger">Obrigatório</NavyBadge>
          )}
        </>
      }
      metrics={[
        { icon: Clock, text: fmtHours(training.workloadHours) },
        ...(mine?.sessionDate
          ? [{ icon: CalendarDays, text: fmtDate(mine.sessionDate) }]
          : []),
        ...(mine?.finalScore != null
          ? [{ icon: Trophy, text: `Nota: ${mine.finalScore}%` }]
          : []),
        ...(training.issueCertificate
          ? [{ icon: Trophy, text: 'Certificado' }]
          : []),
        ...(training._count
          ? [
              {
                icon: Users,
                text: `${training._count.participants} inscritos`,
              },
            ]
          : []),
      ]}
      rows={[
        {
          leading: training.instructor ? (
            <Avatar
              name={training.instructor.fullName}
              url={training.instructor.avatarUrl ?? undefined}
              size="sm"
            />
          ) : undefined,
          icon: training.instructor ? undefined : Users,
          text: training.instructor?.fullName ?? 'Sem formador',
        },
        ...(training._count
          ? [
              {
                icon: Star,
                text:
                  training.avgRating != null
                    ? `${training.avgRating.toFixed(1)} / 5`
                    : 'Sem avaliação',
              },
            ]
          : []),
      ]}
    />
  );
}
