// components/history/EventCard.tsx
// Cartão de evento da timeline, com variante compacta e detalhe
// expansível. Extraído de app/(platform)/history/page.tsx.

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CATEGORY_COLOR } from './constants';
import type { TimelineEvent } from './types';

interface EventCardProps {
  event: TimelineEvent;
  compact?: boolean;
}

export function EventCard({ event, compact = false }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_COLOR[event.category] ?? CATEGORY_COLOR.SYSTEM;

  if (compact)
    return (
      <div className="flex items-center gap-3 py-2">
        <span className="text-base shrink-0">{event.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-ink truncate">
            {event.title}
          </p>
          <p className="text-[10px] text-ink-faint">
            {new Date(event.timestamp).toLocaleDateString('pt')}
          </p>
        </div>
        {event.milestone && (
          <span className="text-[9px] bg-warning-subtle text-warning-ink px-1.5 py-0.5 rounded-pill font-medium shrink-0">
            MARCO
          </span>
        )}
      </div>
    );

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'flex items-start gap-3 p-3 rounded-card border shadow-resting transition-shadow duration-150 cursor-pointer hover:shadow-hover',
        event.milestone
          ? 'bg-warning-subtle border-warning'
          : 'bg-surface border-border',
      )}
    >
      {/* Icon circle */}
      <div
        className={`w-8 h-8 rounded-full ${cat.bg} flex items-center justify-center text-sm shrink-0 mt-0.5`}
      >
        {event.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-ink">{event.title}</p>
          {event.milestone && (
            <span className="text-[9px] bg-warning-subtle text-warning-ink px-1.5 py-0.5 rounded-pill font-bold">
              ⭐ MARCO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-ink-faint">
          <span
            className={`px-1.5 py-0.5 rounded font-medium ${cat.color} ${cat.bg}`}
          >
            {event.category}
          </span>
          <span>·</span>
          <span>{event.module}</span>
          <span>·</span>
          <span>
            {new Date(event.timestamp).toLocaleDateString('pt', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {event.user && (
            <>
              <span>·</span>
              <span>{event.user.fullName}</span>
            </>
          )}
        </div>

        {expanded && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs text-ink-muted">
              <div>
                <span className="font-medium">Entidade:</span> {event.entity}
              </div>
              {event.entityId && (
                <div>
                  <span className="font-medium">ID:</span> {event.entityId}
                </div>
              )}
              <div>
                <span className="font-medium">Impact:</span> {event.impactScore}
                /100
              </div>
              <div>
                <span className="font-medium">Módulo:</span> {event.module}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-1.5">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            event.impactScore >= 75
              ? 'bg-success-subtle text-success-ink'
              : event.impactScore >= 50
                ? 'bg-warning-subtle text-warning-ink'
                : 'bg-surface-sunken text-ink-faint'
          }`}
        >
          {event.impactScore}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className={`text-ink-faint transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>
    </div>
  );
}
