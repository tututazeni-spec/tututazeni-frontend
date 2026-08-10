// components/leadership/MyDashboardView.tsx
// Separador "O meu painel" — score, programas, 1:1s e kudos. Dados
// próprios (useApiQuery/useApiMutation) + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { CLASS_CFG, LEVEL_CFG } from './constants';
import type {
  KudosItem,
  LeadershipScore,
  MyDashboardData,
  OneOnOne,
  ProgramLevel,
} from './types';

export function MyDashboardView() {
  const [kudosMsg, setKudosMsg] = useState('');
  const [kudosTarget, setKudosTarget] = useState('');

  const { data, isLoading } = useApiQuery<MyDashboardData>(
    queryKeys.leadership.myDashboard(),
    '/leadership/my/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const kudosMutation = useApiMutation(
    () =>
      apiClient.post('/leadership/kudos', {
        receiverId: parseInt(kudosTarget),
        message: kudosMsg,
        badge: '⭐',
      }),
    {
      onSuccess: () => {
        setKudosMsg('');
        setKudosTarget('');
        alert('Kudos enviados! 🎉');
      },
      onError: (e) => alert(e.message),
    },
  );
  const sendingKudos = kudosMutation.isPending;
  const handleKudos = () => {
    if (kudosMsg && kudosTarget) kudosMutation.mutate(undefined);
  };

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  const score: LeadershipScore | null = data.score;
  const classCfg = score
    ? (CLASS_CFG[score.classification] ?? CLASS_CFG.AVERAGE)
    : null;

  return (
    <div className="space-y-6">
      {/* Score card */}
      {score && (
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl p-6 flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-200 mb-1">Leadership Score</div>
            <div className="text-5xl font-bold font-mono">{score.score}</div>
            <div className="text-sm text-blue-200 mt-1">de 1000 pontos</div>
          </div>
          <div className="text-right">
            {classCfg && (
              <span
                className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 text-white`}
              >
                {classCfg.label}
              </span>
            )}
            <div className="text-xs text-blue-300 mt-2">
              Actualizado {fmtDate(score.calculatedAt)}
            </div>
          </div>
        </div>
      )}

      {!score && (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
          Sem Leadership Score calculado ainda
        </div>
      )}

      {/* Grid: programas + 1:1s */}
      <div className="grid grid-cols-2 gap-5">
        {/* Programas */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Os meus programas
          </div>
          <div className="space-y-2">
            {data.programs?.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {p.program?.name}
                  </div>
                  <StatusBadge
                    value={p.program?.level as ProgramLevel}
                    map={LEVEL_CFG}
                  />
                </div>
                <ProgressBar
                  pct={p.progress}
                  color={
                    p.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'
                  }
                />
                <div className="text-xs text-gray-400 mt-1">{p.status}</div>
              </div>
            ))}
            {(!data.programs || data.programs.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Sem programas inscritos
              </div>
            )}
          </div>
        </div>

        {/* 1:1s próximos */}
        <div>
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Próximos 1:1s
          </div>
          <div className="space-y-2">
            {data.upcoming1on1s?.map((m: OneOnOne) => (
              <div
                key={m.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3"
              >
                <Avatar
                  name={m.subordinate.fullName}
                  avatarUrl={m.subordinate.avatarUrl}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {m.subordinate.fullName}
                  </div>
                  <div className="text-xs text-gray-400">
                    {fmtDate(m.scheduledAt)} · {m.durationMinutes}min
                  </div>
                </div>
                {m.meetingUrl && (
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex-shrink-0"
                  >
                    Entrar
                  </a>
                )}
              </div>
            ))}
            {(!data.upcoming1on1s || data.upcoming1on1s.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Sem 1:1s agendados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kudos recebidos + enviar */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-3">
          Reconhecimentos recebidos
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {data.recentKudos?.slice(0, 5).map((k: KudosItem) => (
              <div
                key={k.id}
                className="bg-amber-50 border border-amber-200 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{k.badge ?? '⭐'}</span>
                  <span className="text-xs font-medium text-amber-800">
                    {k.sender.fullName}
                  </span>
                  <span className="text-xs text-amber-500 ml-auto">
                    {fmtDate(k.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-amber-700">{k.message}</p>
              </div>
            ))}
            {(!data.recentKudos || data.recentKudos.length === 0) && (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">
                Sem kudos recebidos ainda
              </div>
            )}
          </div>

          {/* Enviar kudos */}
          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-700 mb-3">
              ⭐ Dar kudos a colega
            </div>
            <input
              type="number"
              placeholder="ID do colega"
              value={kudosTarget}
              onChange={(e) => setKudosTarget(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Escreve uma mensagem de reconhecimento…"
              value={kudosMsg}
              onChange={(e) => setKudosMsg(e.target.value)}
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <button
              onClick={handleKudos}
              disabled={!kudosMsg || !kudosTarget || sendingKudos}
              className="w-full py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50"
            >
              {sendingKudos ? 'A enviar…' : '⭐ Enviar Kudos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
