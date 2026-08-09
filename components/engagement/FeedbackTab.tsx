// components/engagement/FeedbackTab.tsx
// Separador "Feedback" — envio + lista filtrável de feedback. Dados
// próprios (useApiQuery + apiClient.post directo) + apresentação.
// Extraído de app/(platform)/engagement/page.tsx.
//
// `userId` nunca é passado pelo container (page.tsx renderiza
// `<FeedbackTab />` sem prop) — mesmo padrão (não corrigido aqui) de
// components/evaluation/OverviewTab.tsx.

'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Skeleton } from './atoms';
import type { FeedbackItem } from './types';

const TYPE_COLOR: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  ANONYMOUS: 'bg-slate-100 text-slate-600',
  PEER: 'bg-violet-100 text-violet-700',
  MANAGER: 'bg-amber-100 text-amber-700',
  RECOGNITION: 'bg-emerald-100 text-emerald-700',
};

export interface FeedbackTabProps {
  userId?: number;
}

export function FeedbackTab({ userId }: FeedbackTabProps) {
  const [type, setType] = useState('');
  const [msg, setMsg] = useState('');
  const [anon, setAnon] = useState(false);

  const params = { limit: 20, ...(type ? { type } : {}) };
  const {
    data: resp,
    isLoading,
    refetch,
  } = useApiQuery<{ data: FeedbackItem[] }>(
    queryKeys.engagement.feedback(type),
    '/engagement/feedback',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const data = resp?.data ?? [];

  const send = async () => {
    if (!msg.trim()) return;
    await apiClient.post('/engagement/feedback', {
      type: type || 'OPEN',
      message: msg,
      anonymous: anon,
    });
    setMsg('');
    refetch();
  };

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-4">
      {/* New feedback box */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-700 mb-3">💬 Novo Feedback</h3>
        <div className="flex gap-2 mb-3">
          {['OPEN', 'PEER', 'MANAGER'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                type === t
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 text-slate-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={3}
          placeholder="Escreve o teu feedback..."
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={anon}
              onChange={(e) => setAnon(e.target.checked)}
              className="rounded"
            />
            Enviar anonimamente
          </label>
          <button
            onClick={send}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
          >
            Enviar
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'OPEN', 'ANONYMOUS', 'PEER', 'MANAGER'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              type === t
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {t || 'Todos'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {data.map((f, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar
                  name={f.from?.fullName ?? 'Anónimo'}
                  url={f.from?.avatarUrl}
                  size={8}
                />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {f.from?.fullName ?? 'Anónimo'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(f.createdAt).toLocaleDateString('pt')}
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[f.type] ?? ''}`}
              >
                {f.type}
              </span>
            </div>
            <p className="text-sm text-slate-600 ml-10">{f.message}</p>
            {f.reply && (
              <div className="mt-2 ml-10 p-2 bg-slate-50 rounded-lg border-l-2 border-indigo-400">
                <p className="text-xs text-slate-500">Resposta:</p>
                <p className="text-xs text-slate-700">{f.reply}</p>
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <MessageSquare size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum feedback encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
