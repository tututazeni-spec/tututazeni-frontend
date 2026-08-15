// components/content-library/ContentCard.tsx
// Cartão de conteúdo (grid completo ou variante compacta). Extraído de
// app/(platform)/content-library/page.tsx.

'use client';

import Image from 'next/image';
import { Bookmark, CheckCircle, Clock, Eye, Play, Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  FORMAT_CLS,
  FORMAT_CLS_FALLBACK,
  FORMAT_ICON,
  LEVEL_CLS,
} from './constants';
import type { Content } from './types';

export interface ContentCardProps {
  content: Content;
  onBookmark?: (id: number) => void;
  compact?: boolean;
}

export function ContentCard({
  content,
  onBookmark,
  compact = false,
}: ContentCardProps) {
  const Icon = FORMAT_ICON[content.type] ?? FORMAT_ICON.DEFAULT;
  const progress = content.progress?.progress ?? 0;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await apiClient.patch(`/content-library/${content.id}/bookmark`, {});
    onBookmark?.(content.id);
  };

  const handleView = async () => {
    await apiClient
      .patch(`/content-library/${content.id}/view`, {})
      .catch(() => {});
    window.open(content.url, '_blank');
  };

  if (compact)
    return (
      // Wrapper clicável implementado com div própria (role="button" +
      // tabIndex + onKeyDown manual) em vez do `Card` da fundação com a
      // prop `interactive` — bug conhecido (ver plano de rollout), mesmo
      // padrão já usado em components/micro-learning/MicroCard.tsx.
      <div
        onClick={handleView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleView();
          }
        }}
        className="flex cursor-pointer items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-resting transition-shadow duration-150 hover:shadow-hover"
      >
        <div
          className={`shrink-0 rounded-control p-2 ${FORMAT_CLS[content.type] ?? FORMAT_CLS_FALLBACK}`}
        >
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-medium text-ink">
            {content.title}
          </p>
          <p className="font-body text-[10px] text-ink-faint">
            {content.durationMin ? `${content.durationMin} min` : ''}{' '}
            {content.level ? `· ${content.level}` : ''}
          </p>
          {progress > 0 && (
            <ProgressBar value={progress} className="mt-1 h-1" />
          )}
        </div>
        {progress === 100 && (
          <CheckCircle
            size={14}
            strokeWidth={1.75}
            className="shrink-0 text-success"
          />
        )}
      </div>
    );

  return (
    <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-hover">
      {/* Thumbnail */}
      <div
        className="relative flex h-36 items-center justify-center bg-surface-sunken"
        onClick={handleView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleView();
          }
        }}
      >
        {content.thumbnailUrl ? (
          <Image
            src={content.thumbnailUrl}
            alt={content.title}
            fill
            className="object-cover"
          />
        ) : (
          <Icon size={24} strokeWidth={1.75} className="text-ink-faint" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-ink/20 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface/90 shadow-elevated">
            <Play size={18} strokeWidth={1.75} className="ml-0.5 text-ink" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1">
          {content.mandatory && (
            <span className="rounded bg-danger px-1.5 py-0.5 font-body text-[9px] font-bold text-canvas">
              OBRIG.
            </span>
          )}
          {content.hasCertification && (
            <span className="rounded bg-accent px-1.5 py-0.5 font-body text-[9px] font-bold text-canvas">
              CERT.
            </span>
          )}
          {content.isMicrolearning && (
            <span className="rounded bg-info px-1.5 py-0.5 font-body text-[9px] font-bold text-canvas">
              MICRO
            </span>
          )}
        </div>
        <button
          onClick={handleBookmark}
          aria-label={
            content.isBookmarked ? 'Remover dos guardados' : 'Guardar'
          }
          className="absolute right-2 top-2 rounded-full bg-surface/80 p-1.5 transition-colors hover:bg-surface"
        >
          <Bookmark
            size={14}
            strokeWidth={1.75}
            className={
              content.isBookmarked
                ? 'fill-accent text-accent'
                : 'text-ink-muted'
            }
          />
        </button>
        {/* Progress bar on thumbnail bottom — cor mono da fundação; o
            estado "concluído" que a cor original comunicava passa para o
            ícone de confirmação adjacente. */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-ink/10 px-1 py-0.5">
            <ProgressBar value={progress} className="h-1" />
            {progress === 100 && (
              <CheckCircle
                size={14}
                strokeWidth={1.75}
                className="shrink-0 text-success"
              />
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <CardBody className="p-3">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className={`rounded px-1.5 py-0.5 font-body text-[10px] font-medium ${FORMAT_CLS[content.type] ?? FORMAT_CLS_FALLBACK}`}
          >
            {content.type}
          </span>
          {content.level && (
            <span
              className={`font-body text-[10px] font-medium ${LEVEL_CLS[content.level] ?? 'text-ink-muted'}`}
            >
              {content.level}
            </span>
          )}
        </div>

        <h4 className="mb-1 line-clamp-2 font-body text-sm font-semibold leading-snug text-ink">
          {content.title}
        </h4>

        <div className="flex items-center gap-3 font-body text-[10px] text-ink-faint">
          {content.durationMin && (
            <span className="flex items-center gap-0.5">
              <Clock size={14} strokeWidth={1.75} />
              {content.durationMin} min
            </span>
          )}
          {content.avgRating && (
            <span className="flex items-center gap-0.5 text-accent">
              <Star size={14} strokeWidth={1.75} className="fill-accent" />
              {content.avgRating}
            </span>
          )}
          {content.viewCount !== undefined && (
            <span className="flex items-center gap-0.5">
              <Eye size={14} strokeWidth={1.75} />
              {content.viewCount}
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
