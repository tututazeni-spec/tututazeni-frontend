// components/trainings/TrainingCard.tsx
// Cartão de treinamento no catálogo, no desenho de "card para cursos criados"
// (o mesmo do Plano de Formação, via PhotoCard). A cor vem do id da formação:
// cada formação tem a sua e coincide com a do cartão na Gestão.

'use client';

import { Clock, GraduationCap, Star, Trophy, Users } from 'lucide-react';
import { NavyBadge } from '@/components/courses/NavyCard';
import { PhotoCard } from '@/components/courses/PhotoCard';
import { Avatar } from '@/components/ui/Avatar';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { LEVEL_TONE } from './trainingTones';
import { fmtHours } from './utils';
import type { Training } from './types';

interface TrainingCardProps {
  training: Training;
  onClick: () => void;
}

export function TrainingCard({ training, onClick }: TrainingCardProps) {
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
      badges={
        <>
          <NavyBadge tone={LEVEL_TONE[training.level]}>
            {LEVEL_CFG[training.level].label}
          </NavyBadge>
          {typeCfg && <NavyBadge tone="neutral">{typeCfg.label}</NavyBadge>}
          {training.mandatory && (
            <NavyBadge tone="danger">Obrigatório</NavyBadge>
          )}
        </>
      }
      metrics={[
        { icon: Clock, text: fmtHours(training.workloadHours) },
        ...(training.issueCertificate
          ? [{ icon: Trophy, text: 'Certificado' }]
          : []),
        {
          icon: Users,
          text: `${training._count.participants} inscritos`,
        },
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
        {
          icon: Star,
          text:
            training.avgRating != null
              ? `${training.avgRating.toFixed(1)} / 5`
              : 'Sem avaliação',
        },
      ]}
    />
  );
}
