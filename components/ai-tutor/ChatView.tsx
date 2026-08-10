// components/ai-tutor/ChatView.tsx
// Vista "Chat": conversa em tempo real com o tutor IA (NOVA),
// incluindo início de sessão, envio de mensagens, rating e acções
// rápidas. Extraído de app/(platform)/ai-tutor/page.tsx.

'use client';

import { useEffect, useRef, useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { QUICK_ACTIONS } from './constants';
import { TypingDots } from './atoms';
import { MessageBubble } from './MessageBubble';
import type {
  Message,
  SendMessageResponse,
  StartSessionResponse,
} from './types';

export function ChatView() {
  const [session, setSession] = useState<{
    id: number;
    greeting: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [personality, setPersonality] = useState('FRIENDLY');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const startSession = useApiMutation(
    (p: string) =>
      apiClient.post<StartSessionResponse>('/ai-tutor/sessions', {
        personality: p,
      }),
    {
      onSuccess: (res) => {
        setSession({ id: res.session.id, greeting: res.greeting });
        setMessages([
          {
            id: 0,
            role: 'ASSISTANT',
            content: res.greeting,
            createdAt: new Date().toISOString(),
            latencyMs: null,
            rating: null,
            provider: res.provider?.provider ?? null,
            agentAction: null,
          },
        ]);
      },
      onError: (e) => alert(e.message),
    },
  );
  const starting = startSession.isPending;
  const start = () => startSession.mutate(personality);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || !session || thinking) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now(),
      role: 'USER',
      content: msg,
      createdAt: new Date().toISOString(),
      latencyMs: null,
      rating: null,
      provider: null,
      agentAction: null,
    };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const res = await apiClient.post<SendMessageResponse>(
        '/ai-tutor/sessions/message',
        {
          sessionId: session.id,
          message: msg,
        },
      );
      setMessages((prev) => [
        ...prev,
        {
          id: res.message.id,
          role: 'ASSISTANT',
          content: res.message.content,
          createdAt: res.message.createdAt,
          latencyMs: res.latencyMs,
          rating: null,
          provider: res.provider,
          agentAction: res.message.agentAction,
        },
      ]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'ASSISTANT',
          content: `⚠️ Erro: ${errMsg}`,
          createdAt: new Date().toISOString(),
          latencyMs: null,
          rating: null,
          provider: null,
          agentAction: null,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleRate = async (msgId: number, rating: number) => {
    await apiClient
      .patch('/ai-tutor/messages/rate', { messageId: msgId, rating })
      .catch(() => {});
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, rating } : m)),
    );
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold mb-5">
          N
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          NOVA — Tutor IA INNOVA
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
          O teu assistente de aprendizagem inteligente. Disponível 24/7 para
          dúvidas, quizzes, resumos e muito mais.
        </p>

        <div className="flex gap-2 mb-5">
          {[
            { id: 'FRIENDLY', label: '😊 Amigável' },
            { id: 'PROFESSIONAL', label: '💼 Profissional' },
            { id: 'COACH', label: '🎯 Coach' },
            { id: 'GAMIFIED', label: '🏆 Gamificado' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPersonality(p.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                personality === p.id
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <button
          onClick={start}
          disabled={starting}
          className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-60 shadow-lg shadow-blue-200"
        >
          {starting ? 'A iniciar…' : '🚀 Iniciar conversa com NOVA'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[75vh] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-700 to-purple-700 text-white">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
          N
        </div>
        <div>
          <div className="text-sm font-semibold">NOVA — Tutor IA</div>
          <div className="text-xs text-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Online · Sessão #{session.id}
          </div>
        </div>
        <button
          onClick={() => {
            setSession(null);
            setMessages([]);
          }}
          className="ml-auto text-xs text-white/60 hover:text-white"
        >
          Nova sessão
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} onRate={handleRate} />
        ))}
        {thinking && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold mr-2 flex-shrink-0">
              N
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => send(a.value)}
            className="flex-shrink-0 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 whitespace-nowrap"
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escreve a tua pergunta…"
          disabled={thinking}
          className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || thinking}
          className="px-4 py-2.5 bg-blue-700 text-white rounded-xl hover:bg-blue-800 disabled:opacity-40 font-medium text-sm"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
