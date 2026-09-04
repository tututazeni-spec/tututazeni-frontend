// components/trainings/TrainingCard.tsx
// Cartão de treinamento no catálogo. Extraído de
// app/(platform)/trainings/page.tsx.

'use client';

import Image from 'next/image';
import { Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StarRating } from './StarRating';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { fmtHours } from './utils';
import type { Training } from './types';

interface TrainingCardProps {
  training: Training;
  onClick: () => void;
}

export function TrainingCard({ training, onClick }: TrainingCardProps) {
  const typeCfg = TYPE_CFG[training.type];

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary to-primary-active">
        {training.thumbnailUrl ? (
          <Image
            src={training.thumbnailUrl}
            alt=""
            fill
            className="object-cover opacity-80 transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-30">
            {typeCfg.icon}
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span
            className={cn(
              'rounded px-2 py-0.5 font-body text-xs font-medium',
              typeCfg.cls,
            )}
          >
            {typeCfg.icon} {typeCfg.label}
          </span>
        </div>
        {training.mandatory && (
          <span className="absolute right-2 top-2 rounded bg-danger px-2 py-0.5 font-body text-xs text-canvas">
            Obrigatório
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {training.category && (
          <div className="mb-1 font-body text-xs font-medium text-primary">
            {training.category}
          </div>
        )}
        <div className="mb-1 line-clamp-2 font-body text-sm font-semibold text-ink transition-colors group-hover:text-primary">
          {training.title}
        </div>
        {training.shortDescription && (
          <p className="mb-3 line-clamp-2 font-body text-xs text-ink-muted">
            {training.shortDescription}
          </p>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge value={training.level} map={LEVEL_CFG} />
          <span className="font-body text-xs text-ink-faint">
            <Clock
              size={13}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            {fmtHours(training.workloadHours)}
          </span>
          {training.issueCertificate && (
            <span className="flex items-center gap-1 font-body text-xs text-accent">
              <Trophy size={14} strokeWidth={1.75} /> Certificado
            </span>
          )}
        </div>

        {training.instructor && (
          <div className="mb-2 flex items-center gap-2">
            <Avatar
              name={training.instructor.fullName}
              url={training.instructor.avatarUrl ?? undefined}
              size="sm"
            />
            <span className="font-body text-xs text-ink-muted">
              {training.instructor.fullName}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <StarRating value={training.avgRating ?? null} />
          <span className="font-body text-xs text-ink-faint">
            {training._count.participants} inscritos
          </span>
        </div>
      </div>
    </Card>
  );
}
