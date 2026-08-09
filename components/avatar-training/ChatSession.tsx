// components/avatar-training/ChatSession.tsx
// Overlay de conversa com o avatar (envio de mensagens, score em tempo
// real, conclusão da sessão). Extraído de
// app/(platform)/avatar-training/page.tsx.

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Bot, CheckCircle, Send, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { SCORE_COLOR } from './constants';
import type {
  ActiveSession,
  MessageResponse,
  SessionMessage,
  SessionResult,
} from './types';

export interface ChatSessionProps {
  session: ActiveSession;
  onComplete: (result: SessionResult) => void;
  onClose: () => void;
}

export function ChatSession({
  session,
  onComplete,
  onClose,
}: ChatSessionProps) {
  const [messages, setMessages] = useState<SessionMessage[]>(
    session.conversationHistory ?? [],
  );
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [runningScore, setRunningScore] = useState<number | null>(null);
  const [isLastTurn, setIsLastTurn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const userMsg: SessionMessage = {
      role: 'USER',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const r = await apiClient.post<MessageResponse>(
        `/avatar-training/sessions/${session.id}/message`,
        {
          message: input,
          turnIndex: messages.filter((m) => m.role === 'USER').length,
        },
      );

      const avatarMsg: SessionMessage = {
        role: 'AVATAR',
        content: r.avatarResponse,
        timestamp: new Date().toISOString(),
        score: r.turnScore,
        behavioral: r.behavioral,
      };
      setMessages((prev) => [...prev, avatarMsg]);
      setRunningScore(r.runningScore);
      setIsLastTurn(r.isLastTurn);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'SYSTEM',
          content: '⚠️ Erro na comunicação',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const completeMutation = useApiMutation(
    () =>
      apiClient.post<SessionResult>(
        `/avatar-training/sessions/${session.id}/complete`,
        { score: runningScore ?? undefined },
      ),
    { onSuccess: (r) => onComplete(r) },
  );
  const completing = completeMutation.isPending;
  const complete = () => completeMutation.mutate(undefined);

  const avatarName = session.avatar?.name ?? 'Avatar';
  const avatarImage = session.avatar?.avatarImageUrl;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden shrink-0 relative">
            {avatarImage ? (
              <Image
                src={avatarImage}
                alt={avatarName}
                fill
                className="object-cover"
              />
            ) : (
              <Bot size={18} className="text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">{avatarName}</p>
            <p className="text-xs text-slate-400 truncate">
              {session.scenario.title}
            </p>
          </div>
          {runningScore !== null && (
            <div className="text-center px-3 py-1 rounded-lg bg-indigo-50">
              <p className={`text-lg font-bold ${SCORE_COLOR(runningScore)}`}>
                {runningScore}
              </p>
              <p className="text-[9px] text-slate-400">Score</p>
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Objective */}
        {session.scenario.objective && (
          <div className="px-5 py-2 bg-indigo-50 border-b border-indigo-100">
            <p className="text-xs text-indigo-700">
              🎯 <span className="font-medium">Objectivo:</span>{' '}
              {session.scenario.objective}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'} gap-2`}
            >
              {m.role === 'AVATAR' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] ${m.role === 'SYSTEM' ? 'mx-auto' : ''}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'USER'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : m.role === 'SYSTEM'
                        ? 'bg-slate-100 text-slate-500 text-xs text-center'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'AVATAR' && m.score !== undefined && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span
                      className={`text-[10px] font-bold ${SCORE_COLOR(m.score)}`}
                    >
                      Score: {m.score}
                    </span>
                    {m.behavioral && (
                      <div className="flex gap-1">
                        {Object.entries(m.behavioral)
                          .slice(0, 3)
                          .map(([k, v]) => (
                            <span key={k} className="text-[9px] text-slate-400">
                              {k.slice(0, 3)}: {v}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                <Bot size={12} className="text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 p-4">
          {isLastTurn ? (
            <button
              onClick={complete}
              disabled={completing}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              {completing ? 'A concluir…' : 'Concluir Sessão e Ver Resultados'}
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Escreve a tua resposta..."
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                aria-label="Enviar"
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                <Send size={16} />
              </button>
              <button
                onClick={complete}
                disabled={completing}
                className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-xl hover:bg-slate-50"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
