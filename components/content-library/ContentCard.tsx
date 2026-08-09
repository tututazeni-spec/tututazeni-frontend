// components/content-library/ContentCard.tsx
// Cartão de conteúdo (grid completo ou variante compacta). Extraído de
// app/(platform)/content-library/page.tsx.

'use client';

import Image from 'next/image';
import { Bookmark, CheckCircle, Clock, Eye, Play, Star } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { ProgressBar } from './atoms';
import { FORMAT_COLOR, FORMAT_ICON, LEVEL_COLOR } from './constants';
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
        className="bg-white rounded-lg border border-slate-100 p-3 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer"
      >
        <div
          className={`p-2 rounded-lg shrink-0 ${FORMAT_COLOR[content.type] ?? 'bg-slate-100 text-slate-600'}`}
        >
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {content.title}
          </p>
          <p className="text-[10px] text-slate-400">
            {content.durationMin ? `${content.durationMin} min` : ''}{' '}
            {content.level ? `· ${content.level}` : ''}
          </p>
          {progress > 0 && <ProgressBar value={progress} height="h-0.5" />}
        </div>
        {progress === 100 && (
          <CheckCircle size={14} className="text-emerald-500 shrink-0" />
        )}
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
      {/* Thumbnail */}
      <div
        className="relative bg-gradient-to-br from-slate-100 to-slate-200 h-36 flex items-center justify-center"
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
          <Icon size={32} className="text-slate-400" />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play size={18} className="text-slate-800 ml-0.5" />
          </div>
        </div>
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {content.mandatory && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
              OBRIG.
            </span>
          )}
          {content.hasCertification && (
            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
              CERT.
            </span>
          )}
          {content.isMicrolearning && (
            <span className="bg-violet-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
              MICRO
            </span>
          )}
        </div>
        <button
          onClick={handleBookmark}
          aria-label={
            content.isBookmarked ? 'Remover dos guardados' : 'Guardar'
          }
          className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
        >
          <Bookmark
            size={13}
            className={
              content.isBookmarked
                ? 'text-indigo-600 fill-indigo-600'
                : 'text-slate-500'
            }
          />
        </button>
        {/* Progress bar on thumbnail bottom */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <ProgressBar
              value={progress}
              color={progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}
              height="h-1"
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FORMAT_COLOR[content.type] ?? 'bg-slate-100 text-slate-600'}`}
          >
            {content.type}
          </span>
          {content.level && (
            <span
              className={`text-[10px] font-medium ${LEVEL_COLOR[content.level] ?? 'text-slate-500'}`}
            >
              {content.level}
            </span>
          )}
        </div>

        <h4 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 mb-1">
          {content.title}
        </h4>

        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          {content.durationMin && (
            <span className="flex items-center gap-0.5">
              <Clock size={10} />
              {content.durationMin} min
            </span>
          )}
          {content.avgRating && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <Star size={10} className="fill-amber-400" />
              {content.avgRating}
            </span>
          )}
          {content.viewCount !== undefined && (
            <span className="flex items-center gap-0.5">
              <Eye size={10} />
              {content.viewCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
