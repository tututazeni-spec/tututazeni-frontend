// components/micro-learning/MicroCard.tsx
// Cartão de conteúdo usado no feed e nos guardados. Extraído de
// app/(platform)/micro-learning/page.tsx.

'use client';

import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { fmtDuration } from './utils';
import type { MicroLearning } from './types';

interface MicroCardProps {
  item: MicroLearning;
  onClick: () => void;
}

export function MicroCard({ item, onClick }: MicroCardProps) {
  const typeCfg = TYPE_CFG[item.contentType];
  const pct = item.userProgress?.progress ?? 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">
            {typeCfg.icon}
          </div>
        )}
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
          {fmtDuration(item.durationSeconds)}
        </div>
        {/* Type badge */}
        <div
          className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}
        >
          {typeCfg.icon} {typeCfg.label}
        </div>
        {/* Completed overlay */}
        {item.isCompleted && (
          <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center">
            <div className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              ✓ Concluído
            </div>
          </div>
        )}
        {/* Progress bar */}
        {pct > 0 && !item.isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div className="h-full bg-blue-400" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-2 group-hover:text-blue-700 transition-colors">
          {item.title}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StatusBadge value={item.level} map={LEVEL_CFG} />
            {item.tags.slice(0, 1).map((t) => (
              <span key={t} className="text-xs text-gray-400">
                #{t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>❤ {item._count.likes}</span>
            <span className="text-amber-500 font-medium">
              +{item.xpReward}xp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
