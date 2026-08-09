// components/talent-development/MentoringTab.tsx
// Separador "Mentoria" — grelha de pares mentor/mentee filtrável por
// estado. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/talent-development/page.tsx.

'use client';

import { useState } from 'react';
import { Activity, ChevronRight, Clock, UserCheck } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import { STATUS_COLOR } from './constants';
import type { ListMeta, MentoringPair } from './types';

export function MentoringTab() {
  const [status, setStatus] = useState('ACTIVE');

  const params = { status, limit: 30 };
  const { data, isLoading } = useApiQuery<{
    data: MentoringPair[];
    meta: ListMeta;
  }>(queryKeys.talentDevelopment.mentoring(status), '/talent/mentoring', {
    params,
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        {['ACTIVE', 'COMPLETED', 'PAUSED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
              status === s
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          {data?.meta.total ?? 0} mentorias
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.data.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[m.status] ?? ''}`}
              >
                {m.status}
              </span>
              {m.reverseMentoring && (
                <span className="text-[10px] bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                  Reversa
                </span>
              )}
            </div>

            {/* Pair */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex flex-col items-center gap-1">
                <Avatar
                  name={m.mentor.fullName}
                  url={m.mentor.avatarUrl}
                  size={9}
                />
                <span className="text-[9px] text-indigo-600 font-semibold">
                  MENTOR
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <ChevronRight size={16} className="text-slate-300" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Avatar
                  name={m.mentee.fullName}
                  url={m.mentee.avatarUrl}
                  size={9}
                />
                <span className="text-[9px] text-emerald-600 font-semibold">
                  MENTEE
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-700 mb-1 truncate">
              {m.mentor.fullName}
            </p>
            <p className="text-xs text-slate-500 mb-2">→ {m.mentee.fullName}</p>

            {m.objective && (
              <p className="text-xs text-slate-400 italic mb-3 line-clamp-2">
                &quot;{m.objective}&quot;
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Activity size={11} />
                {m._count?.sessions ?? 0} sessões
              </span>
              {m.durationMonths && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {m.durationMonths}m
                </span>
              )}
            </div>
          </div>
        ))}

        {(data?.data.length ?? 0) === 0 && (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma mentoria {status.toLowerCase()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
