// components/learning-paths/LearningPathCard.tsx
// Cartão de trilha no catálogo. Extraído de
// app/(platform)/learning-paths/page.tsx. Migrado para a fundação de
// design: wrapper clicável passa a Card (sem a prop `interactive` — bug
// conhecido, mesmo padrão de components/trainings/TrainingCard.tsx);
// TypeBadge/nível passam a StatusBadge; badge "Obrigatório" passa a Badge.

'use client';

import { Map, BookOpen, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LP_LEVEL_MAP, LP_TYPE_MAP } from './constants';
import { fmtHours } from './utils';
import type { LearningPath } from './types';

interface LearningPathCardProps {
  path: LearningPath;
  onClick: () => void;
  enrolled?: boolean;
  progress?: number;
}

export function LearningPathCard({
  path,
  onClick,
  enrolled,
  progress,
}: LearningPathCardProps) {
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
        {path.thumbnailUrl ? (
          <Image
            src={path.thumbnailUrl}
            alt={path.title}
            fill
            className="object-cover opacity-80 transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Map size={44} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          <StatusBadge value={path.pathType} map={LP_TYPE_MAP} />
        </div>
        {path.mandatory && (
          <Badge intent="danger" className="absolute right-2 top-2">
            Obrigatório
          </Badge>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1.5 bg-ink/20">
              <div
                className="h-1.5 bg-surface"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {path.category && (
          <div className="mb-1 font-body text-xs font-medium text-primary">
            {path.category}
          </div>
        )}
        <div className="mb-1 line-clamp-2 font-body text-sm font-semibold text-ink">
          {path.title}
        </div>
        {path.shortDescription && (
          <div className="mb-2 line-clamp-2 font-body text-xs text-ink-muted">
            {path.shortDescription}
          </div>
        )}
        <div className="mb-2 flex items-center gap-3 font-body text-xs text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <BookOpen size={12} strokeWidth={1.75} /> {path._count.courses}{' '}
            cursos
          </span>
          {path.totalHours > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} strokeWidth={1.75} /> {fmtHours(path.totalHours)}
            </span>
          )}
          <StatusBadge value={path.level} map={LP_LEVEL_MAP} />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-ink-faint">
            <Users
              size={12}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            {path._count.enrollments} inscritos
          </span>
          {enrolled && progress !== undefined && (
            <span
              className={`font-body text-xs font-medium ${progress >= 100 ? 'text-success' : 'text-info'}`}
            >
              {progress >= 100 ? '✓ Concluído' : `${progress}%`}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
