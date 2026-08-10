// components/ai-tutor/HistoryView.tsx
// Vista "Histórico": lista de sessões + detalhe de mensagens de uma
// sessão seleccionada. Extraído de app/(platform)/ai-tutor/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime as fmtDate } from '@/lib/format';
import { Skeleton } from './atoms';
import type { Message, Session, SessionDetail } from './types';

export function HistoryView() {
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ messages: Message[] } | null>(null);

  const { data: sessionsResp, isLoading: loading } = useApiQuery<{
    data: Session[];
  }>(queryKeys.aiTutor.sessions(), '/ai-tutor/sessions', {
    staleTime: STALE_TIME.DYNAMIC,
  });
  const sessions = sessionsResp?.data ?? [];

  const loadDetail = async (id: number) => {
    setSelected(id);
    const s = await apiClient.get<SessionDetail>(`/ai-tutor/sessions/${id}`);
    setDetail({ messages: s.messages });
  };

  if (loading) return <Skeleton rows={4} />;

  if (selected && detail) {
    return (
      <div>
        <button
          onClick={() => {
            setSelected(null);
            setDetail(null);
          }}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          ← Voltar
        </button>
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 max-h-[65vh] overflow-y-auto">
          {detail.messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === 'USER'
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          onClick={() => loadDetail(s.id)}
          className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
            N
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">
              Sessão #{s.id}
              {s.course ? ` · ${s.course.title}` : ''}
            </div>
            <div className="text-xs text-gray-400">{fmtDate(s.startedAt)}</div>
          </div>
          <div className="text-xs text-gray-400 flex-shrink-0">
            {s._count?.messages ?? 0} mensagens
          </div>
          {s.endedAt ? (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
              Encerrada
            </span>
          ) : (
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
              Activa
            </span>
          )}
        </div>
      ))}
      {sessions.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
          Nenhuma sessão iniciada ainda
        </div>
      )}
    </div>
  );
}
