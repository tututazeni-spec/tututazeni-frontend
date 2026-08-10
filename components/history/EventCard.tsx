// components/history/EventCard.tsx
// Cartão de evento da timeline, com variante compacta e detalhe
// expansível. Extraído de app/(platform)/history/page.tsx.

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
          <p className="text-xs font-medium text-slate-700 truncate">
            {event.title}
          </p>
          <p className="text-[10px] text-slate-400">
            {new Date(event.timestamp).toLocaleDateString('pt')}
          </p>
        </div>
        {event.milestone && (
          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">
            MARCO
          </span>
        )}
      </div>
    );

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all
        ${event.milestone ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-100'}
        hover:shadow-sm`}
    >
      {/* Icon circle */}
      <div
        className={`w-8 h-8 rounded-full ${cat.bg} flex items-center justify-center text-sm shrink-0 mt-0.5`}
      >
        {event.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <p className="text-sm font-semibold text-slate-800">{event.title}</p>
          {event.milestone && (
            <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
              ⭐ MARCO
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400">
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
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
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
              ? 'bg-emerald-100 text-emerald-700'
              : event.impactScore >= 50
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {event.impactScore}
        </span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </div>
    </div>
  );
}
