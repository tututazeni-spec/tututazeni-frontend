// components/learning-paths/LearningPathCard.tsx
// Cartão de trilha no catálogo. Extraído de
// app/(platform)/learning-paths/page.tsx.

'use client';

import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TypeBadge } from './atoms';
import { LP_LEVEL_MAP } from './constants';
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
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-900 relative overflow-hidden">
        {path.thumbnailUrl ? (
          <Image
            src={path.thumbnailUrl}
            alt={path.title}
            fill
            className="object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            🗺️
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <TypeBadge type={path.pathType} />
        </div>
        {path.mandatory && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded">
            Obrigatório
          </span>
        )}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1.5 bg-black/20">
              <div
                className="h-1.5 bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {path.category && (
          <div className="text-xs text-blue-600 font-medium mb-1">
            {path.category}
          </div>
        )}
        <div className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
          {path.title}
        </div>
        {path.shortDescription && (
          <div className="text-xs text-gray-500 mb-2 line-clamp-2">
            {path.shortDescription}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
          <span>📚 {path._count.courses} cursos</span>
          {path.totalHours > 0 && <span>⏱ {fmtHours(path.totalHours)}</span>}
          <StatusBadge value={path.level} map={LP_LEVEL_MAP} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            👥 {path._count.enrollments} inscritos
          </span>
          {enrolled && progress !== undefined && (
            <span
              className={`text-xs font-medium ${progress >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}
            >
              {progress >= 100 ? '✓ Concluído' : `${progress}%`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
