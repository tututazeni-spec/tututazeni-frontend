// components/micro-learning/MicroCard.tsx
// Cartão de conteúdo usado no feed e nos guardados. Extraído de
// app/(platform)/micro-learning/page.tsx.
//
// Wrapper clicável implementado com div própria (role="button" +
// tabIndex + onKeyDown manual) em vez do `Card` da fundação com a prop
// `interactive` — bug conhecido (ver plano de rollout), mesmo padrão já
// usado em components/courses-learn/LessonRow.tsx.

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
      className="group cursor-pointer overflow-hidden rounded-card border border-border bg-surface shadow-resting transition-shadow duration-150 hover:shadow-hover"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-ink">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-40">
            {typeCfg.icon}
          </div>
        )}
        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 rounded bg-ink/70 px-2 py-0.5 font-data text-xs text-canvas">
          {fmtDuration(item.durationSeconds)}
        </div>
        {/* Type badge */}
        <div
          className={`absolute left-2 top-2 rounded px-2 py-0.5 font-body text-xs font-medium ${typeCfg.cls}`}
        >
          {typeCfg.icon} {typeCfg.label}
        </div>
        {/* Completed overlay */}
        {item.isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-success/40">
            <div className="rounded-full bg-success px-3 py-1 font-body text-xs font-medium text-canvas">
              ✓ Concluído
            </div>
          </div>
        )}
        {/* Progress bar */}
        {pct > 0 && !item.isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-ink/30">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="mb-2 line-clamp-2 font-body text-sm font-semibold leading-tight text-ink transition-colors group-hover:text-primary">
          {item.title}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StatusBadge value={item.level} map={LEVEL_CFG} />
            {item.tags.slice(0, 1).map((t) => (
              <span key={t} className="font-body text-xs text-ink-faint">
                #{t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 font-body text-xs text-ink-faint">
            <span>❤ {item._count.likes}</span>
            <span className="font-medium text-accent">+{item.xpReward}xp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
