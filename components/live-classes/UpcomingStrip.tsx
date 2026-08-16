// components/live-classes/UpcomingStrip.tsx
// Faixa horizontal "Próximas Sessões" (ao vivo agora + agendadas).
// Migrada para design tokens.

import { fmtDate, getStatus } from './utils';
import { formatTime as fmtTime } from '@/lib/format';
import type { LiveClass } from './types';

export interface UpcomingStripProps {
  upcoming: LiveClass[];
  onOpen: (id: number) => void;
}

export function UpcomingStrip({ upcoming, onOpen }: UpcomingStripProps) {
  const visible = upcoming.filter(
    (lc) => getStatus(lc.scheduledAt, lc.duration) !== 'past',
  );
  if (visible.length === 0) return null;

  return (
    <div className="mb-5.5">
      <p className="m-0 mb-2.5 text-xs font-bold text-ink-muted uppercase tracking-widest">
        📅 Próximas Sessões
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {visible.map((lc) => {
          const status = getStatus(lc.scheduledAt, lc.duration);
          return (
            <div
              key={lc.id}
              onClick={() => onOpen(lc.id)}
              className={`flex-shrink-0 bg-surface rounded-3 p-3 cursor-pointer min-w-50 max-w-60 border ${
                status === 'live'
                  ? 'border-danger-subtle border-l-4 border-l-danger'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.25">
                {status === 'live' && (
                  <span
                    className="w-2 h-2 rounded-full bg-danger inline-block"
                    style={{ animation: 'lv-ping 1.2s ease-in-out infinite' }}
                  />
                )}
                <span
                  className={`text-xs font-black uppercase ${
                    status === 'live' ? 'text-danger' : 'text-warning'
                  }`}
                >
                  {status === 'live' ? 'Ao Vivo Agora' : 'Agendada'}
                </span>
              </div>
              <p className="m-0 text-sm font-bold text-ink overflow-hidden text-ellipsis whitespace-nowrap">
                {lc.topic}
              </p>
              <p className="mt-0.75 text-xs text-ink-muted">
                {fmtDate(lc.scheduledAt)} · {fmtTime(lc.scheduledAt)}
              </p>
              <div className="mt-2">
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-canvas text-xs font-bold ${
                    status === 'live' ? 'bg-danger' : 'bg-ink'
                  }`}
                >
                  {status === 'live' ? '▶ Entrar Agora' : 'Ver Sala'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
