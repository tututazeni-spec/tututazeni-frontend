// components/engagement/RecognitionTab.tsx
// Separador "Reconhecimento" — feed de kudos + leaderboard. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/engagement/page.tsx.

'use client';

import { useState } from 'react';
import { Heart, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import type { LeaderboardEntry, Recognition } from './types';

export function RecognitionTab() {
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTo, setKudosTo] = useState('');

  const feedQuery = useApiQuery<{ data: Recognition[] }>(
    queryKeys.engagement.recognitionFeed(),
    '/engagement/recognition/feed',
    { params: { limit: 20 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const boardQuery = useApiQuery<LeaderboardEntry[]>(
    queryKeys.engagement.recognitionLeaderboard(),
    '/engagement/recognition/leaderboard',
    {
      params: { type: 'points', limit: 10 },
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );

  const feed = feedQuery.data?.data ?? [];
  const board = boardQuery.data ?? [];

  if (feedQuery.isLoading || boardQuery.isLoading) return <Skeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Feed */}
      <div className="lg:col-span-2 space-y-4">
        {/* Quick kudos box */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 mb-3">👏 Dar Kudos</h3>
          <div className="flex gap-2">
            <input
              value={kudosTo}
              onChange={(e) => setKudosTo(e.target.value)}
              placeholder="@colaborador..."
              className="w-32 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
            />
            <input
              value={kudosMsg}
              onChange={(e) => setKudosMsg(e.target.value)}
              placeholder="Escreve uma mensagem de reconhecimento..."
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400"
            />
            <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">
              Enviar 🏆
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          {feed.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-100 p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  name={r.from?.fullName ?? 'User'}
                  url={r.from?.avatarUrl}
                  size={10}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-700">
                      {r.from?.fullName}
                    </span>
                    <span className="text-xs text-slate-400">reconheceu</span>
                    <span className="text-sm font-semibold text-violet-700">
                      {r.to?.fullName}
                    </span>
                    <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                      {r.type === 'KUDOS'
                        ? '👏 Kudos'
                        : r.type === 'ACHIEVEMENT'
                          ? '🏆 Achievement'
                          : r.type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{r.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString('pt')}
                    {r.to?.department?.name && ` · ${r.to.department.name}`}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {feed.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Heart size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum reconhecimento ainda</p>
              <p className="text-xs">Sê o primeiro a reconhecer um colega!</p>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit">
        <h3 className="font-semibold text-slate-700 mb-4">🏅 Leaderboard</h3>
        <div className="space-y-3">
          {board.map((u, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className={`w-6 text-center text-sm font-bold ${
                  i === 0
                    ? 'text-amber-500'
                    : i === 1
                      ? 'text-slate-400'
                      : i === 2
                        ? 'text-amber-700'
                        : 'text-slate-400'
                }`}
              >
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <Avatar
                name={u.user?.fullName ?? 'User'}
                url={u.user?.avatarUrl}
                size={8}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {u.user?.fullName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {u.user?.position?.name}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-violet-600">
                <Zap size={12} className="text-amber-400" />
                {u.points ?? u.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
