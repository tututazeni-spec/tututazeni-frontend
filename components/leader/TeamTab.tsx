// components/leader/TeamTab.tsx
// Tab "Equipa": resumo, pesquisa, lista de membros e modal de
// feedback. Extraído de app/(platform)/leader/page.tsx.

'use client';

import { useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, ProgressBar, Skeleton } from './atoms';
import { RISK_COLOR } from './constants';
import { FeedbackForm } from './FeedbackForm';
import type { TeamData } from './types';

export function TeamTab() {
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{
    userId: number;
    name: string;
  } | null>(null);
  const { data, isLoading: loading } = useApiQuery<TeamData>(
    queryKeys.leader.team(),
    '/leaders/my-team',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton />;

  const filtered = (data?.data ?? []).filter(
    (u) => !search || u.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: data.summary.headcount },
            {
              label: 'Em Risco',
              value: data.summary.atRisk,
              color:
                data.summary.atRisk > 0 ? 'text-red-600' : 'text-emerald-600',
            },
            {
              label: 'Score Médio',
              value: data.summary.avgScore?.toFixed(1) ?? '–',
            },
            {
              label: 'Tenure Médio',
              value: `${data.summary.avgTenureMonths}m`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-100 p-3 text-center"
            >
              <p className={`text-xl font-bold ${s.color ?? 'text-slate-800'}`}>
                {s.value}
              </p>
              <p className="text-[10px] text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pesquisar membro..."
        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
      />

      {/* Team list */}
      <div className="bg-white rounded-xl border border-slate-100">
        <div className="divide-y divide-slate-50">
          {filtered.map((u, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <Avatar name={u.fullName} url={u.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {u.fullName}
                </p>
                <p className="text-[10px] text-slate-400">
                  {u.position?.name} · {u.tenure}m empresa
                </p>
              </div>

              {/* PDI progress */}
              {u.activePlan && (
                <div className="w-20 hidden md:block">
                  <p className="text-[9px] text-slate-400 mb-0.5">PDI</p>
                  <ProgressBar
                    value={u.planProgress ?? 0}
                    color={
                      (u.planProgress ?? 0) >= 75
                        ? 'bg-emerald-500'
                        : 'bg-indigo-400'
                    }
                  />
                  <p className="text-[9px] text-slate-400 text-right">
                    {u.planProgress}%
                  </p>
                </div>
              )}

              {/* Score */}
              {u.latestPerfScore !== null && (
                <span
                  className={`text-sm font-bold ${(u.latestPerfScore ?? 0) >= 4 ? 'text-emerald-600' : (u.latestPerfScore ?? 0) >= 3 ? 'text-amber-600' : 'text-red-500'}`}
                >
                  {u.latestPerfScore?.toFixed(1)}
                </span>
              )}

              {/* Risk */}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${RISK_COLOR[u.riskLevel] ?? RISK_COLOR.NONE}`}
              >
                {u.riskLevel}
              </span>

              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() =>
                    setFeedback({ userId: u.id, name: u.fullName })
                  }
                  className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"
                  title="Dar feedback"
                >
                  <MessageSquare size={13} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem membros na equipa</p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback modal */}
      {feedback && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h4 className="font-bold text-slate-800 mb-4">
              Feedback para {feedback.name}
            </h4>
            <FeedbackForm
              recipientId={feedback.userId}
              onClose={() => setFeedback(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
