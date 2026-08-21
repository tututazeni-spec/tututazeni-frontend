// components/ai-tutor/ChatView.tsx
// Vista "Chat": conversa em tempo real com o tutor IA (Ísis),
// incluindo início de sessão, envio de mensagens, rating e acções
// rápidas. Extraído de app/(platform)/ai-tutor/page.tsx.

'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/providers/ToastProvider';
import { QUICK_ACTIONS } from './constants';
import { MessageBubble } from './MessageBubble';
import type {
  Message,
  SendMessageResponse,
  StartSessionResponse,
} from './types';

const PERSONALITIES = [
  { id: 'FRIENDLY', label: 'Amigável' },
  { id: 'PROFESSIONAL', label: 'Profissional' },
  { id: 'COACH', label: 'Coach' },
  { id: 'GAMIFIED', label: 'Gamificado' },
] as const;

// Avatar da Ísis — substitui o antigo círculo com a letra "N".
// A imagem fica em: public/images/isis-avatar.png
function IsisAvatar({
  size = 'md',
  onClick,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}) {
  const dimensions = {
    sm: 64,
    md: 88,
    lg: 192,
  }[size];

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-full overflow-hidden border-2 border-[#D4A017] flex-shrink-0 ${
        onClick
          ? 'hover:scale-105 transition-transform duration-300 cursor-pointer'
          : ''
      } ${className}`}
      style={{ width: dimensions, height: dimensions }}
    >
      <Image
        src="/images/isis-avatar.png"
        alt="Ísis - Tutor IA"
        width={dimensions}
        height={dimensions}
        className="object-cover w-full h-full"
      />
    </Wrapper>
  );
}

export function ChatView() {
  const notify = useToast();
  const [session, setSession] = useState<{
    id: number;
    greeting: string;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [personality, setPersonality] = useState('FRIENDLY');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Faz a Ísis "falar" um texto em voz alta, usando a voz
  // já incorporada no navegador (não precisa de nenhum serviço externo).
  const speak = (text: string) => {
    if (!voiceEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // evita sobrepor falas anteriores
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-PT';
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

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
        speak(res.greeting);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
      speak(res.message.content);
    } catch (e) {
      reportError(e, { source: 'ChatView.sendMessage' });
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
    try {
      await apiClient.patch('/ai-tutor/messages/rate', {
        messageId: msgId,
        rating,
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, rating } : m)),
      );
    } catch (e) {
      reportError(e, { source: 'ChatView.handleRate' });
      notify({
        title: 'Não foi possível avaliar a mensagem',
        intent: 'danger',
      });
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <IsisAvatar size="lg" onClick={start} className="mb-5" />
        <p className="font-body text-sm text-ink-faint mb-6 text-center max-w-sm">
          O teu assistente de aprendizagem inteligente. Disponível 24/7 para
          dúvidas, questionários, resumos e muito mais.
        </p>

        <div className="flex gap-2 mb-5">
          {PERSONALITIES.map((p) => (
            <Button
              key={p.id}
              size="sm"
              intent={personality === p.id ? 'primary' : 'secondary'}
              onClick={() => setPersonality(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <Button onClick={start} loading={starting}>
          {starting ? 'A iniciar…' : 'Iniciar conversa com Ísis'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[75vh] bg-surface border border-border rounded-panel overflow-hidden shadow-resting">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-canvas">
        <IsisAvatar size="md" />
        <div>
          <div className="font-body text-sm font-semibold">Ísis — Tutor IA</div>
          <div className="font-body text-xs text-canvas/80 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            Online · Sessão #{session.id}
          </div>
        </div>
        <button
          onClick={() => setVoiceEnabled((v) => !v)}
          className="ml-auto text-canvas/80 hover:text-canvas"
          title={voiceEnabled ? 'Desligar voz' : 'Ligar voz'}
        >
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          onClick={() => {
            setSession(null);
            setMessages([]);
          }}
          className="font-body text-xs text-canvas/70 hover:text-canvas"
        >
          Nova sessão
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface-sunken">
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} onRate={handleRate} />
        ))}
        {thinking && (
          <div className="flex justify-start mb-3">
            <IsisAvatar size="sm" className="mr-2" />
            <div className="bg-surface border border-border rounded-card shadow-resting">
              <div className="flex items-center gap-1 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-accent rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 py-2 bg-surface border-t border-border flex gap-1.5 overflow-x-auto">
        {QUICK_ACTIONS.map((a) => (
          <Button
            key={a.label}
            size="sm"
            intent="secondary"
            onClick={() => send(a.value)}
            className="flex-shrink-0 whitespace-nowrap"
          >
            {a.label}
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-3 bg-surface border-t border-border flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Escreve a tua pergunta…"
          disabled={thinking}
          className="flex-1"
        />
        <IconButton
          icon={Send}
          label="Enviar mensagem"
          onClick={() => send()}
          disabled={!input.trim() || thinking}
        />
      </div>
    </div>
  );
}
